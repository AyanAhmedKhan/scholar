from pydantic_settings import BaseSettings
from pydantic import SecretStr, field_validator
from typing import List, Union
import os

class Settings(BaseSettings):
    # Project Settings
    PROJECT_NAME: str = "Unified Scholarship Portal"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_CHANGE_THIS_IN_PROD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = "mysql+mysqlconnector://root:password@localhost:3306/scholarship_db"

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    
    # Media
    MEDIA_DIR: str = "media"

    # Email Configuration (SMTP)
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "Scholarship Portal"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4255",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4255",
        "http://localhost:5001",
        "http://127.0.0.1:5001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            # If it comes as a string representation of list (e.g. from .env sometimes)
            # This is a naive check, might just rely on the above split for simple CSV
             return [i.strip() for i in v.strip("[]").split(",")]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
