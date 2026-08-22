import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import init_db
from app.api.router import api_router
from app.workers.poller import start_poller, stop_poller

# Logging Setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    logger.info("Initializing Database tables...")
    await init_db()
    
    logger.info("Starting Background Polling Worker...")
    start_poller()
    
    yield
    
    logger.info("Stopping Background Polling Worker...")
    stop_poller()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """Root route redirecting to interactive API documentation."""
    return RedirectResponse(url="/docs")


@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "database": settings.DATABASE_URL.split(":")[0],
    }
