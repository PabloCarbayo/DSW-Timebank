from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.controllers import card_controller

# Inicializar Base de Datos (crea las tablas)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Simple Payment Gateway API",
    description="Backend de pasarela de pagos simulada para Time Bank",
    version="1.0.0"
)

# Configurar CORS si fuera necesario
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ajustar en produccion
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir Rutas
app.include_router(card_controller.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Simple Payment Gateway API"}
