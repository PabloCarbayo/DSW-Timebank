"""
Pytest tests for the Payment Gateway API.

Uses an in-memory SQLite database for each test,
so there is NO need to start the server with uvicorn.

Run with:
    pytest test_pytest_api.py -v
"""

import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from app.database import Base, get_db
# Import the model so Base.metadata knows about the tables
from app.models.card import CreditCard  # noqa: F401


# ──────────────────────────────────────────────
# Fixtures: In-memory database for tests
# ──────────────────────────────────────────────

@pytest.fixture(name="client")
def client_fixture():
    """
    Create a TestClient backed by an in-memory SQLite database.
    Each test gets a clean, isolated database.
    """
    # StaticPool ensures all connections share the same in-memory database
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
    """Helper: register a card and return the response."""
    return client.post("/api/v1/cards/", json=CARD_DATA)


# ──────────────────────────────────────────────
# Tests: Card registration
# ──────────────────────────────────────────────

class TestRegisterCard:
    def test_register_card_success(self, client):
        """Registering a new card returns 200 and the correct data."""
        response = register_card(client)
        assert response.status_code == 200

        data = response.json()
        assert data["cardholder_name"] == "John Doe"
        assert data["card_number"] == "1234567812345678"
        assert Decimal(str(data["balance"])) == Decimal("100.0")

    def test_register_duplicate_card(self, client):
        """Registering a duplicate card returns 400."""
        register_card(client)
        response = register_card(client)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]


# ──────────────────────────────────────────────
# Tests: Card verification
# ──────────────────────────────────────────────

class TestVerifyCard:
    def test_verify_valid_card(self, client):
        """Verifying a card with correct details returns 'valid'."""
        register_card(client)
        response = client.post("/api/v1/cards/verify", json=VERIFY_DATA)
        assert response.status_code == 200
        assert response.json()["status"] == "valid"

    def test_verify_wrong_cvc(self, client):
        """Verifying with an incorrect CVC returns 401."""
        register_card(client)
        wrong_data = {**VERIFY_DATA, "cvc": "999"}
        response = client.post("/api/v1/cards/verify", json=wrong_data)
        assert response.status_code == 401

    def test_verify_nonexistent_card(self, client):
        """Verifying a nonexistent card returns 401."""
        response = client.post("/api/v1/cards/verify", json={
            "card_number": "0000000000000000",
            "expiration_date": "01/30",
            "cvc": "000",
        })
        assert response.status_code == 401


# ──────────────────────────────────────────────
# Tests: Payment processing
# ──────────────────────────────────────────────

class TestProcessPayment:
    def test_payment_success(self, client):
        """A valid payment deducts the balance correctly."""
        register_card(client)
        payment = {**VERIFY_DATA, "amount": 40.0}
        response = client.post("/api/v1/cards/pay", json=payment)
        assert response.status_code == 200
        assert Decimal(str(response.json()["balance"])) == Decimal("60.0")

    def test_payment_insufficient_funds(self, client):
        """A payment exceeding the balance returns 402."""
        register_card(client)
        payment = {**VERIFY_DATA, "amount": 999.0}
        response = client.post("/api/v1/cards/pay", json=payment)
        assert response.status_code == 402
        assert "Insufficient funds" in response.json()["detail"]

    def test_payment_invalid_card(self, client):
        """Paying with incorrect card details returns 401."""
        register_card(client)
        payment = {**VERIFY_DATA, "cvc": "999", "amount": 10.0}
        response = client.post("/api/v1/cards/pay", json=payment)
        assert response.status_code == 401


# ──────────────────────────────────────────────
# Tests: Balance top-up
# ──────────────────────────────────────────────

class TestTopUp:
    def test_topup_success(self, client):
        """Topping up the balance increments it correctly."""
        register_card(client)
        topup = {**VERIFY_DATA, "amount": 50.0}
        response = client.post("/api/v1/cards/topup", json=topup)
        assert response.status_code == 200
        assert Decimal(str(response.json()["balance"])) == Decimal("150.0")

    def test_topup_invalid_card(self, client):
        """Topping up with incorrect details returns 401."""
        register_card(client)
        topup = {**VERIFY_DATA, "cvc": "999", "amount": 50.0}
        response = client.post("/api/v1/cards/topup", json=topup)
        assert response.status_code == 401


# ──────────────────────────────────────────────
# Tests: Card details retrieval
# ──────────────────────────────────────────────

class TestGetCardDetails:
    def test_get_existing_card(self, client):
        """Querying a registered card returns its data."""
        register_card(client)
        response = client.get("/api/v1/cards/1234567812345678")
        assert response.status_code == 200

        data = response.json()
        assert data["cardholder_name"] == "John Doe"
        assert Decimal(str(data["balance"])) == Decimal("100.0")

    def test_get_nonexistent_card(self, client):
        """Querying a nonexistent card returns 404."""
        response = client.get("/api/v1/cards/0000000000000000")
        assert response.status_code == 404


# ──────────────────────────────────────────────
# Tests: Full integration flow
# ──────────────────────────────────────────────

class TestIntegrationFlow:
    def test_full_payment_flow(self, client):
        """Full flow: register -> verify -> pay -> top up -> query."""
        # 1. Register card
        res = register_card(client)
        assert res.status_code == 200
        assert Decimal(str(res.json()["balance"])) == Decimal("100.0")

        # 2. Verify card
        res = client.post("/api/v1/cards/verify", json=VERIFY_DATA)
        assert res.status_code == 200

        # 3. Pay $40
        res = client.post("/api/v1/cards/pay", json={**VERIFY_DATA, "amount": 40.0})
        assert res.status_code == 200
        assert Decimal(str(res.json()["balance"])) == Decimal("60.0")

        # 4. Top up $20
        res = client.post("/api/v1/cards/topup", json={**VERIFY_DATA, "amount": 20.0})
        assert res.status_code == 200
        assert Decimal(str(res.json()["balance"])) == Decimal("80.0")

        # 5. Query final balance
        res = client.get("/api/v1/cards/1234567812345678")
        assert res.status_code == 200
        assert Decimal(str(res.json()["balance"])) == Decimal("80.0")
