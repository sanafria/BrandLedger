"""System, Health, and Role Schemas."""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """Explicit RBAC roles."""
    CREATOR = "creator"
    REVIEWER = "reviewer"
    ADMIN = "admin"
    GUEST = "guest"


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(default="ok", description="Application health status")
    environment: str = Field(default="development", description="Current running environment")
    service: str = Field(default="brandledger-api", description="Service identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Server UTC time")
