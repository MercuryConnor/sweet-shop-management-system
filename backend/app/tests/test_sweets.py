"""
Sweet (Sweets) domain tests - Test-Driven Development.
Tests define required behavior BEFORE implementation.
These tests are expected to FAIL initially (Red phase).
"""
from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.db.session import Base, engine

client = TestClient(app)


def setup_module(module):
    """Reset database before running sweet tests."""
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


class TestSweetCreation:
    """Tests for creating sweets (POST /api/sweets)."""

    def test_create_sweet_requires_authentication(self):
        """Creating a sweet without auth should fail with 401."""
        response = client.post(
            "/api/sweets",
            json={
                "name": "Chocolate Cake",
                "category": "cake",
                "price": 5.99,
                "quantity": 10
            }
        )
        assert response.status_code == 401

    def test_create_sweet_requires_admin_role(self):
        """Non-admin users should not be able to create sweets (403 Forbidden)."""
        token = _get_auth_token("regularuser", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/sweets",
            json={
                "name": "Unauthorized Sweet",
                "category": "candy",
                "price": 1.99,
                "quantity": 10
            },
            headers=headers
        )
        assert response.status_code == 403
        assert response.json()["detail"] == "Not authorized"

    def test_create_sweet_success(self):
        """Creating a sweet with admin JWT should succeed."""
        token = _get_auth_token("admin1", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/sweets",
            json={
                "name": "Vanilla Cupcake",
                "category": "cupcake",
                "price": 2.50,
                "quantity": 25
            },
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Vanilla Cupcake"
        assert data["category"] == "cupcake"
        assert data["price"] == 2.50
        assert data["quantity"] == 25
        assert "id" in data

    def test_create_sweet_with_all_fields(self):
        """Sweet response includes all required fields: id, name, category, price, quantity."""
        token = _get_auth_token("admin2", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/sweets",
            json={
                "name": "Strawberry Donut",
                "category": "donut",
                "price": 1.75,
                "quantity": 50
            },
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        required_fields = ["id", "name", "category", "price", "quantity"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"

    def test_create_multiple_sweets(self):
        """Creating multiple sweets in sequence should succeed."""
        token = _get_auth_token("admin3", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        sweets_data = [
            {"name": "Brownie", "category": "brownie", "price": 3.00, "quantity": 15},
            {"name": "Cheesecake", "category": "cake", "price": 6.50, "quantity": 8},
            {"name": "Macaroon", "category": "macaroon", "price": 1.50, "quantity": 30}
        ]
        
        ids = []
        for sweet in sweets_data:
            response = client.post("/api/sweets", json=sweet, headers=headers)
            assert response.status_code == 200
            ids.append(response.json()["id"])
        
        # Verify all IDs are unique
        assert len(ids) == len(set(ids))


class TestSweetListing:
    """Tests for listing sweets (GET /api/sweets)."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset database before each test in this class."""
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        yield

    def test_list_sweets_empty(self):
        """Listing sweets on empty database returns empty list."""
        response = client.get("/api/sweets")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_list_sweets_returns_created_sweets(self):
        """Listing sweets returns all previously created sweets."""
        token = _get_auth_token("admin4", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create 3 sweets
        created_ids = []
        for i in range(3):
            response = client.post(
                "/api/sweets",
                json={
                    "name": f"Sweet {i}",
                    "category": "candy",
                    "price": 2.00 + i,
                    "quantity": 10 + i
                },
                headers=headers
            )
            assert response.status_code == 200
            created_ids.append(response.json()["id"])
        
        # List all sweets
        response = client.get("/api/sweets")
        assert response.status_code == 200
        sweets = response.json()
        assert len(sweets) >= 3
        
        returned_ids = [s["id"] for s in sweets]
        for created_id in created_ids:
            assert created_id in returned_ids

    def test_list_sweets_pagination_skip(self):
        """Listing sweets with skip parameter skips N items."""
        token = _get_auth_token("admin5", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create 5 sweets
        for i in range(5):
            client.post(
                "/api/sweets",
                json={
                    "name": f"Paginated Sweet {i}",
                    "category": "candy",
                    "price": 1.00,
                    "quantity": 10
                },
                headers=headers
            )
        
        # List with skip=2
        response = client.get("/api/sweets?skip=2&limit=10")
        assert response.status_code == 200
        sweets = response.json()
        assert len(sweets) >= 3

    def test_list_sweets_pagination_limit(self):
        """Listing sweets with limit parameter returns at most N items."""
        response = client.get("/api/sweets?limit=2")
        assert response.status_code == 200
        sweets = response.json()
        assert len(sweets) <= 2


class TestSweetSearch:
    """Tests for searching sweets (GET /api/sweets/search)."""

    def test_search_sweets_by_name(self):
        """Searching by name returns sweets matching the name substring."""
        token = _get_auth_token("admin6", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create sweets with specific names
        client.post(
            "/api/sweets",
            json={
                "name": "Chocolate Brownies",
                "category": "brownie",
                "price": 4.00,
                "quantity": 12
            },
            headers=headers
        )
        client.post(
            "/api/sweets",
            json={
                "name": "Vanilla Wafers",
                "category": "wafer",
                "price": 2.00,
                "quantity": 20
            },
            headers=headers
        )
        
        # Search for "Chocolate"
        response = client.get("/api/sweets/search?name=Chocolate")
        assert response.status_code == 200
        sweets = response.json()
        assert len(sweets) >= 1
        assert any("Chocolate" in s["name"] for s in sweets)


class TestSweetUpdateAndDelete:
    """Tests for updating price and deleting sweets."""

    @pytest.fixture(autouse=True)
    def setup(self):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        yield

    def _create_admin_token(self):
        return _get_auth_token("admin_update", "secret123")

    def _create_regular_token(self):
        return _get_auth_token("regular_update", "secret123")

    def _create_sweet(self, name="Update Target", price=10.0, quantity=5):
        admin_token = self._create_admin_token()
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.post(
            "/api/sweets",
            json={"name": name, "category": "test", "price": price, "quantity": quantity},
            headers=headers,
        )
        assert response.status_code == 200
        return response.json(), headers

    def test_update_price_requires_admin(self):
        sweet, _ = self._create_sweet()
        user_token = self._create_regular_token()
        response = client.put(
            f"/api/sweets/{sweet['id']}",
            json={"price": 25.0},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_update_price_success(self):
        sweet, headers = self._create_sweet(price=50.0)
        response = client.put(
            f"/api/sweets/{sweet['id']}",
            json={"price": 99.0},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["price"] == 99.0

    def test_delete_requires_admin(self):
        sweet, _ = self._create_sweet()
        user_token = self._create_regular_token()
        response = client.delete(
            f"/api/sweets/{sweet['id']}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 403

    def test_delete_success_removes_from_list(self):
        sweet, headers = self._create_sweet()
        delete_resp = client.delete(f"/api/sweets/{sweet['id']}", headers=headers)
        assert delete_resp.status_code == 200

        list_resp = client.get("/api/sweets")
        assert list_resp.status_code == 200
        ids = [s["id"] for s in list_resp.json()]
        assert sweet["id"] not in ids

    def test_search_sweets_by_name_case_insensitive(self):
        """Name search should be case-insensitive."""
        token = _get_auth_token("admin7", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        client.post(
            "/api/sweets",
            json={
                "name": "Caramel Sauce",
                "category": "sauce",
                "price": 3.50,
                "quantity": 15
            },
            headers=headers
        )
        
        # Search with different case
        response = client.get("/api/sweets/search?name=caramel")
        assert response.status_code == 200
        sweets = response.json()
        assert len(sweets) >= 1

    def test_search_sweets_by_category(self):
        """Searching by category returns sweets matching the category."""
        token = _get_auth_token("admin8", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        client.post(
            "/api/sweets",
            json={
                "name": "Red Velvet Cupcake",
                "category": "cupcake",
                "price": 3.00,
                "quantity": 18
            },
            headers=headers
        )
        
        # Search by category
        response = client.get("/api/sweets/search?category=cupcake")
        assert response.status_code == 200
        sweets = response.json()
        assert len(sweets) >= 1
        assert all(s["category"] == "cupcake" for s in sweets)

    def test_search_sweets_by_price_range(self):
        """Searching by price range returns sweets within min and max price."""
        token = _get_auth_token("admin9", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create sweets with different prices
        prices = [1.50, 3.00, 5.50, 8.00]
        for idx, price in enumerate(prices):
            client.post(
                "/api/sweets",
                json={
                    "name": f"Sweet Price {idx}",
                    "category": "candy",
                    "price": price,
                    "quantity": 10
                },
                headers=headers
            )
        
        # Search for price range 2.00 to 6.00
        response = client.get("/api/sweets/search?min_price=2.00&max_price=6.00")
        assert response.status_code == 200
        sweets = response.json()
        assert len(sweets) >= 1
        for sweet in sweets:
            assert 2.00 <= sweet["price"] <= 6.00

    def test_search_sweets_combined_filters(self):
        """Searching with multiple filters returns sweets matching all criteria."""
        token = _get_auth_token("admin10", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create test sweets
        client.post(
            "/api/sweets",
            json={
                "name": "Premium Chocolate Cake",
                "category": "cake",
                "price": 7.00,
                "quantity": 5
            },
            headers=headers
        )
        client.post(
            "/api/sweets",
            json={
                "name": "Budget Candy",
                "category": "candy",
                "price": 0.99,
                "quantity": 100
            },
            headers=headers
        )
        
        # Search by category AND price range
        response = client.get("/api/sweets/search?category=cake&min_price=5.00&max_price=10.00")
        assert response.status_code == 200
        sweets = response.json()
        assert len(sweets) >= 1
        for sweet in sweets:
            assert sweet["category"] == "cake"
            assert 5.00 <= sweet["price"] <= 10.00

    def test_search_sweets_no_results(self):
        """Searching with criteria that match no sweets returns empty list."""
        response = client.get("/api/sweets/search?name=NonExistentSweet12345")
        assert response.status_code == 200
        sweets = response.json()
        assert isinstance(sweets, list)
        assert len(sweets) == 0


class TestSweetFields:
    """Tests validating sweet data structure and constraints."""

    def test_sweet_requires_name(self):
        """Creating a sweet without a name should fail."""
        token = _get_auth_token("admin11", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/sweets",
            json={
                # Missing 'name'
                "category": "candy",
                "price": 2.00,
                "quantity": 10
            },
            headers=headers
        )
        assert response.status_code == 422  # Validation error

    def test_sweet_requires_category(self):
        """Creating a sweet without a category should fail."""
        token = _get_auth_token("admin12", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/sweets",
            json={
                "name": "Test Sweet",
                # Missing 'category'
                "price": 2.00,
                "quantity": 10
            },
            headers=headers
        )
        assert response.status_code == 422

    def test_sweet_requires_price(self):
        """Creating a sweet without a price should fail."""
        token = _get_auth_token("admin13", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/sweets",
            json={
                "name": "Test Sweet",
                "category": "candy",
                # Missing 'price'
                "quantity": 10
            },
            headers=headers
        )
        assert response.status_code == 422

    def test_sweet_requires_quantity(self):
        """Creating a sweet without a quantity should fail."""
        token = _get_auth_token("admin14", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/sweets",
            json={
                "name": "Test Sweet",
                "category": "candy",
                "price": 2.00
                # Missing 'quantity'
            },
            headers=headers
        )
        assert response.status_code == 422

    def test_sweet_price_must_be_positive(self):
        """Sweet price must be positive (> 0)."""
        token = _get_auth_token("admin15", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/sweets",
            json={
                "name": "Test Sweet",
                "category": "candy",
                "price": -5.00,  # Invalid: negative
                "quantity": 10
            },
            headers=headers
        )
        # Should fail validation (status 422) or business logic (400)
        assert response.status_code in [422, 400]

    def test_sweet_quantity_must_be_non_negative(self):
        """Sweet quantity must be non-negative (>= 0)."""
        token = _get_auth_token("admin16", "secret123")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(
            "/api/sweets",
            json={
                "name": "Test Sweet",
                "category": "candy",
                "price": 2.00,
                "quantity": -5  # Invalid: negative
            },
            headers=headers
        )
        assert response.status_code in [422, 400]
