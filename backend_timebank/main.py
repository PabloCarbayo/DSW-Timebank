from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.database as db_module
from app.controllers import auth_controller, user_controller


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    db_module.Base.metadata.create_all(bind=db_module.engine)
    yield


app = FastAPI(
    title="Time Bank API",
    description="Backend principal de Time Bank — Gestión de usuarios y servicios",
    version="1.0.0",
    lifespan=lifespan,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ajustar en produccion
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir Rutas
app.include_router(auth_controller.router)
app.include_router(user_controller.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Time Bank API"}
