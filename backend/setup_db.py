#!/usr/bin/env python
import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, os.path.abspath("."))

from app.db.init_db import main
from app.db.session import engine, SessionLocal
from app.db.base import Base

def setup_db():
    """
    Set up database:
    - Create tables if they don't exist
    - Run migrations
    - Create initial data
    """
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Running initial data setup...")
    main()
    
    print("Database setup completed successfully!")

if __name__ == "__main__":
    setup_db()