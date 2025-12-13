# Concurrency Review: Executive Summary

## Status: ANALYSIS COMPLETE - NO CHANGES MADE YET

**Date:** December 14, 2025  
**Scope:** Backend review only (no API/test changes)  
**Finding:** Current implementation is **unsafe for multi-worker production deployment**

---

## Key Findings

### 🔴 CRITICAL: Two Race Conditions in Inventory Operations

#### 1. Purchase Overselling Risk
- **Location:** `backend/app/crud.py` - `purchase_sweet()` (lines 89-104)
- **Issue:** Unprotected read-modify-write allows concurrent requests to oversell stock
- **Scenario:** With 2 units available, 3 concurrent requests can all succeed
- **Result:** Negative inventory, business loss

**Current code:**
```python
sweet = db.query(models.Sweet).filter(models.Sweet.id == sweet_id).first()
if sweet.quantity <= 0:
    return None, "out_of_stock"  # ← Multiple requests can all pass this check
sweet.quantity -= 1               # ← All decrement the same value
db.commit()                        # ← Lost updates occur here
```

#### 2. Restock Lost Update Risk
- **Location:** `backend/app/crud.py` - `restock_sweet()` (lines 107-117)
- **Issue:** Concurrent restock operations can lose updates
- **Scenario:** Restock +50 and purchase -1 simultaneously → one operation lost
- **Result:** Inventory inconsistency

#### 3. Username Registration Race (Medium Severity)
- **Location:** `backend/app/main.py` - `register()` (lines 14-21)
- **Issue:** Check-then-act race allows duplicate usernames to bypass validation
- **Scenario:** Two concurrent registrations with same username → both pass check
- **Result:** 500 error instead of 400 (not data corruption; DB constraint prevents duplicates)

---

## Deployment Safety Assessment

| Deployment Type | Current Status | With Fixes |
|---|---|---|
| Single-worker (1 Uvicorn) | ✅ Safe | ✅ Safe |
| Multi-worker (Gunicorn 4+) | ❌ **UNSAFE** | ✅ Safe |
| Production (any) | ❌ **NOT RECOMMENDED** | ✅ Production-ready |

---

## Why This Happens

SQLAlchemy's object-level ORM doesn't protect read-modify-write operations:

```python
# What we write:
sweet.quantity -= 1
db.commit()

# What the database sees:
SELECT quantity FROM sweets WHERE id=X;  -- Read outside transaction
UPDATE sweets SET quantity=? WHERE id=X; -- Write based on stale data

# Result: Multiple threads read the same value, all write their modifications,
#         last write wins, earlier updates are lost
```

**Root cause:** No row-level locks acquired on read  
**Why tests pass:** Tests run sequentially, never triggering concurrency  
**When it manifests:** Multi-worker deployment, concurrent load, real production scenarios

---

## Recommended Fixes

### MUST FIX (Required for Production)

**Fix #1: Add Pessimistic Locking to `purchase_sweet()`**
```python
# Before:
sweet = db.query(models.Sweet).filter(models.Sweet.id == sweet_id).first()

# After:
sweet = db.query(models.Sweet).filter(
    models.Sweet.id == sweet_id
).with_for_update().first()  # ← Acquires row-level lock
```
- **Effort:** 5 minutes
- **Effect:** Serializes purchases, prevents overselling
- **Trade-off:** Slightly higher latency under high load (acceptable)

**Fix #2: Add Pessimistic Locking to `restock_sweet()`**
```python
# Same pattern as Fix #1
sweet = db.query(models.Sweet).filter(
    models.Sweet.id == sweet_id
).with_for_update().first()
```
- **Effort:** 5 minutes
- **Effect:** Ensures restock operations don't lose updates

**Fix #3: Handle Registration Race Condition**
```python
# Wrap create_user in try-except for IntegrityError
try:
    user = crud.create_user(db, user=user_in, is_admin=is_admin)
    return user
except IntegrityError:
    db.rollback()
    raise HTTPException(status_code=400, detail="Username already registered")
```
- **Effort:** 10 minutes
- **Effect:** Returns proper 400 error instead of 500

---

## Implementation Plan

**Total effort:** ~30 minutes  
**Breaking changes:** None (tests still pass, API unchanged)  
**Risk level:** Very low (well-established SQLAlchemy pattern)

**Steps:**
1. Implement Fix #1: `purchase_sweet()` with_for_update()
2. Implement Fix #2: `restock_sweet()` with_for_update()
3. Implement Fix #3: IntegrityError handling in register()
4. Run existing test suite (should still pass 42/42)
5. Optional: Run concurrent load test to verify fix works

---

## Full Analysis

See `CONCURRENCY_REVIEW.md` for:
- Detailed race condition scenarios
- Specific code paths affected
- Database-specific considerations
- Load testing recommendations
- Why this doesn't impact single-worker deployments

---

## What This Means

### Today (Without Fixes)
- ✅ Safe: Single-worker, development, testing
- ❌ Unsafe: Multi-worker, production, high concurrency

### Tomorrow (With Fixes)
- ✅ Safe: All deployments
- ✅ Production-ready: Horizontal scaling possible
- ✅ No API changes: Tests and contracts preserved

---

## Recommendation

**Implement all 3 fixes immediately** before any production deployment or horizontal scaling.

This is **not optional** for production; it's a **required data integrity fix**.

**Timeline:** Can be completed and tested within 1-2 hours  
**Risk of not fixing:** Potential inventory overselling, customer/business impact
