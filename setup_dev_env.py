#!/usr/bin/env python
"""
G+ Recycling App Development Environment Setup
==============================================

This script helps set up the development environment for the G+ Recycling App.
It handles:
1. Setting up the necessary environment variables
2. Creating a SQLite database for development
3. Installing dependencies for both frontend and backend
4. Creating sample data for testing

Usage: python setup_dev_env.py
"""

import os
import sys
import subprocess
import platform
import json
import sqlite3
from pathlib import Path

# Define root directory
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
ENV_FILE_BACKEND = BACKEND_DIR / ".env"
ENV_FILE_FRONTEND = FRONTEND_DIR / ".env"
DB_FILE = ROOT_DIR / "app.db"

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_step(message):
    """Print a step message with formatting"""
    print(f"\n{Colors.BLUE}{Colors.BOLD}=== {message} ==={Colors.END}\n")

def print_success(message):
    """Print a success message with formatting"""
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_warning(message):
    """Print a warning message with formatting"""
    print(f"{Colors.YELLOW}⚠ {message}{Colors.END}")

def print_error(message):
    """Print an error message with formatting"""
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def run_command(command, cwd=None, env=None):
    """Run a command in the shell and return the result"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            text=True,
            capture_output=True,
            cwd=cwd,
            env=env
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print_error(f"Command failed: {command}")
        print(f"Error output: {e.stderr}")
        return None

def check_python_version():
    """Check if Python version is compatible"""
    print_step("Checking Python version")
    
    version_info = sys.version_info
    if version_info.major < 3 or (version_info.major == 3 and version_info.minor < 7):
        print_error("Python 3.7 or higher is required")
        return False
    
    print_success(f"Python version: {sys.version.split()[0]}")
    return True

def check_node_version():
    """Check if Node.js version is compatible"""
    print_step("Checking Node.js version")
    
    try:
        node_version = run_command("node --version")
        if node_version:
            # Remove 'v' prefix from version
            node_version = node_version.lstrip('v')
            major_version = int(node_version.split('.')[0])
            
            if major_version < 14:
                print_error(f"Node.js version 14 or higher is required (found {node_version})")
                return False
            
            print_success(f"Node.js version: {node_version}")
            return True
        else:
            print_error("Node.js is not installed or not in PATH")
            return False
    except Exception as e:
        print_error(f"Failed to check Node.js version: {e}")
        return False

def setup_backend_env():
    """Set up the backend environment variables"""
    print_step("Setting up backend environment")
    
    # Create .env file for backend
    env_content = [
        "ENVIRONMENT=development",
        "DEBUG=True",
        "SECRET_KEY=dev_secret_key_123",
        "POSTGRES_SERVER=localhost",
        "POSTGRES_PORT=5433",
        "POSTGRES_USER=postgres",
        "POSTGRES_PASSWORD=postgres",
        "POSTGRES_DB=gplus_app",
        "REDIS_HOST=localhost",
        "REDIS_PORT=6379",
        "REDIS_ALERTS_ENABLED=False",
        "FRONTEND_URL=http://localhost:3000"
    ]
    
    try:
        with open(ENV_FILE_BACKEND, 'w') as f:
            f.write("\n".join(env_content))
        print_success(f"Created backend .env file at {ENV_FILE_BACKEND}")
    except Exception as e:
        print_error(f"Failed to create backend .env file: {e}")
        return False
    
    return True

def setup_frontend_env():
    """Set up the frontend environment variables"""
    print_step("Setting up frontend environment")
    
    # Create .env file for frontend
    env_content = [
        "VITE_API_URL=http://localhost:8000/api/v1",
        "VITE_WEBSOCKET_URL=ws://localhost:8000/ws",
        "VITE_MOCK_API=true"  # Enable mock API by default
    ]
    
    try:
        with open(ENV_FILE_FRONTEND, 'w') as f:
            f.write("\n".join(env_content))
        print_success(f"Created frontend .env file at {ENV_FILE_FRONTEND}")
    except Exception as e:
        print_error(f"Failed to create frontend .env file: {e}")
        return False
    
    return True

def create_sqlite_db():
    """Create a SQLite database for development"""
    print_step("Setting up SQLite database")
    
    try:
        # Create empty database file
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Create some basic tables for testing
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
        ''')
        
        # Insert test user
        cursor.execute('''
        INSERT OR IGNORE INTO users (name, email, password)
        VALUES ('Test User', 'test@example.com', '$2b$12$GMc0tURSrSiF5WlG5Lq40eR4SL4qXh8Gs7GmMXs.sCxRyK0w5Vs.y')  -- password: password123
        ''')
        
        conn.commit()
        conn.close()
        
        print_success(f"Created SQLite database at {DB_FILE}")
        return True
    except Exception as e:
        print_error(f"Failed to create SQLite database: {e}")
        return False

def install_backend_dependencies():
    """Install backend dependencies"""
    print_step("Installing backend dependencies")
    
    if not BACKEND_DIR.exists():
        print_error(f"Backend directory not found at {BACKEND_DIR}")
        return False
    
    # Check for requirements.txt
    req_file = BACKEND_DIR / "requirements.txt"
    if not req_file.exists():
        print_error(f"requirements.txt not found at {req_file}")
        return False
    
    # Install using pip
    result = run_command("pip install -r requirements.txt", cwd=BACKEND_DIR)
    if result is not None:
        print_success("Installed backend dependencies")
        return True
    else:
        return False

def install_frontend_dependencies():
    """Install frontend dependencies"""
    print_step("Installing frontend dependencies")
    
    if not FRONTEND_DIR.exists():
        print_error(f"Frontend directory not found at {FRONTEND_DIR}")
        return False
    
    # Check for package.json
    package_file = FRONTEND_DIR / "package.json"
    if not package_file.exists():
        print_error(f"package.json not found at {package_file}")
        return False
    
    # Install using npm
    result = run_command("npm install", cwd=FRONTEND_DIR)
    if result is not None:
        print_success("Installed frontend dependencies")
        return True
    else:
        return False

def main():
    """Main function to run the setup"""
    print_step("Starting G+ Recycling App Development Setup")
    
    # Check requirements
    python_ok = check_python_version()
    node_ok = check_node_version()
    
    if not python_ok or not node_ok:
        print_error("System requirements not met. Please fix the issues above and try again.")
        return False
    
    # Setup environment
    backend_env_ok = setup_backend_env()
    frontend_env_ok = setup_frontend_env()
    
    # Create database
    db_ok = create_sqlite_db()
    
    # Install dependencies
    backend_deps_ok = install_backend_dependencies()
    frontend_deps_ok = install_frontend_dependencies()
    
    # Print summary
    print_step("Setup Summary")
    print(f"{'Backend environment:':30} {'✓' if backend_env_ok else '✗'}")
    print(f"{'Frontend environment:':30} {'✓' if frontend_env_ok else '✗'}")
    print(f"{'Database setup:':30} {'✓' if db_ok else '✗'}")
    print(f"{'Backend dependencies:':30} {'✓' if backend_deps_ok else '✗'}")
    print(f"{'Frontend dependencies:':30} {'✓' if frontend_deps_ok else '✗'}")
    
    if backend_env_ok and frontend_env_ok and db_ok and backend_deps_ok and frontend_deps_ok:
        print_success("\nSetup completed successfully!")
        print("\nYou can now run the application with:")
        print(f"  Backend:  cd {BACKEND_DIR} && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        print(f"  Frontend: cd {FRONTEND_DIR} && npm run dev")
        return True
    else:
        print_warning("\nSetup completed with some issues. Please check the errors above.")
        return False

if __name__ == "__main__":
    main()