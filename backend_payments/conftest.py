"""
Pytest configuration: sets the test database URL
BEFORE the application is imported.
"""
import os

os.environ["DATABASE_URL"] = "sqlite://"
