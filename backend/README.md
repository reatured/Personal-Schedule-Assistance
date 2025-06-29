# Schedule Builder Backend

A FastAPI backend for the Personal Schedule Builder application with JWT authentication and PostgreSQL database.

## Features

- 🔐 JWT Authentication (register, login, user management)
- 📅 Schedule CRUD operations
- 🗄️ PostgreSQL database with SQLAlchemy ORM
- 🔄 Database migrations with Alembic
- 🌐 CORS support for frontend integration
- 📝 Automatic API documentation

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your database and JWT settings:

```env
DATABASE_URL=postgresql://user:password@localhost/schedule_db
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=["http://localhost:3000"]
```

### 3. Database Setup

Create a PostgreSQL database and update the `DATABASE_URL` in your `.env` file.

### 4. Run Migrations

```bash
alembic upgrade head
```

### 5. Start the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:

- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

### Schedules
- `GET /schedules/` - Get all user schedules
- `GET /schedules/default` - Get default schedule
- `POST /schedules/` - Create new schedule
- `PUT /schedules/{id}` - Update schedule
- `DELETE /schedules/{id}` - Delete schedule

## Development

### Running Tests

```bash
# Add pytest to requirements.txt first
pytest
```

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Deployment

### Railway/Render

1. Connect your repository
2. Set environment variables
3. Deploy

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Project Structure

```
backend/
├── app/
│   ├── core/           # Core configuration and utilities
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   ├── routers/        # API route handlers
│   ├── dependencies.py # Dependency injection
│   └── main.py         # FastAPI application
├── alembic/            # Database migrations
├── requirements.txt    # Python dependencies
└── README.md          # This file
``` 