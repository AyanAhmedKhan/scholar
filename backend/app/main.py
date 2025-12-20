from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router
# from app.db.database import engine, Base

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.core.middleware import LoggingMiddleware
app.add_middleware(LoggingMiddleware)

from app.core.exceptions import add_exception_handlers
add_exception_handlers(app)

# Static Files for Media
import os
if not os.path.exists(settings.MEDIA_DIR):
    os.makedirs(settings.MEDIA_DIR)
app.mount("/media", StaticFiles(directory=settings.MEDIA_DIR), name="media")

@app.get("/")
def root():
    return {"message": "Welcome to Unified Scholarship Portal API"}

app.include_router(api_router, prefix=settings.API_V1_STR)

from app.db.database import engine
from app.admin.views import setup_admin

setup_admin(app, engine)