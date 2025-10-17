import uvicorn
from fastapi import FastAPI

# Create a minimal FastAPI application instance.
# This app is completely independent of the main project's code.
minimal_app = FastAPI(
    title="Debug Runner",
    description="A minimal FastAPI app to test the environment.",
    version="1.0.0"
)

@minimal_app.get("/health", tags=["Health Check"])
def health_check():
    """
    A simple endpoint to confirm that the server is running and responsive.
    """
    return {"status": "ok", "message": "Minimal debug server is running!"}

if __name__ == "__main__":
    """
    Main entry point for the debug runner.
    It starts a Uvicorn server for the minimal_app.
    - host="0.0.0.0" makes it accessible on the network.
    - port=8001 is used to avoid conflicts with the main app's port 8000.
    - log_level="debug" provides detailed output.
    """
    print("--- Starting Minimal Debug Server ---")
    uvicorn.run(
        minimal_app,
        host="0.0.0.0",
        port=8001,
        log_level="debug"
    )
