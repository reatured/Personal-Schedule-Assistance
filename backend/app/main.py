from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import engine, Base
from .routers import auth_router, schedule_router
from .core.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Schedule Builder API",
    description="A FastAPI backend for the Personal Schedule Builder application",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(schedule_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Schedule Builder API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"} 