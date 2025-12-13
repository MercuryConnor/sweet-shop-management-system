"""
Authentication tests - covers user registration and login.
Tests are isolated and do not test product/domain logic.
"""
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import Base, engine

client = TestClient(app)


def setup_module(module):
    """Reset database before running auth tests."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


class TestRegistration:
    """User registration tests."""

    def test_register_user_success(self):
        """Test successful user registration."""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "alice",
                "password": "secret123",
                "full_name": "Alice Anderson"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "alice"
        assert data["full_name"] == "Alice Anderson"
        assert "id" in data

    def test_register_user_duplicate_username(self):
        """Test registration fails with duplicate username."""
        # First registration
        client.post(
            "/api/auth/register",
            json={
                "username": "bob",
                "password": "secret123",
                "full_name": "Bob Brown"
            }
        )
        # Duplicate attempt
        response = client.post(
            "/api/auth/register",
            json={
                "username": "bob",
                "password": "different_password",
                "full_name": "Bob Brown Jr"
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]


class TestLogin:
    """User login and JWT token tests."""

    def test_login_success(self):
        """Test successful login returns JWT token."""
        # Register user
        client.post(
            "/api/auth/register",
            json={
                "username": "charlie",
                "password": "secret123",
                "full_name": "Charlie Chen"
            }
        )
        # Login
        response = client.post(
            "/api/auth/login",
            data={
                "username": "charlie",
                "password": "secret123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0

    def test_login_invalid_username(self):
        """Test login fails with invalid username."""
        response = client.post(
            "/api/auth/login",
            data={
                "username": "nonexistent",
                "password": "any_password"
            }
        )
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

    def test_login_invalid_password(self):
        """Test login fails with incorrect password."""
        # Register user
        client.post(
            "/api/auth/register",
            json={
                "username": "diana",
                "password": "correct_password",
                "full_name": "Diana Davis"
            }
        )
        # Login with wrong password
        response = client.post(
            "/api/auth/login",
            data={
                "username": "diana",
                "password": "wrong_password"
            }
        )
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]
