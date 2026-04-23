from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.database as db_module
from app.database_seed import seed_default_users
from app.controllers import (
    auth_controller,
    service_controller,
    service_request_controller,
    transaction_controller,
    user_controller,
)

# Import all models so Base.metadata.create_all creates their tables
import app.models.user  # noqa: F401
import app.models.service  # noqa: F401
import app.models.service_request  # noqa: F401
import app.models.transaction  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    db_module.Base.metadata.create_all(bind=db_module.engine)

    with db_module.SessionLocal() as db:
        created_users = seed_default_users(db)
        if created_users:
            print(f"Seeded default users: {', '.join(created_users)}")

    yield


app = FastAPI(
    title="Time Bank API",
    description="Main backend for Time Bank — User and service management",
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
app.include_router(auth_controller.router)
app.include_router(user_controller.router)
app.include_router(service_controller.router)
app.include_router(service_request_controller.router)
app.include_router(transaction_controller.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Time Bank API"}
