# backend/app/debug_main.py
import logging
from fastapi import FastAPI

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
log = logging.getLogger(__name__)

log.info("--- Starting GPlusApp Backend (Debug Mode) ---")

app = FastAPI(title="GPlus-Debug")

@app.get("/health")
def health_check():
    log.info("Health check endpoint was called.")
    return {"status": "ok"}

log.info("--- GPlusApp Backend (Debug Mode) Initialized ---")
