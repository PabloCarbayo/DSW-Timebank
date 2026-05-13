"""
Pytest configuration: sets the test database URL
BEFORE the application is imported.
"""
import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
os.environ.setdefault("SEED_DEFAULT_USERS", "true")
os.environ.setdefault("DEFAULT_ADMIN_EMAIL", "admin@timebank.com")
os.environ.setdefault("DEFAULT_ADMIN_PASSWORD", "admin123")
os.environ.setdefault("DEFAULT_ADMIN_FIRST_NAME", "Default")
os.environ.setdefault("DEFAULT_ADMIN_LAST_NAME", "Admin")
os.environ.setdefault("DEFAULT_USER_EMAIL", "user@timebank.com")
os.environ.setdefault("DEFAULT_USER_PASSWORD", "user123")
os.environ.setdefault("DEFAULT_USER_FIRST_NAME", "Default")
os.environ.setdefault("DEFAULT_USER_LAST_NAME", "User")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")
