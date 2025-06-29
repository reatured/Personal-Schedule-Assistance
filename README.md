# Personal Schedule Builder

A full-stack web application for building and managing personal schedules with drag-and-drop functionality.

## 🚀 Features

- **Drag & Drop Interface**: Intuitive project and task management
- **Real-time Updates**: Instant visual feedback for all changes
- **User Authentication**: Secure JWT-based authentication system
- **Cloud Storage**: Save and sync schedules across devices
- **Local Storage Fallback**: Works offline with local data persistence
- **Responsive Design**: Works on desktop and mobile devices
- **Print Support**: Export schedules to PDF/print format

## 🏗️ Architecture

### Frontend (Next.js 15 + TypeScript)
- **Framework**: Next.js 15 with App Router
- **UI Library**: Radix UI components with Tailwind CSS
- **Drag & Drop**: @dnd-kit for smooth interactions
- **State Management**: React hooks with context
- **Form Handling**: React Hook Form with Zod validation

### Backend (FastAPI + PostgreSQL)
- **Framework**: FastAPI with automatic API documentation
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Migrations**: Alembic for database schema management
- **CORS**: Configured for frontend integration

## 📁 Project Structure

```
Personal-Schedule-Assistance/
├── app/                    # Next.js frontend
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/             # React components
│   ├── auth/
│   ├── schedule-builder/
│   ├── ui/
│   └── theme-provider.tsx
├── lib/                    # Frontend utilities
│   ├── api-client.ts       # API client for backend
│   ├── auth-context.tsx    # Authentication context
│   ├── schedule-api.ts     # Schedule API operations
│   └── utils.ts
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── core/           # Configuration & utilities
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── routers/        # API endpoints
│   │   └── main.py
│   ├── requirements.txt
│   └── README.md
├── types/                  # TypeScript type definitions
└── README.md
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.11+ and pip
- PostgreSQL database

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.local.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env with your database and JWT settings

# Set up database
# Create PostgreSQL database and update DATABASE_URL in .env

# Run migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Environment Variables

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend (.env):**
```env
DATABASE_URL=postgresql://user:password@localhost/schedule_db
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=["http://localhost:3000"]
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Backend (Railway/Render)
1. Connect your repository
2. Set environment variables
3. Deploy and get the API URL
4. Update frontend `NEXT_PUBLIC_API_URL`

## 📚 API Documentation

Once the backend is running, visit:
- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc

### Key Endpoints

**Authentication:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

**Schedules:**
- `GET /schedules/` - Get all user schedules
- `GET /schedules/default` - Get default schedule
- `POST /schedules/` - Create new schedule
- `PUT /schedules/{id}` - Update schedule
- `DELETE /schedules/{id}` - Delete schedule

## 🎯 Usage

1. **Register/Login**: Create an account or sign in
2. **Create Projects**: Add projects with sub-tasks
3. **Drag & Drop**: Drag projects to time slots to schedule them
4. **Manage Tasks**: Edit, complete, or remove tasks
5. **Save & Sync**: Your schedule is automatically saved to the cloud
6. **Print**: Export your schedule for offline use

## 🔧 Development

### Running Tests
```bash
# Frontend
npm run lint

# Backend
pytest
```

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:
1. Check the [Issues](https://github.com/yourusername/personal-schedule-builder/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem

---

**Built with ❤️ using Next.js, FastAPI, and PostgreSQL**
