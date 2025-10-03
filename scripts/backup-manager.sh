#!/bin/bash

# Backup Management Script for G+ Recycling App
# This script handles different types of backups for the G+ Recycling App
# It supports database backups, volume backups, and offsite backup to S3

# Exit on error
set -e

# Configuration
DEPLOY_DIR="/opt/gplus-app"
BACKUP_DIR="$DEPLOY_DIR/backups"
LOG_DIR="$DEPLOY_DIR/logs"
ENV_FILE="$DEPLOY_DIR/.env"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
S3_BUCKET=${S3_BUCKET:-"gplus-backups"}
RETENTION_DAYS=${RETENTION_DAYS:-7}
DATE_FORMAT=$(date +"%Y-%m-%d-%H-%M")

# Create required directories
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/volumes"
mkdir -p "$LOG_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/backup-$(date '+%Y-%m-%d').log"
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

# Function to backup the database
backup_database() {
    log "Starting database backup..."
    
    # Create backup filename
    BACKUP_FILE="$BACKUP_DIR/database/gplus-db-$DATE_FORMAT.sql"
    
    # Execute the backup
    docker-compose -f "$COMPOSE_FILE" exec -T db pg_dump -U postgres -d gplus_prod > "$BACKUP_FILE"
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    
    log "Database backup completed: ${BACKUP_FILE}.gz"
    
    # Clean up old backups
    find "$BACKUP_DIR/database" -name "gplus-db-*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    log "Cleaned up database backups older than $RETENTION_DAYS days"
    
    return 0
}

# Function to backup Docker volumes
backup_volumes() {
    log "Starting volume backups..."
    
    # List of volumes to backup
    VOLUMES=("pgdata" "redis_data" "grafana_data" "prometheus_data" "backend_data")
    
    for VOLUME in "${VOLUMES[@]}"; do
        log "Backing up volume: $VOLUME"
        BACKUP_FILE="$BACKUP_DIR/volumes/$VOLUME-$DATE_FORMAT.tar.gz"
        
        # Use docker to create a temporary container and backup the volume
        docker run --rm -v "$VOLUME:/source" -v "$BACKUP_DIR/volumes:/backup" \
            ubuntu tar -czf "/backup/$(basename $BACKUP_FILE)" -C /source .
            
        log "Volume $VOLUME backup completed: $BACKUP_FILE"
    done
    
    # Clean up old backups
    find "$BACKUP_DIR/volumes" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    log "Cleaned up volume backups older than $RETENTION_DAYS days"
    
    return 0
}

# Function to sync backups to S3
sync_to_s3() {
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log "WARNING: AWS CLI is not installed. Skipping S3 sync."
        return 1
    fi
    
    log "Syncing backups to S3 bucket: $S3_BUCKET"
    
    # Sync database backups
    aws s3 sync "$BACKUP_DIR/database" "s3://$S3_BUCKET/database/" \
        --delete --quiet
    
    # Sync volume backups
    aws s3 sync "$BACKUP_DIR/volumes" "s3://$S3_BUCKET/volumes/" \
        --delete --quiet
    
    log "S3 sync completed"
    return 0
}

# Function to perform a full backup
full_backup() {
    log "Starting full backup process..."
    
    # Backup database
    backup_database
    
    # Backup volumes
    backup_volumes
    
    # Sync to S3 if requested
    if [ "$SYNC_TO_S3" = "yes" ]; then
        sync_to_s3
    fi
    
    log "Full backup completed successfully"
    return 0
}

# Function to restore database from backup
restore_database() {
    local BACKUP_FILE="$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log "ERROR: Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    log "Restoring database from $BACKUP_FILE..."
    
    # Check if the file is compressed
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        # Decompress to a temporary file
        TEMP_FILE="/tmp/restore-$(basename "$BACKUP_FILE" .gz)"
        gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
        BACKUP_FILE="$TEMP_FILE"
    fi
    
    # Stop backend service to prevent writes during restore
    log "Stopping backend service..."
    docker-compose -f "$COMPOSE_FILE" stop backend
    
    # Restore the database
    log "Restoring database..."
    cat "$BACKUP_FILE" | docker-compose -f "$COMPOSE_FILE" exec -T db psql -U postgres -d gplus_prod
    
    # Start backend service
    log "Starting backend service..."
    docker-compose -f "$COMPOSE_FILE" start backend
    
    # Clean up temporary file if created
    if [[ "$TEMP_FILE" == "/tmp/restore-"* ]]; then
        rm -f "$TEMP_FILE"
    fi
    
    log "Database restored successfully"
    return 0
}

# Function to restore a volume
restore_volume() {
    local VOLUME="$1"
    local BACKUP_FILE="$2"
    
    if [ -z "$VOLUME" ] || [ -z "$BACKUP_FILE" ]; then
        log "ERROR: Both volume name and backup file are required"
        echo "Usage: $0 restore-volume [volume_name] [backup_file]"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log "ERROR: Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    log "Restoring volume $VOLUME from $BACKUP_FILE..."
    
    # Stop services that use this volume
    log "Stopping services..."
    docker-compose -f "$COMPOSE_FILE" stop
    
    # Create a temporary container to restore the volume
    log "Restoring volume data..."
    docker run --rm -v "$VOLUME:/destination" -v "$(dirname "$BACKUP_FILE"):/backup" \
        ubuntu bash -c "tar -xzf /backup/$(basename "$BACKUP_FILE") -C /destination"
    
    # Restart services
    log "Starting services..."
    docker-compose -f "$COMPOSE_FILE" start
    
    log "Volume $VOLUME restored successfully"
    return 0
}

# Function to show usage
usage() {
    echo "G+ Recycling App Backup Management"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  backup-db                     - Backup only the database"
    echo "  backup-volumes                - Backup only the volumes"
    echo "  backup-full                   - Backup database and volumes"
    echo "  sync-s3                       - Sync existing backups to S3"
    echo "  backup-and-sync               - Backup everything and sync to S3"
    echo "  restore-db [backup_file]      - Restore database from backup"
    echo "  restore-volume [vol] [backup] - Restore volume from backup"
    echo "  list-backups                  - List available backups"
    echo ""
    echo "Examples:"
    echo "  $0 backup-full"
    echo "  $0 restore-db $BACKUP_DIR/database/gplus-db-2023-01-01.sql.gz"
    echo "  $0 restore-volume pgdata $BACKUP_DIR/volumes/pgdata-2023-01-01.tar.gz"
    echo ""
    exit 1
}

# Check command
case "$1" in
    backup-db)
        backup_database
        ;;
    backup-volumes)
        backup_volumes
        ;;
    backup-full)
        SYNC_TO_S3="no"
        full_backup
        ;;
    sync-s3)
        sync_to_s3
        ;;
    backup-and-sync)
        SYNC_TO_S3="yes"
        full_backup
        ;;
    restore-db)
        if [ -z "$2" ]; then
            echo "ERROR: Backup file is required"
            echo "Usage: $0 restore-db [backup_file]"
            exit 1
        fi
        restore_database "$2"
        ;;
    restore-volume)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "ERROR: Volume name and backup file are required"
            echo "Usage: $0 restore-volume [volume_name] [backup_file]"
            exit 1
        fi
        restore_volume "$2" "$3"
        ;;
    list-backups)
        echo "Database backups:"
        ls -la "$BACKUP_DIR/database"
        echo ""
        echo "Volume backups:"
        ls -la "$BACKUP_DIR/volumes"
        ;;
    *)
        usage
        ;;
esac

exit 0