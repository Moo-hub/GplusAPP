#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, r'C:\GplusApp_backup\backend')
os.chdir(r'C:\GplusApp_backup\backend')

# Import and run the FastAPI app
from app.main import app
import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)