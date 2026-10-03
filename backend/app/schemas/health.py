from pydantic import BaseModel, Field
from datetime import datetime, timezone


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Current service health status")
    project: str = Field(default="UpayAche", description="Project name")
    version: str = Field(default="1.0.0", description="API version")
    environment: str = Field(default="development", description="Active environment")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the health check"
    )
