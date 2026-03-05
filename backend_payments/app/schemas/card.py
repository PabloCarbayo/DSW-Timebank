from pydantic import BaseModel, ConfigDict, Field

class CardBase(BaseModel):
    cardholder_name: str
    card_number: str
    expiration_date: str = Field(..., pattern=r"^(0[1-9]|1[0-2])\/\d{2}$")
    cvc: str = Field(..., min_length=3, max_length=4)

class CardCreate(CardBase):
    initial_balance: float = 0.0

class CardResponse(CardBase):
    id: int
    balance: float

    model_config = ConfigDict(from_attributes=True)

class CardVerify(BaseModel):
    card_number: str
    expiration_date: str
    cvc: str

class PaymentRequest(BaseModel):
    card_number: str
    expiration_date: str
    cvc: str
    amount: float = Field(..., gt=0)

class TopUpRequest(BaseModel):
    card_number: str
    expiration_date: str
    cvc: str
    amount: float = Field(..., gt=0)
