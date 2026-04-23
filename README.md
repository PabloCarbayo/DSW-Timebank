# User Guide - Time Bank (Sprint 1)

Welcome to **Time Bank**, the peer-to-peer service exchange platform where your time is the currency. Throughout this guide, you will learn how to set up the development environment and take your first steps using the application.

---

## 1. Prerequisites

Depending on the execution method you choose, you will need to have the following installed on your machine:

- **For Docker execution (Recommended):**
  - [Docker](https://docs.docker.com/get-docker/) and Docker Compose.
- **For Local execution (Manual):**
  - MySQL or MariaDB server.
  - Python 3.10+ (for the backends).
  - Node.js 18+ and npm/yarn (for the frontend).

---

## 2. System Setup

The project consists of several components that must be running simultaneously: a database, two Backend servers (*Timebank* and *Payments*), and a Frontend server. You have two options to get the application up and running.

### Option A: Execution via Docker (Recommended)
The system is fully containerized to facilitate deployment and avoid compatibility issues.

1. Open your terminal and navigate to the root directory of the project (`DSW-Timebank`).
2. Start all services by running the following command:
   ```bash
   docker compose up --build
   ```
   *(Add the `-d` flag at the end if you prefer it to run in the background: `docker compose up --build -d`)*
3. Wait a moment for the images to build and the database to initialize. You will be able to see in the terminal how all services start receiving connections.
4. Once ready, go to your browser and access: **[http://localhost:5173](http://localhost:5173)** to see the web application.

### Option B: Local Execution on your machine (Without Docker)
If you prefer to run the services individually, follow these steps:

**Step 1: Database**
Make sure you have a MySQL server running on port `3306`. You must manually create two empty databases: one named `timebank` and another `payments`.

**Step 2: Timebank Backend**
1. Open a new terminal, navigate to `DSW-Timebank/backend_timebank`.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install the dependencies: `pip install -r requirements.txt`
4. Run the server: `fastapi run app/main.py --port 8000` *(or use `uvicorn main:app`)*

**Step 3: Payments Backend**
1. Open another terminal, navigate to `DSW-Timebank/backend_payments`.
2. Follow the same process as in step 2 (create environment, activate, and install `requirements.txt`).
3. Run the server on port `8001`: `fastapi run app/main.py --port 8001`

**Step 4: Frontend (React)**
1. In another terminal, navigate to `DSW-Timebank/frontend`.
2. Install the Node dependencies: `npm install`
3. Start the development environment: `npm run dev`
4. Access **[http://localhost:5173](http://localhost:5173)**.

---

## 3. Application User Guide (Sprint 1 Features)

Once you have the application running in your browser ([http://localhost:5173](http://localhost:5173)), you'll be ready to interact with the platform. These are the functionalities covered in Sprint 1:

### 3.1. Accessing the platform (Home)
Upon loading the page, you will see the **Time Bank** Landing Page. You will have the option to **Log in** or **Sign up** from the top navigation menu.

### 3.2. How to register a new account
1. Click on the **Sign Up** button.
2. Fill out the form with your details:
   - Your **Username**.
   - Your **Email address**.
   - A secure **Password**.
3. Upon submitting the form, if the details are correct, the platform will register the user and automatically authorize you, redirecting you to the main Dashboard.

### 3.3. Logging In (Login)
1. If you already have an account, go to the **Login** button.
2. Enter your **Email address** and **Password**.
3. Once validated, the system will provide you with an access token and direct you to your **Main Dashboard** securely.

### 3.4. Main Panel (Dashboard)
The heart of your account. After logging in, you will see a top navigation panel with your options:
- Here you will find general information about your account.
- You will be able to check your upcoming services and balance history (features planned for upcoming Sprints).
- If you are an **Administrator**, your account will have extended internal permissions.

### 3.5. Logging Out (Logout)
It is important to always log out securely:
1. Click on the **Logout** button or your user menu.
2. The platform will clear your session and redirect you to the home page so no one else can manipulate your data.

---

## 4. Access to Technical Utilities and Documentation

For developers and delivery validation, with the system (Docker) running, you have access to useful tools:

- **Database Manager (phpMyAdmin):** Access [http://localhost:8081](http://localhost:8081) with the user `root` and the password `root` to take a direct look at your database tables and verify that users are registering correctly.
- **API Documentation (Swagger UI):**
  - **Main Backend:** Explore and test all endpoints at [http://localhost:8000/docs](http://localhost:8000/docs).
  - **Payments Backend:** Documentation at [http://localhost:8001/docs](http://localhost:8001/docs).
