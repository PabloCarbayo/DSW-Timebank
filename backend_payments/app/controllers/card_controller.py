from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.card import CardCreate, CardResponse, CardVerify, PaymentRequest, TopUpRequest
from app.services.card_service import CardService

router = APIRouter(prefix="/api/v1/cards", tags=["Cards"])

def get_card_service(db: Session = Depends(get_db)) -> CardService:
    return CardService(db)

@router.post("/", response_model=CardResponse)
def register_card(
    card_in: CardCreate, 
    service: CardService = Depends(get_card_service)
):
    """
    Registrar una nueva tarjeta con un saldo inicial.
    """
    return service.register_card(card_in)

@router.post("/verify")
def verify_card(
    verify_in: CardVerify, 
    service: CardService = Depends(get_card_service)
):
    """
    Verificar que los datos de una tarjeta son correctos.
    """
    is_valid = service.verify_card(verify_in)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid card details")
    return {"status": "valid"}

@router.post("/pay", response_model=CardResponse)
def process_payment(
    payment_in: PaymentRequest, 
    service: CardService = Depends(get_card_service)
):
    """
    Autorizar y procesar un pago con la tarjeta.
    """
    return service.process_payment(payment_in)

@router.post("/topup", response_model=CardResponse)
def top_up_balance(
    top_up_in: TopUpRequest, 
    service: CardService = Depends(get_card_service)
):
    """
    Recargar saldo en la tarjeta.
    """
    return service.top_up_balance(top_up_in)

@router.get("/{card_number}", response_model=CardResponse)
def get_card_details(
    card_number: str,
    service: CardService = Depends(get_card_service)
):
    """
    Obtener detalles de la tarjeta incluyendo el saldo actual.
    """
    return service.get_card(card_number)
