from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.database as db_module
from app.controllers import card_controller


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    db_module.Base.metadata.create_all(bind=db_module.engine)
    yield


app = FastAPI(
    title="Simple Payment Gateway API",
    description="Simulated payment gateway backend for Time Bank",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(card_controller.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Simple Payment Gateway API"}
