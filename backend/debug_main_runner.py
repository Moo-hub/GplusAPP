# backend/debug_main_runner.py
import uvicorn
import os
import sys
import logging

# This script is for debugging the main application startup process.
# It runs the simplified 'app.debug_main:app'

if __name__ == "__main__":
    # Add backend directory to Python path
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    
    # Set PYTHONPATH to include the app directory
    # This is crucial for uvicorn to find 'app.debug_main'
    os.environ["PYTHONPATH"] = backend_dir

    logging.basicConfig(level=logging.INFO)
    log = logging.getLogger(__name__)

    log.info("--- Starting Debug Main Runner ---")
    log.info(f"Python Path: {sys.path}")
    log.info(f"PYTHONPATH Env: {os.environ.get('PYTHONPATH')}")
    
    uvicorn.run(
        "app.debug_main:app",
        host="0.0.0.0",
        port=8002, # Using a different port to avoid conflicts
        reload=False, # Keep reload off for now
        log_level="info"
    )
