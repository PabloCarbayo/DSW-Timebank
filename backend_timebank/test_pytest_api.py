"""
Pytest tests for the Time Bank User Management API.

Uses an in-memory SQLite database for each test,
so there is NO need to start the server with uvicorn.

Run with:
    pytest test_pytest_api.py -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from app.database import Base, get_db
# Import the model so Base.metadata knows about the tables
from app.models.user import User  # noqa: F401


# ──────────────────────────────────────────────
# Fixtures: In-memory database for tests
# ──────────────────────────────────────────────

@pytest.fixture(name="client")
def client_fixture():
    """
    Create a TestClient backed by an in-memory SQLite database.
    Each test gets a clean, isolated database.
    """
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    # Replace the engine used by the lifespan handler
    import app.database as db_module
    original_engine = db_module.engine
    db_module.engine = test_engine

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
    db_module.engine = original_engine
    Base.metadata.drop_all(bind=test_engine)


# ──────────────────────────────────────────────
# Reusable test data
# ──────────────────────────────────────────────

USER_DATA = {
    "email": "john@example.com",
    "password": "securepassword123",
    "first_name": "John",
    "last_name": "Doe",
}

LOGIN_DATA = {
    "email": "john@example.com",
    "password": "securepassword123",
}


def register_user(client):
    """Helper: register a user and return the response."""
    return client.post("/api/v1/auth/register", json=USER_DATA)


def login_user(client):
    """Helper: register and log in, return the token."""
    register_user(client)
    response = client.post("/api/v1/auth/login", json=LOGIN_DATA)
    return response.json()["access_token"]


def auth_header(token):
    """Helper: return the authorization headers."""
    return {"Authorization": f"Bearer {token}"}


# ──────────────────────────────────────────────
# Tests: User registration
# ──────────────────────────────────────────────

class TestRegister:
    def test_register_success(self, client):
        """Registering a new user returns 200 and the correct data."""
        response = register_user(client)
        assert response.status_code == 200

        data = response.json()
        assert data["email"] == "john@example.com"
        assert data["first_name"] == "John"
        assert data["last_name"] == "Doe"
        assert data["role"] == "user"
        assert data["is_active"] is True
        assert "id" in data
        assert "password" not in data
        assert "hashed_password" not in data

    def test_register_duplicate_email(self, client):
        """Registering with a duplicate email returns 400."""
        register_user(client)
        response = register_user(client)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_register_invalid_email(self, client):
        """Registering with an invalid email returns 422."""
        data = {**USER_DATA, "email": "not-an-email"}
        response = client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 422

    def test_register_short_password(self, client):
        """Registering with a short password returns 422."""
        data = {**USER_DATA, "email": "short@test.com", "password": "123"}
        response = client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 422


# ──────────────────────────────────────────────
# Tests: Login
# ──────────────────────────────────────────────

class TestLogin:
    def test_login_success(self, client):
        """Logging in with correct credentials returns a JWT token."""
        register_user(client)
        response = client.post("/api/v1/auth/login", json=LOGIN_DATA)
        assert response.status_code == 200

        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        """Logging in with incorrect password returns 401."""
        register_user(client)
        response = client.post("/api/v1/auth/login", json={
            "email": "john@example.com",
            "password": "wrongpassword",
        })
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Logging in with a nonexistent email returns 401."""
        response = client.post("/api/v1/auth/login", json={
            "email": "noone@example.com",
            "password": "somepassword",
        })
        assert response.status_code == 401


# ──────────────────────────────────────────────
# Tests: Logout
# ──────────────────────────────────────────────

class TestLogout:
    def test_logout(self, client):
        """Logout returns a success message."""
        response = client.post("/api/v1/auth/logout")
        assert response.status_code == 200
        assert "logged out" in response.json()["message"]


# ──────────────────────────────────────────────
# Tests: User profile (GET /me)
# ──────────────────────────────────────────────

class TestGetProfile:
    def test_get_profile_success(self, client):
        """Getting profile with a valid token returns the user data."""
        token = login_user(client)
        response = client.get("/api/v1/users/me", headers=auth_header(token))
        assert response.status_code == 200

        data = response.json()
        assert data["email"] == "john@example.com"
        assert data["first_name"] == "John"

    def test_get_profile_no_token(self, client):
        """Getting profile without a token returns 401."""
        response = client.get("/api/v1/users/me")
        assert response.status_code == 401

    def test_get_profile_invalid_token(self, client):
        """Getting profile with an invalid token returns 401."""
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalidtoken123"},
        )
        assert response.status_code == 401


# ──────────────────────────────────────────────
# Tests: Profile update (PUT /me)
# ──────────────────────────────────────────────

class TestUpdateProfile:
    def test_update_name(self, client):
        """Updating the user name works correctly."""
        token = login_user(client)
        response = client.put(
            "/api/v1/users/me",
            headers=auth_header(token),
            json={"first_name": "Jane", "last_name": "Smith"},
        )
        assert response.status_code == 200

        data = response.json()
        assert data["first_name"] == "Jane"
        assert data["last_name"] == "Smith"

    def test_update_password(self, client):
        """Updating the password allows login with the new password."""
        token = login_user(client)
        response = client.put(
            "/api/v1/users/me",
            headers=auth_header(token),
            json={"password": "newpassword456"},
        )
        assert response.status_code == 200

        # Login with the new password
        response = client.post("/api/v1/auth/login", json={
            "email": "john@example.com",
            "password": "newpassword456",
        })
        assert response.status_code == 200

        # Login with the old password fails
        response = client.post("/api/v1/auth/login", json=LOGIN_DATA)
        assert response.status_code == 401

    def test_update_partial(self, client):
        """Updating only one field does not modify the others."""
        token = login_user(client)
        response = client.put(
            "/api/v1/users/me",
            headers=auth_header(token),
            json={"first_name": "Jane"},
        )
        assert response.status_code == 200

        data = response.json()
        assert data["first_name"] == "Jane"
        assert data["last_name"] == "Doe"

    def test_update_no_token(self, client):
        """Updating profile without a token returns 401."""
        response = client.put("/api/v1/users/me", json={"first_name": "Jane"})
        assert response.status_code == 401


# ──────────────────────────────────────────────
# Tests: Full integration flow
# ──────────────────────────────────────────────

class TestIntegrationFlow:
    def test_full_user_flow(self, client):
        """Full flow: register -> login -> profile -> update -> verify."""
        # 1. Register user
        res = register_user(client)
        assert res.status_code == 200
        assert res.json()["email"] == "john@example.com"

        # 2. Login
        res = client.post("/api/v1/auth/login", json=LOGIN_DATA)
        assert res.status_code == 200
        token = res.json()["access_token"]

        # 3. Get profile
        res = client.get("/api/v1/users/me", headers=auth_header(token))
        assert res.status_code == 200
        assert res.json()["first_name"] == "John"

        # 4. Update name
        res = client.put(
            "/api/v1/users/me",
            headers=auth_header(token),
            json={"first_name": "Johnny"},
        )
        assert res.status_code == 200
        assert res.json()["first_name"] == "Johnny"

        # 5. Verify change persists
        res = client.get("/api/v1/users/me", headers=auth_header(token))
        assert res.status_code == 200
        assert res.json()["first_name"] == "Johnny"
        assert res.json()["last_name"] == "Doe"

        # 6. Logout
        res = client.post("/api/v1/auth/logout")
        assert res.status_code == 200
