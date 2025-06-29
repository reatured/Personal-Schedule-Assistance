# Deployment Guide

This guide will help you deploy the Personal Schedule Builder application to production.

## 🚀 Quick Start

### 1. Backend Deployment (Railway/Render)

#### Option A: Railway (Recommended)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   # Fork/clone the repository
   git clone <your-repo-url>
   cd Personal-Schedule-Assistance
   
   # Railway will auto-detect Python project
   # Just connect your GitHub repository
   ```

3. **Configure Environment Variables**
   - Go to your Railway project dashboard
   - Add the following environment variables:
   ```
   DATABASE_URL=postgresql://... (Railway will provide this)
   SECRET_KEY=your-super-secret-key-here
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ALLOWED_ORIGINS=["https://your-frontend-domain.vercel.app"]
   ```

4. **Set up PostgreSQL**
   - Railway will automatically provision a PostgreSQL database
   - The `DATABASE_URL` will be provided automatically

5. **Deploy**
   - Railway will automatically deploy when you push to main branch
   - Get your API URL from the Railway dashboard

#### Option B: Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Connect your GitHub repository
   - Set build command: `pip install -r backend/requirements.txt`
   - Set start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Configure Environment Variables**
   ```
   DATABASE_URL=postgresql://... (Render will provide this)
   SECRET_KEY=your-super-secret-key-here
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ALLOWED_ORIGINS=["https://your-frontend-domain.vercel.app"]
   ```

4. **Set up PostgreSQL**
   - Create a new PostgreSQL service in Render
   - Link it to your web service

### 2. Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```

4. **Deploy**
   - Vercel will automatically deploy
   - Your app will be available at `https://your-project.vercel.app`

## 🔧 Advanced Configuration

### Database Migrations

If you need to run migrations manually:

```bash
# For Railway
railway run alembic upgrade head

# For Render
# Add to build command: cd backend && alembic upgrade head
```

### Custom Domains

1. **Backend**: Configure custom domain in Railway/Render dashboard
2. **Frontend**: Configure custom domain in Vercel dashboard
3. **Update CORS**: Update `ALLOWED_ORIGINS` in backend environment variables

### SSL/HTTPS

- **Railway/Render**: Automatic SSL certificates
- **Vercel**: Automatic SSL certificates

## 🐳 Docker Deployment

### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

Create `Dockerfile` in root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

## 🔒 Security Considerations

### Environment Variables

- **Never commit secrets** to version control
- Use environment variables for all sensitive data
- Rotate secrets regularly

### JWT Configuration

```python
# Generate a secure secret key
import secrets
print(secrets.token_urlsafe(32))
```

### CORS Configuration

```python
ALLOWED_ORIGINS = [
    "https://your-frontend-domain.vercel.app",
    "http://localhost:3000"  # For development
]
```

### Database Security

- Use connection pooling
- Enable SSL for database connections
- Regular backups
- Monitor database performance

## 📊 Monitoring & Logging

### Backend Monitoring

1. **Railway**: Built-in monitoring dashboard
2. **Render**: Built-in monitoring and logs
3. **Custom**: Add logging middleware to FastAPI

### Frontend Monitoring

1. **Vercel Analytics**: Built-in performance monitoring
2. **Sentry**: Error tracking and performance monitoring

### Health Checks

The backend includes a health check endpoint:
```
GET /health
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railway/deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `ALLOWED_ORIGINS` configuration
   - Ensure frontend URL is included

2. **Database Connection Issues**
   - Verify `DATABASE_URL` format
   - Check database is running and accessible

3. **Authentication Issues**
   - Verify `SECRET_KEY` is set
   - Check JWT token expiration

4. **Build Failures**
   - Check Python/Node.js versions
   - Verify all dependencies are installed

### Debug Commands

```bash
# Check backend logs
railway logs

# Check frontend build
vercel logs

# Test API endpoints
curl https://your-api-url/health
```

## 📈 Performance Optimization

### Backend

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_schedules_user_id ON schedules(user_id);
   CREATE INDEX idx_schedules_created_at ON schedules(created_at);
   ```

2. **Connection Pooling**
   ```python
   # In database.py
   engine = create_engine(
       settings.DATABASE_URL,
       pool_size=20,
       max_overflow=0
   )
   ```

3. **Caching**
   - Add Redis for session storage
   - Implement response caching

### Frontend

1. **Code Splitting**
   - Next.js automatic code splitting
   - Lazy load components

2. **Image Optimization**
   - Use Next.js Image component
   - Optimize bundle size

3. **CDN**
   - Vercel Edge Network
   - Static asset optimization

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates active
- [ ] CORS properly configured
- [ ] Health checks passing
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Performance optimized
- [ ] Security audit completed
- [ ] Backup strategy implemented

---

**Need help?** Check the [Issues](https://github.com/yourusername/personal-schedule-builder/issues) page or create a new issue. 