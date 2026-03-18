# Guía de Usuario - Time Bank (Sprint 1)

Bienvenido a **Time Bank**, la plataforma de intercambio de servicios entre particulares donde tu tiempo es la moneda de cambio. A lo largo de esta guía aprenderás cómo levantar el entorno de desarrollo y cómo dar tus primeros pasos utilizando la aplicación.

---

## 1. Requisitos Previos

Dependiendo del método de ejecución que elijas, necesitarás tener instalado lo siguiente en tu máquina:

- **Para ejecución con Docker (Recomendado):**
  - [Docker](https://docs.docker.com/get-docker/) y Docker Compose.
- **Para ejecución Local (Manual):**
  - Servidor MySQL o MariaDB.
  - Python 3.10+ (para los backends).
  - Node.js 18+ y npm/yarn (para el frontend).

---

## 2. Puesta en marcha del sistema

El proyecto consta de varios componentes que deben estar en funcionamiento de forma simultánea: una base de datos, dos servidores Backend (*Timebank* y *Pagos*) y un servidor Frontend. Tienes dos opciones para poner la aplicación en marcha.

### Opción A: Ejecución mediante Docker (Recomendada)
El sistema está completamente contenedorizado para facilitar su despliegue y evitar problemas de compatibilidad.

1. Abre tu terminal y navega hasta el directorio raíz del proyecto (`DSW-Timebank`).
2. Levanta todos los servicios ejecutando el siguiente comando:
   ```bash
   docker compose up --build
   ```
   *(Añade el flag `-d` al final si prefieres que se ejecute en segundo plano: `docker compose up --build -d`)*
3. Espera un momento a que las imágenes se construyan y la base de datos se inicialice. Podrás ver en la terminal cómo todos los servicios comienzan a recibir conexiones.
4. Una vez listos, accede a tu navegador y entra en: **[http://localhost:5173](http://localhost:5173)** para ver la aplicación web.

### Opción B: Ejecución Local en tu máquina (Sin Docker)
Si prefieres levantar los servicios individualmente, sigue estos pasos:

**Paso 1: Base de Datos**
Asegúrate de tener un servidor MySQL corriendo en el puerto `3306`. Debes crear manualmente dos bases de datos vacías: una llamada `timebank` y otra `payments`.

**Paso 2: Backend Timebank**
1. Abre una nueva terminal, navega a `DSW-Timebank/backend_timebank`.
2. Crea un entorno virtual y actívalo:
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows usa: venv\Scripts\activate
   ```
3. Instala las dependencias: `pip install -r requirements.txt`
4. Ejecuta el servidor: `fastapi run app/main.py --port 8000` *(o usa `uvicorn main:app`)*

**Paso 3: Backend Payments**
1. Abre otra terminal, navega a `DSW-Timebank/backend_payments`.
2. Sigue el mismo proceso que en el paso 2 (crea entorno, activa e instala `requirements.txt`).
3. Ejecuta el servidor en el puerto `8001`: `fastapi run app/main.py --port 8001`

**Paso 4: Frontend (React)**
1. En otra terminal, navega a `DSW-Timebank/frontend`.
2. Instala las dependencias de Node: `npm install`
3. Arranca el entorno de desarrollo: `npm run dev`
4. Accede a **[http://localhost:5173](http://localhost:5173)**.

---

## 3. Guía de Uso de la Aplicación (Funcionalidades del Sprint 1)

Una vez que tengas la aplicación funcionando en tu navegador ([http://localhost:5173](http://localhost:5173)), estarás listo para interactuar con la plataforma. Estas son las funcionalidades cubiertas en el Sprint 1:

### 3.1. Acceder a la plataforma (Home)
Al cargar la página, verás un diseño de aterrizaje ("Landing Page") de **Time Bank**. Tendrás la opción de **Iniciar Sesión (Login)** o **Registrarte (Sign up)** desde el menú de navegación superior.

### 3.2. Cómo registrar una nueva cuenta
1. Haz clic en el botón **Sign Up** o **Registrarse**.
2. Rellena el formulario con tus datos:
   - Tu **Nombre de usuario**.
   - Tu **Correo electrónico**.
   - Una **Contraseña segura**.
3. Al enviar el formulario, si los datos son correctos la plataforma registrará el usuario y automáticamente te autorizará redirigiéndote al Dashboard principal.

### 3.3. Iniciar Sesión (Login)
1. Si ya tienes cuenta, dirígete al botón **Login**.
2. Introduce tu **Correo electrónico** y **Contraseña**.
3. Al validarse, el sistema te proporcionará un token de acceso y te dirigirá a tu **Panel Principal (Dashboard)** de forma segura.

### 3.4. Panel Principal (Dashboard)
El corazón de tu cuenta. Tras iniciar sesión, verás un panel de navegación superior con tus opciones:
- Aquí hallarás información general sobre tu cuenta.
- Podrás comprobar tus próximos servicios e historial de tu saldo (funcionalidades planeadas para los siguientes Sprints).
- En caso de ser **Administrador**, tu cuenta tendrá permisos ampliados de forma interna.

### 3.5. Cerrar Sesión (Logout)
Es importante salir siempre de forma segura:
1. Haz clic sobre el botón de **Logout** o tu menú de usuario.
2. La plataforma limpiará tu sesión y te redirigirá a la página de inicio para que nadie más pueda manipular tus datos.

---

## 4. Accesos a Utilidades Técnicas y Documentación

Para desarrolladores y validación de entregas, con el sistema (Docker) en marcha tienes acceso a herramientas útiles:

- **Gestor de Base de Datos (phpMyAdmin):** Accede a [http://localhost:8081](http://localhost:8081) con el usuario `root` y la contraseña `root` para echar un vistazo directo a las tablas de tu base de datos y comprobar que los usuarios se registran correctamente.
- **Documentación de la API (Swagger UI):**
  - **Backend Main:** Explora y prueba todos los endpoints en [http://localhost:8000/docs](http://localhost:8000/docs).
  - **Backend Pagos:** Documentación en [http://localhost:8001/docs](http://localhost:8001/docs).
