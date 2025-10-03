#!/usr/bin/env python
import os
import subprocess
import argparse
import sys

def run_command(command):
    """Run a shell command and print output"""
    process = subprocess.Popen(
        command, 
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=True,
        universal_newlines=True
    )
    
    while True:
        output = process.stdout.readline()
        if output == '' and process.poll() is not None:
            break
        if output:
            print(output.strip())
    
    return process.poll()

def start_dev():
    """Start development environment"""
    print("Starting GPlus App in development mode...")
    run_command("docker-compose -f docker-compose.dev.yml up --build")

def stop_dev():
    """Stop development environment"""
    print("Stopping GPlus App development environment...")
    run_command("docker-compose -f docker-compose.dev.yml down")

def start_prod():
    """Start production environment"""
    print("Starting GPlus App in production mode...")
    run_command("docker-compose -f docker-compose.prod.yml up -d")

def stop_prod():
    """Stop production environment"""
    print("Stopping GPlus App production environment...")
    run_command("docker-compose -f docker-compose.prod.yml down")

def setup_db():
    """Initialize the database"""
    print("Setting up the database...")
    run_command("docker-compose -f docker-compose.dev.yml exec backend python setup_db.py")

def main():
    parser = argparse.ArgumentParser(description='GPlus App Management Tool')
    parser.add_argument('command', choices=['start-dev', 'stop-dev', 'start-prod', 'stop-prod', 'setup-db'], 
                        help='Command to execute')
    
    args = parser.parse_args()
    
    if args.command == 'start-dev':
        start_dev()
    elif args.command == 'stop-dev':
        stop_dev()
    elif args.command == 'start-prod':
        start_prod()
    elif args.command == 'stop-prod':
        stop_prod()
    elif args.command == 'setup-db':
        setup_db()

if __name__ == "__main__":
    main()