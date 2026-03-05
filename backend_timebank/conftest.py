"""
Configuración de pytest: establece la base de datos de test
ANTES de que se importe la aplicación.
"""
import os

os.environ["DATABASE_URL"] = "sqlite://"
