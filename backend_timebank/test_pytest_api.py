"""
Pytest tests for Sprint 2: Services, Service Requests, Time Credits, and Admin Management.

Uses an in-memory SQLite database for each test,
so there is NO need to start the server with uvicorn.

Run with:
    pytest test_pytest_api.py -v
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from app.database import Base, get_db
# Import all models so Base.metadata knows about every table
from app.models.user import User  # noqa: F401
from app.models.service import Service  # noqa: F401
from app.models.service_request import ServiceRequest  # noqa: F401
from app.models.transaction import Transaction  # noqa: F401


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
# Reusable test data and helpers
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

PROVIDER_DATA = {
    "email": "provider@example.com",
    "password": "providerpass123",
    "first_name": "Alice",
    "last_name": "Provider",
}

PROVIDER_LOGIN = {
    "email": "provider@example.com",
    "password": "providerpass123",
}

SERVICE_DATA = {
    "title": "Python Tutoring",
    "description": "One-on-one Python programming lessons",
    "category": "Education",
    "price": 5.0,
}


def register_user(client, data=None):
    """Helper: register a user and return the response."""
    return client.post("/api/v1/auth/register", json=data or USER_DATA)


def login_user(client, data=None):
    """Helper: register and log in, return the token."""
    register_user(client, data or USER_DATA)
    response = client.post("/api/v1/auth/login", json=data or LOGIN_DATA)
    return response.json()["access_token"]


def login_only(client, data=None):
    """Helper: log in an already-registered user, return the token."""
    response = client.post("/api/v1/auth/login", json=data or LOGIN_DATA)
    return response.json()["access_token"]


def auth_header(token):
    """Helper: return the authorization headers."""
    return {"Authorization": f"Bearer {token}"}


def create_admin(client):
    """Helper: register a user and manually set their role to admin via DB override."""
    response = register_user(client, {
        "email": "admin@example.com",
        "password": "adminpass123",
        "first_name": "Admin",
        "last_name": "User",
    })
    user_id = response.json()["id"]

    # Directly modify the user's role in the DB
    from app.database import get_db as original_get_db
    db_gen = app.dependency_overrides[get_db]()
    db = next(db_gen)
    user = db.query(User).filter(User.id == user_id).first()
    user.role = "admin"
    db.commit()
    db.close()

    token = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "adminpass123",
    }).json()["access_token"]
    return token, user_id


def give_credits(client, user_id, amount):
    """Helper: directly add credits to a user's balance in the DB."""
    db_gen = app.dependency_overrides[get_db]()
    db = next(db_gen)
    user = db.query(User).filter(User.id == user_id).first()
    user.balance += amount
    db.commit()
    db.close()


# ──────────────────────────────────────────────
# Tests: User registration (Sprint 1 — kept for regression)
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
        assert data["balance"] == 0.0
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
# Tests: Login (Sprint 1 — kept for regression)
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
# Tests: Logout (Sprint 1 — kept for regression)
# ──────────────────────────────────────────────

class TestLogout:
    def test_logout(self, client):
        """Logout returns a success message."""
        response = client.post("/api/v1/auth/logout")
        assert response.status_code == 200
        assert "logged out" in response.json()["message"]


# ──────────────────────────────────────────────
# Tests: User profile (Sprint 1 — kept for regression)
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
# Tests: Profile update (Sprint 1 — kept for regression)
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
# Tests: Admin user management
# ──────────────────────────────────────────────

class TestAdminUserManagement:
    def test_list_users(self, client):
        """Admin can list all users."""
        admin_token, _ = create_admin(client)
        register_user(client)

        response = client.get("/api/v1/users/", headers=auth_header(admin_token))
        assert response.status_code == 200
        assert len(response.json()) >= 2

    def test_list_users_non_admin(self, client):
        """Non-admin users cannot list all users."""
        token = login_user(client)
        response = client.get("/api/v1/users/", headers=auth_header(token))
        assert response.status_code == 403

    def test_get_user_by_id(self, client):
        """Admin can get a specific user by ID."""
        admin_token, _ = create_admin(client)
        register_response = register_user(client)
        user_id = register_response.json()["id"]

        response = client.get(f"/api/v1/users/{user_id}", headers=auth_header(admin_token))
        assert response.status_code == 200
        assert response.json()["id"] == user_id

    def test_update_user_role(self, client):
        """Admin can change a user's role."""
        admin_token, _ = create_admin(client)
        register_response = register_user(client)
        user_id = register_response.json()["id"]

        response = client.put(
            f"/api/v1/users/{user_id}",
            headers=auth_header(admin_token),
            json={"role": "admin"},
        )
        assert response.status_code == 200
        assert response.json()["role"] == "admin"

    def test_deactivate_user(self, client):
        """Admin can deactivate a user."""
        admin_token, _ = create_admin(client)
        register_response = register_user(client)
        user_id = register_response.json()["id"]

        response = client.put(
            f"/api/v1/users/{user_id}",
            headers=auth_header(admin_token),
            json={"is_active": False},
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is False

    def test_admin_cannot_deactivate_self(self, client):
        """Admin cannot deactivate their own account."""
        admin_token, admin_id = create_admin(client)

        response = client.put(
            f"/api/v1/users/{admin_id}",
            headers=auth_header(admin_token),
            json={"is_active": False},
        )
        assert response.status_code == 400

    def test_delete_user(self, client):
        """Admin can delete a user."""
        admin_token, _ = create_admin(client)
        register_response = register_user(client)
        user_id = register_response.json()["id"]

        response = client.delete(f"/api/v1/users/{user_id}", headers=auth_header(admin_token))
        assert response.status_code == 200

        # Verify user is gone
        response = client.get(f"/api/v1/users/{user_id}", headers=auth_header(admin_token))
        assert response.status_code == 404

    def test_admin_cannot_delete_self(self, client):
        """Admin cannot delete their own account."""
        admin_token, admin_id = create_admin(client)

        response = client.delete(f"/api/v1/users/{admin_id}", headers=auth_header(admin_token))
        assert response.status_code == 400


# ──────────────────────────────────────────────
# Tests: Service CRUD
# ──────────────────────────────────────────────

class TestServiceCRUD:
    def test_create_service(self, client):
        """Authenticated user can create a service."""
        token = login_user(client)
        response = client.post(
            "/api/v1/services/",
            headers=auth_header(token),
            json=SERVICE_DATA,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Python Tutoring"
        assert data["price"] == 5.0
        assert data["category"] == "Education"
        assert data["is_active"] is True

    def test_create_service_no_auth(self, client):
        """Unauthenticated users cannot create services."""
        response = client.post("/api/v1/services/", json=SERVICE_DATA)
        assert response.status_code == 401

    def test_list_services_public(self, client):
        """Listing services does not require authentication."""
        token = login_user(client)
        client.post("/api/v1/services/", headers=auth_header(token), json=SERVICE_DATA)

        response = client.get("/api/v1/services/")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1

    def test_list_services_filter_by_category(self, client):
        """Filtering services by category works."""
        token = login_user(client)
        client.post("/api/v1/services/", headers=auth_header(token), json=SERVICE_DATA)
        client.post("/api/v1/services/", headers=auth_header(token), json={
            **SERVICE_DATA, "title": "Guitar Lessons", "category": "Music"
        })

        response = client.get("/api/v1/services/?category=Education")
        assert response.json()["total"] == 1
        assert response.json()["items"][0]["category"] == "Education"

    def test_list_services_search_keyword(self, client):
        """Searching services by keyword works."""
        token = login_user(client)
        client.post("/api/v1/services/", headers=auth_header(token), json=SERVICE_DATA)

        response = client.get("/api/v1/services/?keyword=Python")
        assert response.json()["total"] == 1

        response = client.get("/api/v1/services/?keyword=nonexistent")
        assert response.json()["total"] == 0

    def test_get_service_by_id(self, client):
        """Getting a service by ID returns the correct data."""
        token = login_user(client)
        create_response = client.post(
            "/api/v1/services/", headers=auth_header(token), json=SERVICE_DATA,
        )
        service_id = create_response.json()["id"]

        response = client.get(f"/api/v1/services/{service_id}")
        assert response.status_code == 200
        assert response.json()["id"] == service_id

    def test_get_my_services(self, client):
        """User can list their own services."""
        token = login_user(client)
        client.post("/api/v1/services/", headers=auth_header(token), json=SERVICE_DATA)

        response = client.get("/api/v1/services/me", headers=auth_header(token))
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_update_service(self, client):
        """Service owner can update their service."""
        token = login_user(client)
        create_response = client.post(
            "/api/v1/services/", headers=auth_header(token), json=SERVICE_DATA,
        )
        service_id = create_response.json()["id"]

        response = client.put(
            f"/api/v1/services/{service_id}",
            headers=auth_header(token),
            json={"title": "Advanced Python Tutoring", "price": 10.0},
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Advanced Python Tutoring"
        assert response.json()["price"] == 10.0

    def test_update_service_not_owner(self, client):
        """Non-owner cannot update a service."""
        owner_token = login_user(client)
        create_response = client.post(
            "/api/v1/services/", headers=auth_header(owner_token), json=SERVICE_DATA,
        )
        service_id = create_response.json()["id"]

        other_token = login_user(client, PROVIDER_DATA)
        response = client.put(
            f"/api/v1/services/{service_id}",
            headers=auth_header(other_token),
            json={"title": "Hacked Title"},
        )
        assert response.status_code == 403

    def test_delete_service(self, client):
        """Service owner can delete their service."""
        token = login_user(client)
        create_response = client.post(
            "/api/v1/services/", headers=auth_header(token), json=SERVICE_DATA,
        )
        service_id = create_response.json()["id"]

        response = client.delete(f"/api/v1/services/{service_id}", headers=auth_header(token))
        assert response.status_code == 200

        response = client.get(f"/api/v1/services/{service_id}")
        assert response.status_code == 404

    def test_service_includes_provider_info(self, client):
        """Service response includes embedded provider info."""
        token = login_user(client)
        create_response = client.post(
            "/api/v1/services/", headers=auth_header(token), json=SERVICE_DATA,
        )
        data = create_response.json()
        assert "provider" in data
        assert data["provider"]["first_name"] == "John"
        assert data["provider"]["email"] == "john@example.com"


# ──────────────────────────────────────────────
# Tests: Service request workflow
# ──────────────────────────────────────────────

class TestServiceRequestWorkflow:
    def _setup_service(self, client):
        """Helper: create provider with a service and requester with credits."""
        provider_token = login_user(client, PROVIDER_DATA)
        create_response = client.post(
            "/api/v1/services/", headers=auth_header(provider_token), json=SERVICE_DATA,
        )
        service_id = create_response.json()["id"]
        provider_id = create_response.json()["provider_id"]

        register_user(client)
        requester_id = client.post("/api/v1/auth/login", json=LOGIN_DATA).json()
        requester_token = login_only(client)

        # Give the requester enough credits via profile response to get the ID
        profile = client.get("/api/v1/users/me", headers=auth_header(requester_token)).json()
        give_credits(client, profile["id"], 100.0)

        return provider_token, requester_token, service_id, provider_id, profile["id"]

    def test_create_request(self, client):
        """Requester can create a service request."""
        provider_token, requester_token, service_id, _, _ = self._setup_service(client)

        response = client.post(
            "/api/v1/requests/",
            headers=auth_header(requester_token),
            json={"service_id": service_id},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "pending"

    def test_cannot_request_own_service(self, client):
        """Provider cannot request their own service."""
        provider_token = login_user(client, PROVIDER_DATA)
        create_response = client.post(
            "/api/v1/services/", headers=auth_header(provider_token), json=SERVICE_DATA,
        )
        service_id = create_response.json()["id"]

        response = client.post(
            "/api/v1/requests/",
            headers=auth_header(provider_token),
            json={"service_id": service_id},
        )
        assert response.status_code == 400
        assert "own service" in response.json()["detail"]

    def test_cannot_request_insufficient_credits(self, client):
        """Requester with insufficient credits cannot create a request."""
        provider_token = login_user(client, PROVIDER_DATA)
        create_response = client.post(
            "/api/v1/services/", headers=auth_header(provider_token), json=SERVICE_DATA,
        )
        service_id = create_response.json()["id"]

        requester_token = login_user(client)
        response = client.post(
            "/api/v1/requests/",
            headers=auth_header(requester_token),
            json={"service_id": service_id},
        )
        assert response.status_code == 400
        assert "Insufficient" in response.json()["detail"]

    def test_accept_request(self, client):
        """Provider can accept a pending request."""
        provider_token, requester_token, service_id, _, _ = self._setup_service(client)

        create_response = client.post(
            "/api/v1/requests/",
            headers=auth_header(requester_token),
            json={"service_id": service_id},
        )
        request_id = create_response.json()["id"]

        response = client.patch(
            f"/api/v1/requests/{request_id}/accept",
            headers=auth_header(provider_token),
        )
        assert response.status_code == 200
        assert response.json()["status"] == "accepted"

    def test_reject_request(self, client):
        """Provider can reject a pending request."""
        provider_token, requester_token, service_id, _, _ = self._setup_service(client)

        create_response = client.post(
            "/api/v1/requests/",
            headers=auth_header(requester_token),
            json={"service_id": service_id},
        )
        request_id = create_response.json()["id"]

        response = client.patch(
            f"/api/v1/requests/{request_id}/reject",
            headers=auth_header(provider_token),
        )
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

    def test_cancel_request(self, client):
        """Requester can cancel a pending request."""
        provider_token, requester_token, service_id, _, _ = self._setup_service(client)

        create_response = client.post(
            "/api/v1/requests/",
            headers=auth_header(requester_token),
            json={"service_id": service_id},
        )
        request_id = create_response.json()["id"]

        response = client.patch(
            f"/api/v1/requests/{request_id}/cancel",
            headers=auth_header(requester_token),
        )
        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"

    def test_complete_request_transfers_credits(self, client):
        """Completing a request transfers credits from requester to provider."""
        provider_token, requester_token, service_id, provider_id, requester_id = (
            self._setup_service(client)
        )

        # Create and accept
        create_response = client.post(
            "/api/v1/requests/",
            headers=auth_header(requester_token),
            json={"service_id": service_id},
        )
        request_id = create_response.json()["id"]

        client.patch(
            f"/api/v1/requests/{request_id}/accept",
            headers=auth_header(provider_token),
        )

        # Complete
        response = client.patch(
            f"/api/v1/requests/{request_id}/complete",
            headers=auth_header(provider_token),
        )
        assert response.status_code == 200
        assert response.json()["status"] == "completed"

        # Check balances
        requester_balance = client.get(
            "/api/v1/transactions/balance", headers=auth_header(requester_token),
        ).json()["balance"]
        provider_balance = client.get(
            "/api/v1/transactions/balance", headers=auth_header(provider_token),
        ).json()["balance"]

        assert requester_balance == 95.0  # 100 - 5
        assert provider_balance == 5.0    # 0 + 5

    def test_get_incoming_requests(self, client):
        """Provider can see their incoming requests."""
        provider_token, requester_token, service_id, _, _ = self._setup_service(client)

        client.post(
            "/api/v1/requests/",
            headers=auth_header(requester_token),
            json={"service_id": service_id},
        )

        response = client.get("/api/v1/requests/incoming", headers=auth_header(provider_token))
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_get_outgoing_requests(self, client):
        """Requester can see their outgoing requests."""
        provider_token, requester_token, service_id, _, _ = self._setup_service(client)

        client.post(
            "/api/v1/requests/",
            headers=auth_header(requester_token),
            json={"service_id": service_id},
        )

        response = client.get("/api/v1/requests/outgoing", headers=auth_header(requester_token))
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_cannot_complete_pending_request(self, client):
        """Cannot complete a request that has not been accepted."""
        provider_token, requester_token, service_id, _, _ = self._setup_service(client)

        create_response = client.post(
            "/api/v1/requests/",
            headers=auth_header(requester_token),
            json={"service_id": service_id},
        )
        request_id = create_response.json()["id"]

        response = client.patch(
            f"/api/v1/requests/{request_id}/complete",
            headers=auth_header(provider_token),
        )
        assert response.status_code == 400

    def test_requester_cannot_accept(self, client):
        """Requester cannot accept their own request (only provider can)."""
        provider_token, requester_token, service_id, _, _ = self._setup_service(client)

        create_response = client.post(
            "/api/v1/requests/",
            headers=auth_header(requester_token),
            json={"service_id": service_id},
        )
        request_id = create_response.json()["id"]

        response = client.patch(
            f"/api/v1/requests/{request_id}/accept",
            headers=auth_header(requester_token),
        )
        assert response.status_code == 403


# ──────────────────────────────────────────────
# Tests: Time credits and balance
# ──────────────────────────────────────────────

class TestTimeCredits:
    def test_initial_balance_is_zero(self, client):
        """New users start with zero balance."""
        token = login_user(client)
        response = client.get("/api/v1/transactions/balance", headers=auth_header(token))
        assert response.status_code == 200
        assert response.json()["balance"] == 0.0

    def test_transfer_credits(self, client):
        """User can transfer credits to another user."""
        sender_token = login_user(client)
        sender_profile = client.get("/api/v1/users/me", headers=auth_header(sender_token)).json()
        give_credits(client, sender_profile["id"], 50.0)

        register_user(client, PROVIDER_DATA)
        receiver_token = login_only(client, PROVIDER_LOGIN)
        receiver_profile = client.get(
            "/api/v1/users/me", headers=auth_header(receiver_token)
        ).json()

        response = client.post(
            "/api/v1/transactions/transfer",
            headers=auth_header(sender_token),
            json={"receiver_id": receiver_profile["id"], "amount": 20.0},
        )
        assert response.status_code == 200
        assert response.json()["amount"] == 20.0
        assert response.json()["transaction_type"] == "credit_transfer"

        # Check sender balance
        sender_balance = client.get(
            "/api/v1/transactions/balance", headers=auth_header(sender_token),
        ).json()["balance"]
        assert sender_balance == 30.0

        # Check receiver balance
        receiver_balance = client.get(
            "/api/v1/transactions/balance", headers=auth_header(receiver_token),
        ).json()["balance"]
        assert receiver_balance == 20.0

    def test_transfer_insufficient_credits(self, client):
        """Transfer fails if sender has insufficient credits."""
        sender_token = login_user(client)
        register_user(client, PROVIDER_DATA)
        receiver_profile = client.get(
            "/api/v1/users/me",
            headers=auth_header(login_only(client, PROVIDER_LOGIN)),
        ).json()

        response = client.post(
            "/api/v1/transactions/transfer",
            headers=auth_header(sender_token),
            json={"receiver_id": receiver_profile["id"], "amount": 100.0},
        )
        assert response.status_code == 400
        assert "Insufficient" in response.json()["detail"]

    def test_transfer_to_self_fails(self, client):
        """User cannot transfer credits to themselves."""
        token = login_user(client)
        profile = client.get("/api/v1/users/me", headers=auth_header(token)).json()
        give_credits(client, profile["id"], 50.0)

        response = client.post(
            "/api/v1/transactions/transfer",
            headers=auth_header(token),
            json={"receiver_id": profile["id"], "amount": 10.0},
        )
        assert response.status_code == 400
        assert "yourself" in response.json()["detail"]

    def test_transfer_to_nonexistent_user(self, client):
        """Transfer fails if receiver does not exist."""
        token = login_user(client)
        profile = client.get("/api/v1/users/me", headers=auth_header(token)).json()
        give_credits(client, profile["id"], 50.0)

        response = client.post(
            "/api/v1/transactions/transfer",
            headers=auth_header(token),
            json={"receiver_id": 99999, "amount": 10.0},
        )
        assert response.status_code == 404


# ──────────────────────────────────────────────
# Tests: Transaction history
# ──────────────────────────────────────────────

class TestTransactionHistory:
    def test_empty_history(self, client):
        """New user has empty transaction history."""
        token = login_user(client)
        response = client.get("/api/v1/transactions/", headers=auth_header(token))
        assert response.status_code == 200
        assert response.json() == []

    def test_history_after_transfer(self, client):
        """Transaction history includes transfers."""
        sender_token = login_user(client)
        sender_profile = client.get("/api/v1/users/me", headers=auth_header(sender_token)).json()
        give_credits(client, sender_profile["id"], 50.0)

        register_user(client, PROVIDER_DATA)
        receiver_token = login_only(client, PROVIDER_LOGIN)
        receiver_profile = client.get(
            "/api/v1/users/me", headers=auth_header(receiver_token)
        ).json()

        client.post(
            "/api/v1/transactions/transfer",
            headers=auth_header(sender_token),
            json={"receiver_id": receiver_profile["id"], "amount": 10.0},
        )

        # Sender sees the transaction
        sender_history = client.get(
            "/api/v1/transactions/", headers=auth_header(sender_token),
        ).json()
        assert len(sender_history) == 1
        assert sender_history[0]["transaction_type"] == "credit_transfer"

        # Receiver also sees the transaction
        receiver_history = client.get(
            "/api/v1/transactions/", headers=auth_header(receiver_token),
        ).json()
        assert len(receiver_history) == 1

    def test_history_after_service_completion(self, client):
        """Transaction history includes service payments after completion."""
        provider_token = login_user(client, PROVIDER_DATA)
        create_response = client.post(
            "/api/v1/services/", headers=auth_header(provider_token), json=SERVICE_DATA,
        )
        service_id = create_response.json()["id"]

        requester_token = login_user(client)
        requester_profile = client.get(
            "/api/v1/users/me", headers=auth_header(requester_token)
        ).json()
        give_credits(client, requester_profile["id"], 50.0)

        # Create, accept, complete
        req_response = client.post(
            "/api/v1/requests/",
            headers=auth_header(requester_token),
            json={"service_id": service_id},
        )
        request_id = req_response.json()["id"]

        client.patch(
            f"/api/v1/requests/{request_id}/accept",
            headers=auth_header(provider_token),
        )
        client.patch(
            f"/api/v1/requests/{request_id}/complete",
            headers=auth_header(provider_token),
        )

        # Provider sees the service payment
        provider_history = client.get(
            "/api/v1/transactions/", headers=auth_header(provider_token),
        ).json()
        assert len(provider_history) == 1
        assert provider_history[0]["transaction_type"] == "service_payment"
        assert provider_history[0]["service_request_id"] == request_id


# ──────────────────────────────────────────────
# Tests: Credit purchase (with mocked payment gateway)
# ──────────────────────────────────────────────

class TestCreditPurchase:
    @patch("app.services.transaction_service.httpx.post")
    def test_purchase_credits_success(self, mock_post, client):
        """Purchasing credits via the gateway adds balance."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id": 1, "balance": 100.0}
        mock_post.return_value = mock_response

        token = login_user(client)

        response = client.post(
            "/api/v1/transactions/purchase",
            headers=auth_header(token),
            json={
                "card_number": "4111111111111111",
                "expiration_date": "12/25",
                "cvc": "123",
                "amount": 50.0,
            },
        )
        assert response.status_code == 200
        assert response.json()["amount"] == 50.0
        assert response.json()["transaction_type"] == "credit_purchase"

        # Verify balance increased
        balance = client.get(
            "/api/v1/transactions/balance", headers=auth_header(token),
        ).json()["balance"]
        assert balance == 50.0

    @patch("app.services.transaction_service.httpx.post")
    def test_purchase_invalid_card(self, mock_post, client):
        """Purchase with invalid card details returns 400."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_post.return_value = mock_response

        token = login_user(client)

        response = client.post(
            "/api/v1/transactions/purchase",
            headers=auth_header(token),
            json={
                "card_number": "0000000000000000",
                "expiration_date": "01/25",
                "cvc": "000",
                "amount": 50.0,
            },
        )
        assert response.status_code == 400
        assert "Invalid card" in response.json()["detail"]

    @patch("app.services.transaction_service.httpx.post")
    def test_purchase_insufficient_card_funds(self, mock_post, client):
        """Purchase with insufficient card funds returns 400."""
        mock_response = MagicMock()
        mock_response.status_code = 402
        mock_post.return_value = mock_response

        token = login_user(client)

        response = client.post(
            "/api/v1/transactions/purchase",
            headers=auth_header(token),
            json={
                "card_number": "4111111111111111",
                "expiration_date": "12/25",
                "cvc": "123",
                "amount": 999999.0,
            },
        )
        assert response.status_code == 400
        assert "Insufficient card" in response.json()["detail"]


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

    def test_full_service_marketplace_flow(self, client):
        """Full marketplace flow: create service -> request -> accept -> complete -> verify."""
        # 1. Provider creates a service
        provider_token = login_user(client, PROVIDER_DATA)
        res = client.post("/api/v1/services/", headers=auth_header(provider_token), json=SERVICE_DATA)
        assert res.status_code == 200
        service_id = res.json()["id"]

        # 2. Requester registers and gets credits
        requester_token = login_user(client)
        requester_profile = client.get("/api/v1/users/me", headers=auth_header(requester_token)).json()
        give_credits(client, requester_profile["id"], 100.0)

        # 3. Requester creates a service request
        res = client.post(
            "/api/v1/requests/",
            headers=auth_header(requester_token),
            json={"service_id": service_id},
        )
        assert res.status_code == 200
        request_id = res.json()["id"]

        # 4. Provider accepts the request
        res = client.patch(
            f"/api/v1/requests/{request_id}/accept",
            headers=auth_header(provider_token),
        )
        assert res.status_code == 200

        # 5. Provider completes the request
        res = client.patch(
            f"/api/v1/requests/{request_id}/complete",
            headers=auth_header(provider_token),
        )
        assert res.status_code == 200
        assert res.json()["status"] == "completed"

        # 6. Verify balances
        requester_balance = client.get(
            "/api/v1/transactions/balance",
            headers=auth_header(requester_token),
        ).json()["balance"]
        provider_balance = client.get(
            "/api/v1/transactions/balance",
            headers=auth_header(provider_token),
        ).json()["balance"]

        assert requester_balance == 95.0
        assert provider_balance == 5.0

        # 7. Verify transaction history
        requester_history = client.get(
            "/api/v1/transactions/",
            headers=auth_header(requester_token),
        ).json()
        assert len(requester_history) == 1
        assert requester_history[0]["transaction_type"] == "service_payment"
