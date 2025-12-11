from fastapi import APIRouter
from app.api import auth, profile, documents, scholarships, applications, admin_routes, university, health

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(scholarships.router, prefix="/scholarships", tags=["scholarships"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(admin_routes.router, prefix="/admin", tags=["admin"])
api_router.include_router(university.router, prefix="/university", tags=["university"])
api_router.include_router(health.router, tags=["health"])
