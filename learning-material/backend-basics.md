# Backend Basics: Beginner Learning Material

## 🟢 What Is "The Backend"?

The backend is the part of your application that:
- Runs on a server (not in your browser)
- Handles data storage, user authentication, and business logic
- Provides APIs (endpoints) that the frontend (user interface) can call to get or change data

---

## 🗂️ What's in Your Backend Folder?

Your backend is in the `backend/` directory. Here's what the main parts do:

### 1. **FastAPI**
- A modern Python framework for building APIs (ways for computers to talk to each other).
- Lets you define "routes" (URLs) that do things like register users, create schedules, etc.

### 2. **PostgreSQL**
- A powerful, open-source database.
- Stores your data (users, schedules, etc.) in tables, like a spreadsheet.

### 3. **SQLAlchemy**
- A Python library that helps you talk to your database using Python code instead of raw SQL.
- Lets you define "models" (Python classes) that represent tables in your database.

### 4. **Alembic**
- A tool for managing changes to your database structure (like adding new tables or columns) over time.
- Keeps your database in sync with your code.

---

## 🏗️ Key Files and Folders

- `main.py`: The entry point for your FastAPI app. It sets up the API and includes all the routes.
- `models/`: Python files that define what your data looks like (e.g., User, Schedule).
- `schemas/`: Define the shape of data going in and out of your API (for validation and documentation).
- `routers/`: Organize your API endpoints by topic (e.g., authentication, schedules).
- `core/`: Configuration, database connection, and security utilities.
- `alembic.ini` and `alembic/`: Alembic's configuration and migration scripts.
- `requirements.txt`: Lists all the Python packages your backend needs.

---

## 🧩 How Does It All Work Together?

1. **User does something in the frontend** (e.g., clicks "register")
2. **Frontend sends a request** to the backend API (e.g., POST /register)
3. **FastAPI receives the request** and runs the right function (route handler)
4. **If data needs to be saved or fetched**, FastAPI uses SQLAlchemy to talk to PostgreSQL
5. **Response is sent back** to the frontend (e.g., "User created!")

---

## 📝 In Summary

- Your backend is a Python FastAPI app that provides APIs for your frontend.
- It uses PostgreSQL to store data, SQLAlchemy to manage data in Python, and Alembic to keep the database structure up-to-date.
- The backend is responsible for all the "behind the scenes" work: storing data, checking passwords, etc.

---

If you want to see a simple example of how a route works, or want to know more about any part (like "What is a model?" or "How does authentication work?"), just ask! 