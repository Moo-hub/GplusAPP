# backend/debug_real_app_runner.py
import uvicorn
import os
import sys
import logging

# This script is for debugging the REAL main application startup process.
# It runs 'app.main:app' to see if it starts.

if __name__ == "__main__":
    # Add backend directory to Python path
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    
    # Set PYTHONPATH to include the app directory
    os.environ["PYTHONPATH"] = backend_dir

    logging.basicConfig(level=logging.INFO)
    log = logging.getLogger(__name__)

    log.info("--- Starting REAL App Runner (Debug Mode) ---")
    log.info(f"Python Path: {sys.path}")
    log.info(f"PYTHONPATH Env: {os.environ.get('PYTHONPATH')}")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8006, # Using a different port for this debug session
        reload=False,
        log_level="info"
    )
