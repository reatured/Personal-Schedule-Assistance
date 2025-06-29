# Next Steps - Getting Started

## 🚀 Immediate Action Items (Today)

### 1. Set Up Local Development Environment

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp env.example .env
```

#### Frontend Setup
```bash
# Install dependencies (if not already done)
npm install

# Create .env.local file
cp env.local.example .env.local
```

### 2. Configure Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost/schedule_db
SECRET_KEY=your-super-secret-key-here-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=["http://localhost:3000"]
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb schedule_db

# Update DATABASE_URL in backend/.env
DATABASE_URL=postgresql://your_username@localhost/schedule_db
```

#### Option B: Docker PostgreSQL
```bash
# Run PostgreSQL in Docker
docker run --name schedule-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=schedule_db \
  -p 5432:5432 \
  -d postgres:15

# Update DATABASE_URL in backend/.env
DATABASE_URL=postgresql://postgres:password@localhost:5432/schedule_db
```

#### Option C: Cloud Database (Recommended for Production)
- **Railway**: Automatically provides PostgreSQL
- **Supabase**: Free PostgreSQL database
- **Neon**: Serverless PostgreSQL

### 4. Run Database Migrations

```bash
cd backend

# Initialize Alembic (first time only)
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 5. Start Development Servers

#### Backend
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
# In another terminal
npm run dev
```

### 6. Test the Application

1. **Open Frontend**: http://localhost:3000
2. **Check Backend**: http://localhost:8000/docs
3. **Register a new user**
4. **Create a schedule**
5. **Test drag and drop functionality**

## 🎯 Week 1 Goals

### Day 1-2: Local Development
- [ ] Complete local setup
- [ ] Test all functionality
- [ ] Fix any issues
- [ ] Document any problems

### Day 3-4: Database Setup
- [ ] Choose production database provider
- [ ] Set up cloud database
- [ ] Test database connection
- [ ] Run migrations

### Day 5-7: Backend Deployment
- [ ] Deploy to Railway/Render
- [ ] Configure environment variables
- [ ] Test production API
- [ ] Update frontend API URL

## 🚀 Week 2 Goals

### Day 8-10: Frontend Deployment
- [ ] Deploy to Vercel
- [ ] Configure environment variables
- [ ] Test production deployment
- [ ] Set up custom domain (optional)

### Day 11-14: Testing & Optimization
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security review
- [ ] Documentation updates

## 🔧 Troubleshooting Common Issues

### Backend Issues

#### Import Errors
```bash
# Make sure you're in the backend directory
cd backend

# Check Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL

# Check if PostgreSQL is running
brew services list | grep postgresql
```

#### CORS Errors
- Check `ALLOWED_ORIGINS` in backend `.env`
- Ensure frontend URL is included
- Restart backend server after changes

### Frontend Issues

#### API Connection Errors
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure backend is running
- Check browser console for errors

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## 📚 Learning Resources

### FastAPI
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Tutorial](https://docs.sqlalchemy.org/en/14/orm/tutorial.html)
- [Alembic Migrations](https://alembic.sqlalchemy.org/en/latest/)

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [React Hooks](https://react.dev/reference/react/hooks)
- [TypeScript](https://www.typescriptlang.org/docs/)

### PostgreSQL
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Design](https://www.postgresql.org/docs/current/tutorial.html)

## 🎯 CS Fundamentals Study Plan

### Week 1: Backend Development
- **Day 1-2**: File systems, database concepts
- **Day 3-4**: API design, HTTP protocols
- **Day 5-7**: Authentication, security

### Week 2: Frontend & Deployment
- **Day 8-10**: React patterns, state management
- **Day 11-12**: Performance optimization
- **Day 13-14**: Deployment, CI/CD

### Week 3: Advanced Topics
- **Day 15-17**: Data structures, algorithms
- **Day 18-21**: System design, scalability

## 📝 Daily Checklist

### Development Setup
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Database connected
- [ ] API endpoints working
- [ ] Authentication working

### Testing
- [ ] User registration
- [ ] User login
- [ ] Schedule creation
- [ ] Schedule updates
- [ ] Schedule deletion
- [ ] Drag and drop
- [ ] Local storage fallback

### Documentation
- [ ] README updated
- [ ] API documentation accessible
- [ ] Environment variables documented
- [ ] Deployment instructions clear

## 🆘 Getting Help

### Immediate Issues
1. Check the browser console for errors
2. Check the backend logs for errors
3. Verify environment variables
4. Test API endpoints directly

### Community Resources
- [Stack Overflow](https://stackoverflow.com/)
- [GitHub Issues](https://github.com/yourusername/personal-schedule-builder/issues)
- [FastAPI Discord](https://discord.gg/VQjSZaeJkm)
- [Next.js Discord](https://discord.gg/nextjs)

### Debugging Tools
- **Backend**: FastAPI automatic docs at `/docs`
- **Frontend**: React Developer Tools
- **Database**: pgAdmin or DBeaver
- **Network**: Browser DevTools Network tab

---

**Ready to start? Let's build something amazing! 🚀** 