import os
import sys
import uvicorn

def main():
    """
    Main entry point for running the GPlusApp backend.

    This script correctly sets up the Python path to include the 'app' directory,
    ensuring that all modules can be imported correctly without `ModuleNotFoundError`.
    It then starts the Uvicorn server to run the FastAPI application.
    """
    # Add the parent directory of 'app' to the Python path.
    # This allows imports like `from app.core.config import settings`.
    # We resolve the absolute path to ensure this works regardless of where the script is called from.
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__)))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    # Now that the path is set, we can safely import the app object.
    from app.main import app

    # Run the Uvicorn server.
    # 'app.main:app' specifies the location of the FastAPI app instance.
    # host="0.0.0.0" makes the server accessible on the local network.
    # reload=True has been disabled to prevent issues with long file paths on Windows.
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=False,  # Keep reload disabled for now
        log_level="info",
        # workers=workers
    )

if __name__ == "__main__":
    main()
