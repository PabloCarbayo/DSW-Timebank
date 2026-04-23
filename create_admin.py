import asyncio
from backend_timebank.app.database import AsyncSessionLocal
from backend_timebank.app.models.user import User
from backend_timebank.app.auth.password import get_password_hash

async def create_admin():
    async with AsyncSessionLocal() as session:
        admin = User(
            email="admin@timebank.com",
            hashed_password=get_password_hash("admin123"),
            first_name="Super",
            last_name="Admin",
            role="admin",
            is_active=True,
            balance=0.0
        )
        session.add(admin)
        await session.commit()
        print("Admin user created: admin@timebank.com / admin123")

asyncio.run(create_admin())
