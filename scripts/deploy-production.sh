#!/bin/bash

# Production Deployment Script for G+ Recycling App
# This script handles the deployment of the G+ Recycling App to production
# It should be run on the production server

# Exit on error
set -e

# Configuration
DEPLOY_DIR="/opt/gplus-app"
BACKUP_DIR="$DEPLOY_DIR/backups"
LOG_DIR="$DEPLOY_DIR/logs"
ENV_FILE="$DEPLOY_DIR/.env"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
TAG=${1:-latest}

# Create required directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/deploy-$(date '+%Y-%m-%d').log"
}

# Backup function
backup_database() {
    log "Backing up database before deployment..."
    BACKUP_FILE="$BACKUP_DIR/pre-deploy-$(date '+%Y-%m-%d-%H-%M').sql"
    
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
        docker exec db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$BACKUP_FILE"
        log "Database backed up to $BACKUP_FILE"
    else
        log "ERROR: Environment file not found. Cannot backup database."
        exit 1
    fi
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log "ERROR: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    log "ERROR: docker-compose.prod.yml not found at $COMPOSE_FILE"
    exit 1
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    log "ERROR: Environment file not found at $ENV_FILE"
    exit 1
fi

# Start deployment
log "Starting deployment of G+ Recycling App version $TAG"

# Backup database
backup_database

# Pull latest images
log "Pulling latest images..."
TAG="$TAG" docker-compose -f "$COMPOSE_FILE" pull

# Deploy with zero downtime (using rolling update)
log "Deploying new containers..."
TAG="$TAG" docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans

# Run database migrations
log "Running database migrations..."
docker-compose -f "$COMPOSE_FILE" exec -T backend alembic upgrade head

# Verify deployment
log "Verifying deployment..."
docker-compose -f "$COMPOSE_FILE" ps

# Check API health
log "Checking API health..."
if curl -s http://localhost:8000/health | grep -q "ok"; then
    log "API health check passed"
else
    log "WARNING: API health check failed"
fi

# Clean up old images
log "Cleaning up old images..."
docker image prune -a -f --filter "until=24h"

log "Deployment completed successfully!"