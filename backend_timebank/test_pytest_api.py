"""
Tests con pytest para el Time Bank User Management API.

Usa una base de datos SQLite en memoria para cada test,
por lo que NO necesitas arrancar el servidor con uvicorn.

Ejecutar con:
    pytest test_pytest_api.py -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from app.database import Base, get_db
# Importar el modelo para que Base.metadata conozca las tablas
from app.models.user import User  # noqa: F401


# ──────────────────────────────────────────────
# Fixtures: Base de datos en memoria para tests
# ──────────────────────────────────────────────

@pytest.fixture(name="client")
def client_fixture():
    """
    Crea un TestClient con una base de datos SQLite en memoria.
    Cada test obtiene una base de datos limpia y aislada.
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
# Datos de prueba reutilizables
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
    """Helper: registra un usuario y devuelve la respuesta."""
    return client.post("/api/v1/auth/register", json=USER_DATA)


def login_user(client):
    """Helper: registra y hace login, devuelve el token."""
    register_user(client)
    response = client.post("/api/v1/auth/login", json=LOGIN_DATA)
    return response.json()["access_token"]


def auth_header(token):
    """Helper: devuelve las cabeceras de autorización."""
    return {"Authorization": f"Bearer {token}"}


# ──────────────────────────────────────────────
# Tests: Registro de usuarios
# ──────────────────────────────────────────────

class TestRegister:
    def test_register_success(self, client):
        """Registrar un usuario nuevo devuelve 200 y los datos correctos."""
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
        """Registrar con email duplicado devuelve 400."""
        register_user(client)
        response = register_user(client)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_register_invalid_email(self, client):
        """Registrar con email inválido devuelve 422."""
        data = {**USER_DATA, "email": "not-an-email"}
        response = client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 422

    def test_register_short_password(self, client):
        """Registrar con contraseña corta devuelve 422."""
        data = {**USER_DATA, "email": "short@test.com", "password": "123"}
        response = client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 422


# ──────────────────────────────────────────────
# Tests: Login
# ──────────────────────────────────────────────

class TestLogin:
    def test_login_success(self, client):
        """Login con credenciales correctas devuelve un token JWT."""
        register_user(client)
        response = client.post("/api/v1/auth/login", json=LOGIN_DATA)
        assert response.status_code == 200

        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        """Login con contraseña incorrecta devuelve 401."""
        register_user(client)
        response = client.post("/api/v1/auth/login", json={
            "email": "john@example.com",
            "password": "wrongpassword",
        })
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Login con email inexistente devuelve 401."""
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
        """Logout devuelve mensaje de éxito."""
        response = client.post("/api/v1/auth/logout")
        assert response.status_code == 200
        assert "logged out" in response.json()["message"]


# ──────────────────────────────────────────────
# Tests: Perfil de usuario (GET /me)
# ──────────────────────────────────────────────

class TestGetProfile:
    def test_get_profile_success(self, client):
        """Obtener perfil con token válido devuelve los datos del usuario."""
        token = login_user(client)
        response = client.get("/api/v1/users/me", headers=auth_header(token))
        assert response.status_code == 200

        data = response.json()
        assert data["email"] == "john@example.com"
        assert data["first_name"] == "John"

    def test_get_profile_no_token(self, client):
        """Obtener perfil sin token devuelve 401."""
        response = client.get("/api/v1/users/me")
        assert response.status_code == 401

    def test_get_profile_invalid_token(self, client):
        """Obtener perfil con token inválido devuelve 401."""
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalidtoken123"},
        )
        assert response.status_code == 401


# ──────────────────────────────────────────────
# Tests: Actualización de perfil (PUT /me)
# ──────────────────────────────────────────────

class TestUpdateProfile:
    def test_update_name(self, client):
        """Actualizar el nombre del usuario funciona correctamente."""
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
        """Actualizar la contraseña permite login con la nueva contraseña."""
        token = login_user(client)
        response = client.put(
            "/api/v1/users/me",
            headers=auth_header(token),
            json={"password": "newpassword456"},
        )
        assert response.status_code == 200

        # Login con la nueva contraseña
        response = client.post("/api/v1/auth/login", json={
            "email": "john@example.com",
            "password": "newpassword456",
        })
        assert response.status_code == 200

        # Login con la antigua falla
        response = client.post("/api/v1/auth/login", json=LOGIN_DATA)
        assert response.status_code == 401

    def test_update_partial(self, client):
        """Actualizar solo un campo no modifica los demás."""
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
        """Actualizar perfil sin token devuelve 401."""
        response = client.put("/api/v1/users/me", json={"first_name": "Jane"})
        assert response.status_code == 401


# ──────────────────────────────────────────────
# Tests: Flujo completo de integración
# ──────────────────────────────────────────────

class TestIntegrationFlow:
    def test_full_user_flow(self, client):
        """Flujo completo: registro → login → perfil → actualizar → verificar."""
        # 1. Registrar usuario
        res = register_user(client)
        assert res.status_code == 200
        assert res.json()["email"] == "john@example.com"

        # 2. Login
        res = client.post("/api/v1/auth/login", json=LOGIN_DATA)
        assert res.status_code == 200
        token = res.json()["access_token"]

        # 3. Obtener perfil
        res = client.get("/api/v1/users/me", headers=auth_header(token))
        assert res.status_code == 200
        assert res.json()["first_name"] == "John"

        # 4. Actualizar nombre
        res = client.put(
            "/api/v1/users/me",
            headers=auth_header(token),
            json={"first_name": "Johnny"},
        )
        assert res.status_code == 200
        assert res.json()["first_name"] == "Johnny"

        # 5. Verificar que el cambio persiste
        res = client.get("/api/v1/users/me", headers=auth_header(token))
        assert res.status_code == 200
        assert res.json()["first_name"] == "Johnny"
        assert res.json()["last_name"] == "Doe"

        # 6. Logout
        res = client.post("/api/v1/auth/logout")
        assert res.status_code == 200
