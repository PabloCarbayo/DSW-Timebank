import os

from sqlalchemy.orm import Session

from app.auth.password import hash_password
from app.models.user import User


def _truthy(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or value == "":
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _get_default_users() -> list[dict[str, str]]:
    return [
        {
            "email": _require_env("DEFAULT_ADMIN_EMAIL").strip().lower(),
            "password": _require_env("DEFAULT_ADMIN_PASSWORD"),
            "first_name": _require_env("DEFAULT_ADMIN_FIRST_NAME"),
            "last_name": _require_env("DEFAULT_ADMIN_LAST_NAME"),
            "role": "admin",
        },
        {
            "email": _require_env("DEFAULT_USER_EMAIL").strip().lower(),
            "password": _require_env("DEFAULT_USER_PASSWORD"),
            "first_name": _require_env("DEFAULT_USER_FIRST_NAME"),
            "last_name": _require_env("DEFAULT_USER_LAST_NAME"),
            "role": "user",
        },
    ]


def seed_default_users(db: Session) -> list[str]:
    """Create default admin/user accounts if missing. Returns created emails."""
    seed_default_users_value = _require_env("SEED_DEFAULT_USERS")
    if not _truthy(seed_default_users_value):
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
