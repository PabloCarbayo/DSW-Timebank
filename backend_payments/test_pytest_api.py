"""
Tests con pytest para el Payment Gateway API.

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
from app.models.card import CreditCard  # noqa: F401


# ──────────────────────────────────────────────
# Fixtures: Base de datos en memoria para tests
# ──────────────────────────────────────────────

@pytest.fixture(name="client")
def client_fixture():
    """
    Crea un TestClient con una base de datos SQLite en memoria.
    Cada test obtiene una base de datos limpia y aislada.
    """
    # StaticPool asegura que todas las conexiones usan la misma BD en memoria
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Crear todas las tablas en la BD en memoria
    Base.metadata.create_all(bind=engine)

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
    Base.metadata.drop_all(bind=engine)


# ──────────────────────────────────────────────
# Datos de prueba reutilizables
# ──────────────────────────────────────────────

CARD_DATA = {
    "cardholder_name": "John Doe",
    "card_number": "1234567812345678",
    "expiration_date": "12/28",
    "cvc": "123",
    "initial_balance": 100.0,
}

VERIFY_DATA = {
    "card_number": "1234567812345678",
    "expiration_date": "12/28",
    "cvc": "123",
}


def register_card(client):
    """Helper: registra una tarjeta y devuelve la respuesta."""
    return client.post("/api/v1/cards/", json=CARD_DATA)


# ──────────────────────────────────────────────
# Tests: Registro de tarjetas
# ──────────────────────────────────────────────

class TestRegisterCard:
    def test_register_card_success(self, client):
        """Registrar una tarjeta nueva devuelve 200 y los datos correctos."""
        response = register_card(client)
        assert response.status_code == 200

        data = response.json()
        assert data["cardholder_name"] == "John Doe"
        assert data["card_number"] == "1234567812345678"
        assert data["balance"] == 100.0

    def test_register_duplicate_card(self, client):
        """Registrar una tarjeta duplicada devuelve 400."""
        register_card(client)
        response = register_card(client)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]


# ──────────────────────────────────────────────
# Tests: Verificación de tarjetas
# ──────────────────────────────────────────────

class TestVerifyCard:
    def test_verify_valid_card(self, client):
        """Verificar una tarjeta con datos correctos devuelve 'valid'."""
        register_card(client)
        response = client.post("/api/v1/cards/verify", json=VERIFY_DATA)
        assert response.status_code == 200
        assert response.json()["status"] == "valid"

    def test_verify_wrong_cvc(self, client):
        """Verificar con CVC incorrecto devuelve 401."""
        register_card(client)
        wrong_data = {**VERIFY_DATA, "cvc": "999"}
        response = client.post("/api/v1/cards/verify", json=wrong_data)
        assert response.status_code == 401

    def test_verify_nonexistent_card(self, client):
        """Verificar una tarjeta que no existe devuelve 401."""
        response = client.post("/api/v1/cards/verify", json={
            "card_number": "0000000000000000",
            "expiration_date": "01/30",
            "cvc": "000",
        })
        assert response.status_code == 401


# ──────────────────────────────────────────────
# Tests: Procesamiento de pagos
# ──────────────────────────────────────────────

class TestProcessPayment:
    def test_payment_success(self, client):
        """Un pago válido descuenta el saldo correctamente."""
        register_card(client)
        payment = {**VERIFY_DATA, "amount": 40.0}
        response = client.post("/api/v1/cards/pay", json=payment)
        assert response.status_code == 200
        assert response.json()["balance"] == 60.0

    def test_payment_insufficient_funds(self, client):
        """Un pago mayor al saldo devuelve 402."""
        register_card(client)
        payment = {**VERIFY_DATA, "amount": 999.0}
        response = client.post("/api/v1/cards/pay", json=payment)
        assert response.status_code == 402
        assert "Insufficient funds" in response.json()["detail"]

    def test_payment_invalid_card(self, client):
        """Pagar con datos de tarjeta incorrectos devuelve 401."""
        register_card(client)
        payment = {**VERIFY_DATA, "cvc": "999", "amount": 10.0}
        response = client.post("/api/v1/cards/pay", json=payment)
        assert response.status_code == 401


# ──────────────────────────────────────────────
# Tests: Recarga de saldo (top-up)
# ──────────────────────────────────────────────

class TestTopUp:
    def test_topup_success(self, client):
        """Recargar saldo incrementa el balance correctamente."""
        register_card(client)
        topup = {**VERIFY_DATA, "amount": 50.0}
        response = client.post("/api/v1/cards/topup", json=topup)
        assert response.status_code == 200
        assert response.json()["balance"] == 150.0

    def test_topup_invalid_card(self, client):
        """Recargar con datos incorrectos devuelve 401."""
        register_card(client)
        topup = {**VERIFY_DATA, "cvc": "999", "amount": 50.0}
        response = client.post("/api/v1/cards/topup", json=topup)
        assert response.status_code == 401


# ──────────────────────────────────────────────
# Tests: Consultar detalles de tarjeta
# ──────────────────────────────────────────────

class TestGetCardDetails:
    def test_get_existing_card(self, client):
        """Consultar una tarjeta registrada devuelve sus datos."""
        register_card(client)
        response = client.get("/api/v1/cards/1234567812345678")
        assert response.status_code == 200

        data = response.json()
        assert data["cardholder_name"] == "John Doe"
        assert data["balance"] == 100.0

    def test_get_nonexistent_card(self, client):
        """Consultar una tarjeta que no existe devuelve 404."""
        response = client.get("/api/v1/cards/0000000000000000")
        assert response.status_code == 404


# ──────────────────────────────────────────────
# Tests: Flujo completo de integración
# ──────────────────────────────────────────────

class TestIntegrationFlow:
    def test_full_payment_flow(self, client):
        """Flujo completo: registrar → verificar → pagar → recargar → consultar."""
        # 1. Registrar tarjeta
        res = register_card(client)
        assert res.status_code == 200
        assert res.json()["balance"] == 100.0

        # 2. Verificar tarjeta
        res = client.post("/api/v1/cards/verify", json=VERIFY_DATA)
        assert res.status_code == 200

        # 3. Pagar $40
        res = client.post("/api/v1/cards/pay", json={**VERIFY_DATA, "amount": 40.0})
        assert res.status_code == 200
        assert res.json()["balance"] == 60.0

        # 4. Recargar $20
        res = client.post("/api/v1/cards/topup", json={**VERIFY_DATA, "amount": 20.0})
        assert res.status_code == 200
        assert res.json()["balance"] == 80.0

        # 5. Consultar saldo final
        res = client.get("/api/v1/cards/1234567812345678")
        assert res.status_code == 200
        assert res.json()["balance"] == 80.0
