"""
Inventory domain tests - Test-Driven Development.
Tests define required behavior for purchase and restock operations.
These tests are expected to FAIL initially (Red phase).
"""
from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.db.session import Base, engine

client = TestClient(app)


def setup_module(module):
    """Reset database before running inventory tests."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def _get_auth_token(username: str, password: str) -> str:
    """Helper to register a user and return JWT token."""
    client.post(
        "/api/auth/register",
        json={
            "username": username,
            "password": password,
            "full_name": f"{username.capitalize()} User"
        }
    )
    response = client.post(
        "/api/auth/login",
        data={"username": username, "password": password}
    )
    return response.json()["access_token"]


def _create_sweet(name: str, quantity: int, admin_token: str = None) -> dict:
    """Helper to create a sweet and return its data. Requires admin token."""
    if admin_token is None:
        # Create admin token if not provided
        admin_token = _get_auth_token("testadmin", "secret123")
    
    response = client.post(
        "/api/sweets",
        json={
            "name": name,
            "category": "test",
            "price": 5.00,
            "quantity": quantity
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    return response.json()


class TestPurchaseLogic:
    """Tests for purchasing sweets (POST /api/sweets/{sweet_id}/purchase)."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset database before each test in this class."""
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        yield

    def test_purchase_requires_authentication(self):
        """Purchasing without auth should fail with 401."""
        # Create a sweet with admin (for setup)
        sweet = _create_sweet("Test Sweet", 10)
        
        # Try to purchase without auth
        response = client.post(f"/api/sweets/{sweet['id']}/purchase")
        assert response.status_code == 401

    def test_purchase_success_decreases_quantity(self):
        """Purchasing a sweet with quantity > 0 should decrease quantity by 1."""
        sweet = _create_sweet("Cupcake", 5)
        initial_quantity = sweet["quantity"]
        
        # Purchase the sweet
        buyer_token = _get_auth_token("buyer1", "secret123")
        response = client.post(
            f"/api/sweets/{sweet['id']}/purchase",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["quantity"] == initial_quantity - 1
        assert data["id"] == sweet["id"]

    def test_purchase_multiple_times(self):
        """Purchasing the same sweet multiple times should decrement each time."""
        sweet = _create_sweet("Brownie", 3)
        
        buyer_token = _get_auth_token("buyer2", "secret123")
        
        # First purchase
        response1 = client.post(
            f"/api/sweets/{sweet['id']}/purchase",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert response1.status_code == 200
        assert response1.json()["quantity"] == 2
        
        # Second purchase
        response2 = client.post(
            f"/api/sweets/{sweet['id']}/purchase",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert response2.status_code == 200
        assert response2.json()["quantity"] == 1
        
        # Third purchase
        response3 = client.post(
            f"/api/sweets/{sweet['id']}/purchase",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert response3.status_code == 200
        assert response3.json()["quantity"] == 0

    def test_purchase_fails_when_quantity_zero(self):
        """Purchasing when quantity is 0 should fail with 400."""
        sweet = _create_sweet("Out of Stock", 0)
        
        buyer_token = _get_auth_token("buyer3", "secret123")
        response = client.post(
            f"/api/sweets/{sweet['id']}/purchase",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        
        assert response.status_code == 400
        assert "out of stock" in response.json()["detail"].lower() or "quantity" in response.json()["detail"].lower()

    def test_purchase_fails_when_quantity_insufficient(self):
        """Attempting to purchase when quantity would go negative should fail."""
        sweet = _create_sweet("Limited Sweet", 1)
        
        buyer_token = _get_auth_token("buyer4", "secret123")
        
        # First purchase succeeds
        response1 = client.post(
            f"/api/sweets/{sweet['id']}/purchase",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert response1.status_code == 200
        
        # Second purchase fails (quantity now 0)
        response2 = client.post(
            f"/api/sweets/{sweet['id']}/purchase",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert response2.status_code == 400

    def test_purchase_returns_updated_sweet(self):
        """Purchase response should include all sweet fields."""
        sweet = _create_sweet("Complete Sweet", 10)
        
        buyer_token = _get_auth_token("buyer5", "secret123")
        response = client.post(
            f"/api/sweets/{sweet['id']}/purchase",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        required_fields = ["id", "name", "category", "price", "quantity"]
        for field in required_fields:
            assert field in data

    def test_purchase_nonexistent_sweet(self):
        """Attempting to purchase a sweet that doesn't exist should fail."""
        buyer_token = _get_auth_token("buyer6", "secret123")
        response = client.post(
            "/api/sweets/9999/purchase",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert response.status_code == 404


class TestRestockLogic:
    """Tests for restocking sweets (POST /api/sweets/{sweet_id}/restock)."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset database before each test in this class."""
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        yield

    def test_restock_requires_authentication(self):
        """Restocking without auth should fail with 401."""
        sweet = _create_sweet("Restock Test", 5)
        
        # Try to restock without auth
        response = client.post(
            f"/api/sweets/{sweet['id']}/restock",
            json={"quantity": 10}
        )
        assert response.status_code == 401

    def test_restock_requires_admin_role(self):
        """Restocking as a regular user should fail with 403 (Forbidden)."""
        sweet = _create_sweet("Admin Only", 5)
        
        # Regular user tries to restock
        user_token = _get_auth_token("regular_user1", "secret123")
        response = client.post(
            f"/api/sweets/{sweet['id']}/restock",
            json={"quantity": 10},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403

    def test_restock_success_with_admin(self):
        """Restocking with admin role should increase quantity."""
        # For simplicity, assume the creator (seller) has admin privileges
        # or we need a way to grant admin role. Tests use seller tokens as admin.
        admin_token = _get_auth_token("admin_user1", "secret123")
        sweet = _create_sweet("Restock Me", 5, admin_token)
        initial_quantity = sweet["quantity"]
        
        # Restock the sweet (increase by 20)
        response = client.post(
            f"/api/sweets/{sweet['id']}/restock",
            json={"quantity": 20},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["quantity"] == initial_quantity + 20
        assert data["id"] == sweet["id"]

    def test_restock_multiple_times(self):
        """Restocking the same sweet multiple times should accumulate."""
        admin_token = _get_auth_token("admin_user2", "secret123")
        sweet = _create_sweet("Multi Restock", 5, admin_token)
        
        # First restock (+10)
        response1 = client.post(
            f"/api/sweets/{sweet['id']}/restock",
            json={"quantity": 10},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response1.status_code == 200
        assert response1.json()["quantity"] == 15
        
        # Second restock (+5)
        response2 = client.post(
            f"/api/sweets/{sweet['id']}/restock",
            json={"quantity": 5},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response2.status_code == 200
        assert response2.json()["quantity"] == 20

    def test_restock_with_zero_quantity(self):
        """Restocking with quantity=0 should be allowed (no-op or explicit)."""
        admin_token = _get_auth_token("admin_user3", "secret123")
        sweet = _create_sweet("Zero Restock", 10, admin_token)
        
        response = client.post(
            f"/api/sweets/{sweet['id']}/restock",
            json={"quantity": 0},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Should succeed; quantity remains 10
        assert response.status_code == 200
        assert response.json()["quantity"] == 10

    def test_restock_returns_updated_sweet(self):
        """Restock response should include all sweet fields."""
        admin_token = _get_auth_token("admin_user4", "secret123")
        sweet = _create_sweet("Complete Restock", 5, admin_token)
        
        response = client.post(
            f"/api/sweets/{sweet['id']}/restock",
            json={"quantity": 15},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        required_fields = ["id", "name", "category", "price", "quantity"]
        for field in required_fields:
            assert field in data

    def test_restock_nonexistent_sweet(self):
        """Attempting to restock a sweet that doesn't exist should fail."""
        admin_token = _get_auth_token("admin_user5", "secret123")
        response = client.post(
            "/api/sweets/9999/restock",
            json={"quantity": 10},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404

    def test_restock_requires_quantity_field(self):
        """Restock request must include quantity field (validation)."""
        admin_token = _get_auth_token("admin_user6", "secret123")
        sweet = _create_sweet("Validation Test", 5, admin_token)
        
        response = client.post(
            f"/api/sweets/{sweet['id']}/restock",
            json={},  # Missing 'quantity'
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 422  # Validation error


class TestPurchaseAndRestockInteraction:
    """Tests for interactions between purchase and restock operations."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset database before each test in this class."""
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        yield

    def test_purchase_after_restock(self):
        """Purchasing after restocking should decrement the restocked quantity."""
        admin_token = _get_auth_token("admin_user7", "secret123")
        sweet = _create_sweet("Purchase After Restock", 2, admin_token)
        
        # Restock by 8 (total: 10)
        restock_response = client.post(
            f"/api/sweets/{sweet['id']}/restock",
            json={"quantity": 8},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert restock_response.status_code == 200
        assert restock_response.json()["quantity"] == 10
        
        # Purchase once (total: 9)
        buyer_token = _get_auth_token("buyer7", "secret123")
        purchase_response = client.post(
            f"/api/sweets/{sweet['id']}/purchase",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert purchase_response.status_code == 200
        assert purchase_response.json()["quantity"] == 9

    def test_restock_after_purchase_until_empty(self):
        """Restocking a purchased-to-empty sweet should make it available again."""
        admin_token = _get_auth_token("admin_user8", "secret123")
        sweet = _create_sweet("Restock After Purchase", 2, admin_token)
        
        # Sell out
        buyer_token = _get_auth_token("buyer8", "secret123")
        for _ in range(2):
            response = client.post(
                f"/api/sweets/{sweet['id']}/purchase",
                headers={"Authorization": f"Bearer {buyer_token}"}
            )
            assert response.status_code == 200
        
        # Verify out of stock
        response = client.post(
            f"/api/sweets/{sweet['id']}/purchase",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert response.status_code == 400
        
        # Restock
        restock_response = client.post(
            f"/api/sweets/{sweet['id']}/restock",
            json={"quantity": 5},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert restock_response.status_code == 200
        assert restock_response.json()["quantity"] == 5
        
        # Now purchase should work again
        purchase_response = client.post(
            f"/api/sweets/{sweet['id']}/purchase",
            headers={"Authorization": f"Bearer {buyer_token}"}
        )
        assert purchase_response.status_code == 200
        assert purchase_response.json()["quantity"] == 4


class TestSweetDeletionVisibility:
    """Ensure deleted sweets are not returned in listings."""

    @pytest.fixture(autouse=True)
    def setup(self):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        yield

    def test_deleted_sweet_not_listed(self):
        sweet = _create_sweet("DeleteMe", 5)
        admin_token = _get_auth_token("admin_delete", "secret123")

        delete_resp = client.delete(
            f"/api/sweets/{sweet['id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_resp.status_code == 200

        list_resp = client.get("/api/sweets")
        assert list_resp.status_code == 200
        ids = [s["id"] for s in list_resp.json()]
        assert sweet["id"] not in ids
