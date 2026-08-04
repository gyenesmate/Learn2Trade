from fastapi import FastAPI

from app.api.routes import health

app = FastAPI(title="Learn2Trade API")
app.include_router(health.router)
