# Concurrency & Data Integrity Review
## Sweet Shop Management System Backend

**Date:** December 14, 2025  
**Scope:** Backend codebase (SQLAlchemy ORM, FastAPI, Inventory operations)  
**Focus:** Race conditions, transaction safety, concurrency risks  
**Status:** ANALYSIS ONLY (No code changes proposed yet)

---

## Executive Summary

### Current Safety Profile
The implementation is **UNSAFE for concurrent multi-worker production deployment** due to critical race conditions in inventory operations (purchase and restock). These operations use unprotected read-modify-write (RMW) patterns that violate fundamental inventory invariants under concurrent load.

### Critical Risk: Overselling
The most severe risk is **inventory overselling**: Multiple concurrent purchase requests can bypass stock checks, allowing negative quantities or selling more units than available.

**Example Scenario (3 concurrent requests, 2 units available):**
```
Time 1: Request A reads quantity=2
Time 2: Request B reads quantity=2
Time 3: Request C reads quantity=2
Time 4: Request A decrements → quantity=1, commits
Time 5: Request B decrements → quantity=1, commits  ← Lost update (should be 0)
Time 6: Request C decrements → quantity=1, commits  ← Lost update (should be -1)
Result: 3 sales for 2 units + invalid negative quantity
```

### Current Deployment Safety
- **Single-Worker (Uvicorn single process):** ✅ SAFE - Python GIL provides de facto serialization
- **Multi-Worker (Gunicorn, multiple Uvicorn workers):** ❌ UNSAFE - Race conditions occur immediately
- **SQLite (Single file, serialized):** ⚠️ PARTIALLY SAFE - Database serializes some operations, but connection-level isolation insufficient
- **PostgreSQL (Recommended production DB):** ❌ UNSAFE - No row-level locking without explicit mechanisms

---

## Identified Concurrency Risks

### 1. CRITICAL: Race Condition in `purchase_sweet()` 
**File:** `backend/app/crud.py` (lines 89-104)  
**Risk Level:** 🔴 CRITICAL - Data corruption & inventory overselling

#### Vulnerability Pattern
```python
def purchase_sweet(db: Session, sweet_id: int):
    sweet = db.query(models.Sweet).filter(models.Sweet.id == sweet_id).first()  # (A) READ
    if not sweet:
        return None, "not_found"
    
    if sweet.quantity <= 0:                                                      # (B) CHECK
        return None, "out_of_stock"
    
    sweet.quantity -= 1                                                          # (C) MODIFY
    db.commit()                                                                  # (D) WRITE
    db.refresh(sweet)
    return sweet, None
```

#### Race Condition
Between steps (A)-(B) and step (D), another request can:
1. Read the same sweet at step (A) with original quantity
2. Pass the check at step (B)
3. Decrement independently
4. Both commit successfully

**Outcome:** Each request thinks it succeeded, but stock was oversold.

#### Specific Scenario: Overselling
```
Initial state: sweet_id=1, quantity=2

Request 1 (Thread A)          Request 2 (Thread B)        Request 3 (Thread C)
─────────────────────        ─────────────────────       ─────────────────────
SELECT quantity → 2           (waiting)                   (waiting)
                              SELECT quantity → 2         (waiting)
                                                          SELECT quantity → 2
quantity >= 1? ✓              quantity >= 1? ✓            quantity >= 1? ✓
quantity = 2-1=1              quantity = 2-1=1            quantity = 2-1=1
COMMIT (qty=1)                (now executes)              (now executes)
                              COMMIT (qty=1)             COMMIT (qty=1)

RESULT: 3 items sold, quantity = 1 (should be negative!)
```

#### Why This Occurs
1. **No row locking:** SQLAlchemy doesn't acquire row-level locks on read
2. **No isolation level enforcement:** Connection uses default isolation (READ COMMITTED in PostgreSQL)
3. **Dirty read on unmodified rows:** Same sweet can be read by multiple sessions simultaneously
4. **Lost update:** Increments/decrements are not atomic; they're SQL-level operations applied to stale data

#### Affected Code Paths
- `POST /api/sweets/{sweet_id}/purchase` - Route handler calls `crud.purchase_sweet()`
- Under Gunicorn/multi-worker: **Immediate risk on any concurrent purchases**
- Under SQLite: **Risk reduced but not eliminated** (database-level serialization helps, but not sufficient)

#### Test Coverage Gap
Current tests are **sequential only**:
- ✅ Test: "Purchase A, then purchase B" → PASSES
- ❌ Test: "Purchase A and B simultaneously" → Would FAIL (no test exists)

The tests cannot detect this race condition because they run sequentially.

---

### 2. CRITICAL: Race Condition in `restock_sweet()`
**File:** `backend/app/crud.py` (lines 107-117)  
**Risk Level:** 🔴 CRITICAL - Inventory inconsistency

#### Vulnerability Pattern
```python
def restock_sweet(db: Session, sweet_id: int, quantity: int):
    sweet = db.query(models.Sweet).filter(models.Sweet.id == sweet_id).first()  # (A) READ
    if not sweet:
        return None, "not_found"
    
    sweet.quantity += quantity                                                   # (B) MODIFY
    db.commit()                                                                  # (C) WRITE
    db.refresh(sweet)
    return sweet, None
```

#### Race Condition
Identical RMW pattern to `purchase_sweet()`. Multiple concurrent restocks can lose updates.

**Scenario: Lost Update During Concurrent Restock + Purchase**
```
Initial state: sweet_id=1, quantity=10

Restock Request (add 20)        Purchase Request (subtract 1)
──────────────────────          ────────────────────────
SELECT quantity → 10            SELECT quantity → 10
                                quantity >= 1? ✓
quantity = 10 + 20 = 30         quantity = 10 - 1 = 9
COMMIT (qty=30)                 (now executes)
                                COMMIT (qty=9)

RESULT: Restock is lost! Final qty=9 (should be 29)
```

#### Affected Code Paths
- `POST /api/sweets/{sweet_id}/restock` - Route handler calls `crud.restock_sweet()`
- Can race with any other restock or purchase operation
- Admin-only, but still vulnerable to concurrent admin actions

---

### 3. MEDIUM: Race Condition in `register()` (Username Uniqueness)
**File:** `backend/app/main.py` (lines 14-21)  
**Risk Level:** 🟡 MEDIUM - Constraint violation possible

#### Vulnerability Pattern
```python
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_username(db, username=user_in.username)  # READ
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    user = crud.create_user(db, user=user_in, is_admin=is_admin)          # WRITE
    return user
```

#### Race Condition
Between check and insert, another request can register the same username.

**Scenario: Duplicate Username Registration**
```
Request 1                       Request 2
─────────────                   ─────────────
SELECT * FROM users 
  WHERE username='john' → None
                                SELECT * FROM users
                                  WHERE username='john' → None
INSERT username='john'
COMMIT
                                INSERT username='john'
                                CONSTRAINT VIOLATION!
```

#### Impact
- Returns 500 error instead of 400
- User-facing error message not helpful
- Database constraint enforces uniqueness, but error handling is poor
- Model has `unique=True` constraint on username column, so corruption won't occur

#### Affected Code Paths
- `POST /api/auth/register` - Concurrent registration attempts

---

### 4. LOW: Incomplete Transaction Isolation in Search/List Operations
**File:** `backend/app/crud.py` (lines 47-76)  
**Risk Level:** 🟢 LOW - Data visibility, not corruption

#### Characteristics
- `list_sweets()`, `search_sweets()` perform dirty reads
- Can see partially-committed state from other transactions
- Not atomic: can see inconsistent quantity across multiple sweets

#### Impact
- Users might see inventory that changes mid-transaction
- Not a correctness issue for inventory counts
- Acceptable for read-only operations

#### Affected Code Paths
- `GET /api/sweets`, `GET /api/sweets/search` - Listing/searching

---

## Root Cause Analysis

### Why These Race Conditions Exist

#### 1. Unprotected Read-Modify-Write Pattern
SQLAlchemy ORM operates at the object level, not the SQL level:
```python
# This Python code:
sweet.quantity -= 1
db.commit()

# Becomes (SQL):
SELECT quantity FROM sweets WHERE id=X;  # In Python, old value
UPDATE sweets SET quantity=? WHERE id=X; # Writes derived value based on old read
```

The database never sees the read and check together. It's equivalent to:
```sql
-- What we have:
SELECT quantity FROM sweets WHERE id=X;  -- Read outside transaction
UPDATE sweets SET quantity=quantity-1 WHERE id=X;  -- Lost update risk

-- What we need:
UPDATE sweets SET quantity=quantity-1 WHERE id=X AND quantity > 0;  -- Atomic
```

#### 2. No Explicit Locking
SQLAlchemy doesn't automatically apply row-level locks. Without `with_for_update()`, reads are unprotected.

#### 3. Default Isolation Level Insufficient
- **PostgreSQL default (READ COMMITTED):** Prevents dirty reads but NOT lost updates
- **MySQL default (REPEATABLE READ):** Better, but still vulnerable under certain conditions
- **SQLite (SERIALIZABLE for writes):** Provides some protection, but not cross-connection

#### 4. Session-Per-Request Pattern
FastAPI's dependency injection creates one session per request. Concurrent requests = concurrent sessions = no cross-request synchronization.

---

## Impact Assessment

### Scenarios Where Issues Manifest

#### Scenario 1: Black Friday Sale (Multi-Worker Deployment)
```
Deployment: Gunicorn with 4 workers (4 Python processes)
Available inventory: Chocolate Truffle, quantity=100
Concurrent requests: 150 simultaneous purchases

Expected result: 100 successful sales, 50 customers get "Out of Stock"
Actual result: ~140-150 successful sales, final quantity = ~-35
Loss: 35+ units oversold
```

**Trigger:** Gunicorn multi-worker OR HTTPServer with multiple threads OR async concurrency

#### Scenario 2: Inventory Management Inconsistency
```
Admin restocks Chocolate Truffle with +50 units
Customer purchases 1 unit
Both requests arrive simultaneously at 2 different Uvicorn workers

Expected: Quantity = 50-1 = 49 OR 100+50-1 = 149 (depending on order)
Actual: One operation is lost
Result: Quantity might stay at 100 or 49 (race dependent)
```

#### Scenario 3: Sequential Request Chain (Still Unsafe with Multi-Worker)
```
1. Admin: POST /restock with quantity=100
2. Customer: POST /purchase (1 unit)
3. Admin: GET /sweets/{id} (expects quantity=99)

With multi-worker: requests might hit different workers with stale caches
Worker A processes restock, Worker B processes purchase on stale data
Result: Inconsistent inventory state
```

---

## Database-Specific Considerations

### SQLite (Current Dev Database)
**Isolation Strength:** Moderate  
**Why:** SQLite uses file-level locking (entire database locked during writes)

```
Concurrent READ: ✅ Allowed (shared lock)
Concurrent READ + WRITE: ⚠️ WRITE blocks, may timeout
Concurrent WRITE: ✅ Serialized (exclusive lock)
```

**Problem:** The race condition still occurs because:
1. Request A reads (acquires shared lock, locks entire DB read)
2. Request B reads (shares the read lock)
3. Request A releases lock and begins write
4. Meanwhile, Request B acquired the same read value
5. Both write their modified versions (lost update)

SQLite's file locking doesn't help because:
- Reads aren't transactionally isolated
- Multiple readers can see the same snapshot
- Writes are serialized, but they're based on stale reads

**Single-Worker SQLite:** ✅ SAFE (Python GIL ensures single thread of execution)  
**Multi-Worker SQLite:** ❌ UNSAFE (race conditions occur despite DB-level locking)

### PostgreSQL (Recommended Production DB)
**Isolation Strength:** Better, but insufficient without explicit locking  
**Default Isolation:** READ COMMITTED

```
With READ COMMITTED:
T1: SELECT quantity = 10        (dirty read prevention: ✓)
T2: SELECT quantity = 10        (T1 sees committed value)
T1: UPDATE quantity = 9
T1: COMMIT
T2: UPDATE quantity = 9         ← Lost update! (T2 used stale data)
T2: COMMIT
```

**Fixing with SERIALIZABLE isolation:** Possible but impacts performance  
**Fixing with pessimistic locking:** Recommended - locks rows during read

---

## Recommended Fixes

### Fix Priority Framework
- **MUST FIX:** Prevents data corruption, violates business logic, high probability
- **SHOULD FIX:** Correctness under load, medium-to-high impact
- **OPTIONAL:** Production hardening, defensive programming

---

### MUST FIX #1: Add Pessimistic Locking to `purchase_sweet()`

**Priority:** 🔴 CRITICAL  
**Effort:** 15 minutes  
**Impact:** Eliminates race condition in purchase flow

#### Problem
Current code:
```python
sweet = db.query(models.Sweet).filter(models.Sweet.id == sweet_id).first()
```

Multiple concurrent reads allow all to pass the `quantity > 0` check.

#### Solution
Use SQLAlchemy's `with_for_update()` to acquire a row-level lock:

```python
from sqlalchemy import select

def purchase_sweet(db: Session, sweet_id: int):
    """
    Purchase a sweet by decreasing its quantity by 1.
    Uses pessimistic row-level locking to prevent overselling.
    """
    # Lock the row for update (blocks concurrent readers)
    sweet = db.query(models.Sweet).filter(
        models.Sweet.id == sweet_id
    ).with_for_update().first()
    
    if not sweet:
        return None, "not_found"
    
    if sweet.quantity <= 0:
        return None, "out_of_stock"
    
    sweet.quantity -= 1
    db.commit()
    db.refresh(sweet)
    return sweet, None
```

#### How It Works
- `with_for_update()` adds `FOR UPDATE` to SELECT query
- Database acquires exclusive row lock
- Other transactions block until lock is released
- Guarantees serialization of conflicting operations

**SQL Generated:**
```sql
SELECT * FROM sweets WHERE id=X FOR UPDATE;  -- Locks row immediately
-- Only one transaction can hold the lock
```

#### Guarantees After Fix
```
Request 1 (T1)                  Request 2 (T2)
──────────────                  ──────────────
SELECT FOR UPDATE qty=2         (blocked, waiting for lock)
  → LOCK ACQUIRED
quantity >= 1? ✓
quantity = 2 - 1 = 1
COMMIT                          
  → LOCK RELEASED
                                SELECT FOR UPDATE qty=1
                                  → LOCK ACQUIRED
                                quantity >= 1? ✓
                                quantity = 1 - 1 = 0
                                COMMIT
                                  → LOCK RELEASED

RESULT: qty=0, both requests succeeded correctly ✓
```

#### Database Compatibility
- ✅ **PostgreSQL:** Full support (`FOR UPDATE`)
- ✅ **MySQL:** Full support (`FOR UPDATE`)
- ✅ **SQLite:** Full support (file-level exclusive lock)
- ✅ **SQLAlchemy:** Native support in 2.0+

#### Trade-offs
- **Benefit:** Eliminates race condition entirely
- **Cost:** Slightly higher latency (lock wait times)
- **Contention:** Under high load, sequential purchases take longer
- **Deadlock risk:** Low (single row, single operation)

---

### MUST FIX #2: Add Pessimistic Locking to `restock_sweet()`

**Priority:** 🔴 CRITICAL  
**Effort:** 15 minutes  
**Impact:** Eliminates lost update risk in restock operations

#### Solution
Identical pattern to Fix #1:

```python
def restock_sweet(db: Session, sweet_id: int, quantity: int):
    """
    Restock a sweet by increasing its quantity.
    Uses pessimistic row-level locking for consistency.
    """
    sweet = db.query(models.Sweet).filter(
        models.Sweet.id == sweet_id
    ).with_for_update().first()
    
    if not sweet:
        return None, "not_found"
    
    sweet.quantity += quantity
    db.commit()
    db.refresh(sweet)
    return sweet, None
```

#### Why Both Operations Need Locking
Even though `restock_sweet()` doesn't have a conditional check (doesn't fail based on current quantity), it's still vulnerable:

```
Restock +50: quantity = 10 + 50 = 60
Purchase -1: quantity = 10 - 1 = 9

Without locking:
Both read 10, write independently, one update is lost.
Result: Either 9 or 60, never 59.

With locking:
Restock acquires lock, writes 60, releases lock.
Purchase waits for lock, reads 60, writes 59.
Result: Always 59 ✓
```

---

### SHOULD FIX #3: Handle Username Uniqueness Race Condition in `register()`

**Priority:** 🟡 MEDIUM  
**Effort:** 10 minutes  
**Impact:** Better error handling, prevents 500 errors

#### Current Problem
```python
existing = crud.get_user_by_username(db, username=user_in.username)
if existing:
    raise HTTPException(status_code=400, detail="Username already registered")

user = crud.create_user(db, user=user_in, is_admin=is_admin)
```

Two concurrent requests with same username → both pass check → both INSERT → database constraint violation → 500 error

#### Solution Option A: Catch Constraint Violation (Recommended)
```python
from sqlalchemy.exc import IntegrityError

def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Optional: still check for better UX (avoids double-INSERT)
    existing = crud.get_user_by_username(db, username=user_in.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    try:
        user = crud.create_user(db, user=user_in, is_admin=is_admin)
        return user
    except IntegrityError:
        # Handles race condition: both requests checked simultaneously
        db.rollback()
        raise HTTPException(status_code=400, detail="Username already registered")
```

#### Solution Option B: Use Pessimistic Lock (Not Recommended Here)
Could lock users table, but it's overkill for registration (low frequency operation).

#### Why This is Lower Priority
- Database constraint (`UNIQUE`) prevents corruption
- Concurrent registrations are rare
- Error is user-facing but not data-corrupting

---

### OPTIONAL: Migration to Atomic SQL Updates

**Priority:** 🟢 OPTIONAL (Long-term hardening)  
**Effort:** 1-2 hours  
**Impact:** Better performance, eliminates ORM RMW overhead

#### Current Approach (Vulnerable)
```python
sweet = db.query(...).first()           # SELECT + Python object creation
sweet.quantity -= 1                     # In-memory modification
db.commit()                             # UPDATE with derived value
```

#### Alternative: Direct SQL Update
```python
from sqlalchemy import update

def purchase_sweet(db: Session, sweet_id: int):
    """Purchase using atomic SQL."""
    # Update and return in single operation
    stmt = (
        update(models.Sweet)
        .where(models.Sweet.id == sweet_id)
        .where(models.Sweet.quantity > 0)  # Atomic check + decrement
        .values(quantity=models.Sweet.quantity - 1)
        .returning(models.Sweet)
    )
    result = db.execute(stmt)
    db.commit()
    
    sweet = result.scalars().first()
    if not sweet:
        # Could mean: not found OR out of stock
        # Need additional query to distinguish
        existing = db.query(models.Sweet).filter(models.Sweet.id == sweet_id).first()
        return None, "not_found" if not existing else "out_of_stock"
    
    return sweet, None
```

**Pros:**
- Truly atomic (database executes in single operation)
- Better performance (fewer round-trips)
- No locking needed (UPDATE itself is atomic)

**Cons:**
- Requires `RETURNING` clause (PostgreSQL/SQLite, not MySQL)
- More complex code
- Need conditional logic to distinguish "not found" from "out of stock"
- Overkill if pessimistic locking is acceptable

#### Assessment
This is **OPTIONAL** because:
1. Pessimistic locking (MUST FIX #1, #2) solves the problem
2. Atomic SQL is an optimization, not a necessity
3. Requires database-specific features
4. Adds code complexity

Implement this only if:
- Performance testing shows lock contention
- Moving to a lock-free design is desirable
- All target databases support `RETURNING`

---

## Implementation Checklist

### To Make SAFE for Multi-Worker Deployment

```
✅ MUST IMPLEMENT:
  [ ] Add with_for_update() to purchase_sweet()
  [ ] Add with_for_update() to restock_sweet()
  [ ] Run full test suite to verify no breaking changes
  [ ] Test with concurrent load (JMeter/Locust)

⚠️ SHOULD IMPLEMENT:
  [ ] Add IntegrityError handling to register()
  [ ] Document concurrency safety in code comments

🔵 OPTIONAL (Future):
  [ ] Refactor to atomic SQL updates (if needed for performance)
  [ ] Add explicit SERIALIZABLE isolation (if required for audit trails)
  [ ] Implement optimistic locking with version columns
```

---

## Testing Recommendations

### Current Test Gap
Existing 42 tests are **sequential only** and cannot catch race conditions.

### To Verify Fixes Work

#### Unit Test Addition (Optional)
```python
def test_purchase_sweet_concurrent_prevents_overselling():
    """Test that concurrent purchases don't oversell stock."""
    from concurrent.futures import ThreadPoolExecutor
    
    # Create sweet with qty=5
    sweet = create_test_sweet(quantity=5)
    
    # Simulate 10 concurrent purchases
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [
            executor.submit(purchase_sweet, db, sweet.id)
            for _ in range(10)
        ]
        results = [f.result() for f in futures]
    
    # Exactly 5 should succeed, 5 should fail
    successful = sum(1 for s, e in results if e is None)
    failed = sum(1 for s, e in results if e == "out_of_stock")
    
    assert successful == 5, f"Expected 5 successful, got {successful}"
    assert failed == 5, f"Expected 5 failed, got {failed}"
    
    # Verify no negative quantity
    final_sweet = db.query(models.Sweet).filter(models.Sweet.id == sweet.id).first()
    assert final_sweet.quantity == 0, f"Quantity should be 0, got {final_sweet.quantity}"
```

#### Load Test (Recommended)
Use Locust or Apache JMeter:
```python
# Locust example
from locust import HttpUser, task

class InventoryUser(HttpUser):
    @task
    def purchase(self):
        self.client.post(f"/api/sweets/1/purchase", headers=self.auth_headers)

# Run: locust -f loadtest.py --users 100 --spawn-rate 10
```

### Verification Steps
1. Deploy with pessimistic locking
2. Run load test with N concurrent users
3. Verify no overselling (quantity never negative)
4. Verify all 42 existing tests still pass
5. Check response times are acceptable (lock wait latency)

---

## Deployment Recommendations

### Current Deployment Safety Assessment

#### Single-Worker (Gunicorn with 1 Worker, or Uvicorn Single Process)
```
Status: ✅ SAFE (for now)
Reason: Python GIL + single-threaded execution provides de facto serialization
Risk: If async is introduced or threading is used, race conditions emerge
Action: Document this assumption; document that multi-worker is unsafe
```

#### Multi-Worker (Gunicorn with N Workers, N Uvicorn Instances)
```
Status: ❌ UNSAFE (before fixes)
Status: ✅ SAFE (after implementing MUST FIX #1, #2)
Reason: Without locking, concurrent processes see stale data
Action: Implement fixes immediately before scaling horizontally
```

#### Production Deployment Recommendations

**BEFORE deploying to production:**
1. ✅ Implement pessimistic locking (MUST FIX #1, #2)
2. ✅ Add IntegrityError handling (SHOULD FIX #3)
3. ✅ Run concurrent load test
4. ✅ Use PostgreSQL (not SQLite)
5. ⚠️ Document that single-worker is currently required if fixes aren't implemented
6. ✅ Add monitoring for inventory anomalies (negative quantities, overselling)

**NOT SUITABLE FOR PRODUCTION (current state):**
- Multi-worker deployment
- Horizontal scaling
- High-concurrency scenarios

**Suitable for production (with fixes):**
- Multi-worker deployment (4-16 workers typical)
- Moderate to high concurrency
- Both PostgreSQL and SQLite (though PostgreSQL preferred)

---

## Summary Table

| Risk | Severity | Location | Fix | Effort | Safety Gain |
|------|----------|----------|-----|--------|------------|
| Overselling in purchase | 🔴 CRITICAL | `crud.purchase_sweet()` | Add `with_for_update()` | 5 min | Eliminates race |
| Lost update in restock | 🔴 CRITICAL | `crud.restock_sweet()` | Add `with_for_update()` | 5 min | Eliminates race |
| Duplicate username | 🟡 MEDIUM | `main.register()` | Add `IntegrityError` handler | 10 min | Better errors |
| Dirty reads in search | 🟢 LOW | `crud.list/search_sweets()` | None needed | — | Acceptable |

---

## Conclusion

### Is Current Implementation Safe?

**For Single-Worker Deployment:** ✅ YES (acceptable for development/small deployments)

**For Multi-Worker Deployment:** ❌ NO (immediate risk of inventory overselling)

**For Production:** ❌ NO (unsafe at any scale without fixes)

### Required Actions for Production

**Minimum viable fixes:**
1. Add `with_for_update()` to `purchase_sweet()` (15 min)
2. Add `with_for_update()` to `restock_sweet()` (15 min)
3. Add `IntegrityError` handling to `register()` (10 min)
4. Run concurrent load test (verify fixes work)

**Estimated effort:** 1-2 hours total  
**Expected outcome:** Safe for multi-worker, production-ready inventory management  
**No breaking changes to API or tests**

---

## Next Steps

This analysis is **complete**. Awaiting instruction to proceed with implementation of fixes.

**To request implementation:**
- Confirm MUST FIX #1, #2, #3 should be implemented
- Specify which database(s) will be used (PostgreSQL recommended)
- Request changes in this order: #1 → #2 → #3
- Ask for concurrent load testing after implementation

---

**Document prepared for:** Sweet Shop Management System  
**Status:** Analysis complete, awaiting approval  
**Reviewer:** Code Review & Concurrency Assessment
