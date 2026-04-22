import os

from sqlalchemy.orm import Session

from app.auth.password import hash_password
from app.models.user import User


def _truthy(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_default_users() -> list[dict[str, str]]:
    return [
        {
            "email": os.getenv("DEFAULT_ADMIN_EMAIL", "admin@timebank.com").strip().lower(),
            "password": os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123"),
            "first_name": os.getenv("DEFAULT_ADMIN_FIRST_NAME", "Default"),
            "last_name": os.getenv("DEFAULT_ADMIN_LAST_NAME", "Admin"),
            "role": "admin",
        },
        {
            "email": os.getenv("DEFAULT_USER_EMAIL", "user@timebank.com").strip().lower(),
            "password": os.getenv("DEFAULT_USER_PASSWORD", "user123"),
            "first_name": os.getenv("DEFAULT_USER_FIRST_NAME", "Default"),
            "last_name": os.getenv("DEFAULT_USER_LAST_NAME", "User"),
            "role": "user",
        },
    ]


def seed_default_users(db: Session) -> list[str]:
    """Create default admin/user accounts if missing. Returns created emails."""
    if not _truthy(os.getenv("SEED_DEFAULT_USERS", "true")):
        return []

    created_emails: list[str] = []

    for user_data in _get_default_users():
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            continue

        db.add(
            User(
                email=user_data["email"],
                hashed_password=hash_password(user_data["password"]),
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                role=user_data["role"],
                is_active=True,
                balance=0.0,
            )
        )
        created_emails.append(user_data["email"])

    if created_emails:
        db.commit()

    return created_emails
