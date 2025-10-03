#!/bin/bash

# Secrets Management Script for G+ Recycling App
# This script helps manage secrets for the production environment
# It integrates with HashiCorp Vault for secure secrets storage

# Exit on error
set -e

# Configuration
DEPLOY_DIR="/opt/gplus-app"
ENV_FILE="$DEPLOY_DIR/.env"
VAULT_ADDR=${VAULT_ADDR:-"http://localhost:8200"}
VAULT_TOKEN=${VAULT_TOKEN:-""}
SECRET_PATH="secret/gplus/prod"

# Ensure Vault CLI is installed
if ! command -v vault &> /dev/null; then
    echo "ERROR: HashiCorp Vault CLI is not installed."
    echo "Install it with: apt-get install vault or from https://www.vaultproject.io/downloads"
    exit 1
fi

# Check if vault token is provided or in environment
if [ -z "$VAULT_TOKEN" ]; then
    echo "Vault token not provided. Please set VAULT_TOKEN environment variable."
    exit 1
fi

# Configure Vault
export VAULT_ADDR="$VAULT_ADDR"
export VAULT_TOKEN="$VAULT_TOKEN"

# Function to show usage
usage() {
    echo "G+ Recycling App Secrets Management"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup          - Initial setup of secrets in Vault"
    echo "  load           - Load secrets from Vault to .env file"
    echo "  rotate [name]  - Rotate a specific secret"
    echo "  list           - List all secret names (not values)"
    echo ""
    echo "Examples:"
    echo "  $0 setup"
    echo "  $0 load"
    echo "  $0 rotate jwt"
    echo "  $0 list"
    exit 1
}

# Function to setup initial secrets
setup_secrets() {
    echo "Setting up initial secrets in Vault..."
    
    # Create a secure random string
    generate_secret() {
        openssl rand -base64 32
    }
    
    # Database secrets
    vault kv put "$SECRET_PATH/db" \
        POSTGRES_PASSWORD="$(generate_secret)"
    
    # Redis secrets
    vault kv put "$SECRET_PATH/redis" \
        REDIS_PASSWORD="$(generate_secret)"
    
    # JWT secrets
    vault kv put "$SECRET_PATH/jwt" \
        JWT_SECRET_KEY="$(generate_secret)"
    
    # Email secrets (these will need to be updated with real values)
    vault kv put "$SECRET_PATH/email" \
        SMTP_USERNAME="user@example.com" \
        SMTP_PASSWORD="example-password"
    
    # Monitoring secrets
    vault kv put "$SECRET_PATH/monitoring" \
        GRAFANA_ADMIN_PASSWORD="$(generate_secret)" \
        PROMETHEUS_AUTH_PASSWORD="$(generate_secret)"
    
    # Database admin secrets
    vault kv put "$SECRET_PATH/db-admin" \
        PGADMIN_DEFAULT_PASSWORD="$(generate_secret)"
    
    # Notification secrets
    vault kv put "$SECRET_PATH/notifications" \
        SLACK_WEBHOOK_URL="https://hooks.slack.com/services/PLACEHOLDER"
    
    echo "Initial secrets setup complete."
    echo "IMPORTANT: Some secrets need to be manually updated with real values."
    echo "Use 'vault kv put $SECRET_PATH/email SMTP_USERNAME=user@example.com SMTP_PASSWORD=real-password'"
    echo "and update the Slack webhook URL with a real value."
}

# Function to load secrets from Vault to .env
load_secrets() {
    echo "Loading secrets from Vault to $ENV_FILE..."
    
    # Create or truncate the .env file
    echo "# G+ Recycling App - Production Environment" > "$ENV_FILE"
    echo "# Generated on $(date)" >> "$ENV_FILE"
    echo "# WARNING: Never commit this file to version control" >> "$ENV_FILE"
    echo "" >> "$ENV_FILE"
    
    # Load non-sensitive configuration
    cat >> "$ENV_FILE" << EOF
# App configuration
APP_ENV=production
FRONTEND_ORIGIN=https://app.gplusrecycling.com
BACKEND_API_URL=https://api.gplusrecycling.com

# Database configuration
POSTGRES_SERVER=db
POSTGRES_USER=postgres_user
POSTGRES_DB=gplus_prod

# Redis configuration
REDIS_HOST=redis
REDIS_PORT=6379

# JWT authentication
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email settings
SMTP_SERVER=smtp.mailprovider.com
SMTP_PORT=587
SMTP_SENDER=noreply@gplusrecycling.com

# Monitoring & alerting
PROMETHEUS_AUTH_USERNAME=prometheus

# PgAdmin settings
PGADMIN_DEFAULT_EMAIL=admin@gplusrecycling.com

# Security settings
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
EOF
    
    # Load database secrets
    if vault kv get -field=POSTGRES_PASSWORD "$SECRET_PATH/db" > /dev/null 2>&1; then
        echo "" >> "$ENV_FILE"
        echo "# Database secrets" >> "$ENV_FILE"
        echo "POSTGRES_PASSWORD=$(vault kv get -field=POSTGRES_PASSWORD "$SECRET_PATH/db")" >> "$ENV_FILE"
    fi
    
    # Load Redis secrets
    if vault kv get -field=REDIS_PASSWORD "$SECRET_PATH/redis" > /dev/null 2>&1; then
        echo "" >> "$ENV_FILE"
        echo "# Redis secrets" >> "$ENV_FILE"
        echo "REDIS_PASSWORD=$(vault kv get -field=REDIS_PASSWORD "$SECRET_PATH/redis")" >> "$ENV_FILE"
    fi
    
    # Load JWT secrets
    if vault kv get -field=JWT_SECRET_KEY "$SECRET_PATH/jwt" > /dev/null 2>&1; then
        echo "" >> "$ENV_FILE"
        echo "# JWT secrets" >> "$ENV_FILE"
        echo "JWT_SECRET_KEY=$(vault kv get -field=JWT_SECRET_KEY "$SECRET_PATH/jwt")" >> "$ENV_FILE"
    fi
    
    # Load Email secrets
    if vault kv get -field=SMTP_USERNAME "$SECRET_PATH/email" > /dev/null 2>&1; then
        echo "" >> "$ENV_FILE"
        echo "# Email secrets" >> "$ENV_FILE"
        echo "SMTP_USERNAME=$(vault kv get -field=SMTP_USERNAME "$SECRET_PATH/email")" >> "$ENV_FILE"
        echo "SMTP_PASSWORD=$(vault kv get -field=SMTP_PASSWORD "$SECRET_PATH/email")" >> "$ENV_FILE"
    fi
    
    # Load Monitoring secrets
    if vault kv get -field=GRAFANA_ADMIN_PASSWORD "$SECRET_PATH/monitoring" > /dev/null 2>&1; then
        echo "" >> "$ENV_FILE"
        echo "# Monitoring secrets" >> "$ENV_FILE"
        echo "GRAFANA_ADMIN_PASSWORD=$(vault kv get -field=GRAFANA_ADMIN_PASSWORD "$SECRET_PATH/monitoring")" >> "$ENV_FILE"
        echo "PROMETHEUS_AUTH_PASSWORD=$(vault kv get -field=PROMETHEUS_AUTH_PASSWORD "$SECRET_PATH/monitoring")" >> "$ENV_FILE"
    fi
    
    # Load DB Admin secrets
    if vault kv get -field=PGADMIN_DEFAULT_PASSWORD "$SECRET_PATH/db-admin" > /dev/null 2>&1; then
        echo "" >> "$ENV_FILE"
        echo "# DB Admin secrets" >> "$ENV_FILE"
        echo "PGADMIN_DEFAULT_PASSWORD=$(vault kv get -field=PGADMIN_DEFAULT_PASSWORD "$SECRET_PATH/db-admin")" >> "$ENV_FILE"
    fi
    
    # Load Notification secrets
    if vault kv get -field=SLACK_WEBHOOK_URL "$SECRET_PATH/notifications" > /dev/null 2>&1; then
        echo "" >> "$ENV_FILE"
        echo "# Notification secrets" >> "$ENV_FILE"
        echo "SLACK_WEBHOOK_URL=$(vault kv get -field=SLACK_WEBHOOK_URL "$SECRET_PATH/notifications")" >> "$ENV_FILE"
    fi
    
    echo "Secrets loaded to $ENV_FILE"
    echo "IMPORTANT: Ensure proper permissions on the .env file"
    chmod 600 "$ENV_FILE"
}

# Function to rotate a specific secret
rotate_secret() {
    local secret_type=$1
    
    if [ -z "$secret_type" ]; then
        echo "ERROR: Secret type is required"
        echo "Usage: $0 rotate [db|redis|jwt|email|monitoring|db-admin|notifications]"
        exit 1
    fi
    
    echo "Rotating $secret_type secret..."
    
    # Generate new secure random string
    new_secret=$(openssl rand -base64 32)
    
    case $secret_type in
        db)
            vault kv put "$SECRET_PATH/db" \
                POSTGRES_PASSWORD="$new_secret"
            echo "Database password rotated"
            ;;
        redis)
            vault kv put "$SECRET_PATH/redis" \
                REDIS_PASSWORD="$new_secret"
            echo "Redis password rotated"
            ;;
        jwt)
            vault kv put "$SECRET_PATH/jwt" \
                JWT_SECRET_KEY="$new_secret"
            echo "JWT secret key rotated"
            ;;
        email)
            # For email, we shouldn't auto-generate as these are external credentials
            echo "Email secrets need to be manually updated with real values."
            echo "Use: vault kv put $SECRET_PATH/email SMTP_USERNAME=user@example.com SMTP_PASSWORD=real-password"
            exit 1
            ;;
        monitoring)
            vault kv put "$SECRET_PATH/monitoring" \
                GRAFANA_ADMIN_PASSWORD="$new_secret" \
                PROMETHEUS_AUTH_PASSWORD="$(openssl rand -base64 32)"
            echo "Monitoring passwords rotated"
            ;;
        db-admin)
            vault kv put "$SECRET_PATH/db-admin" \
                PGADMIN_DEFAULT_PASSWORD="$new_secret"
            echo "PgAdmin password rotated"
            ;;
        notifications)
            # For webhooks, we shouldn't auto-generate as these are external URLs
            echo "Notification webhook URLs need to be manually updated."
            echo "Use: vault kv put $SECRET_PATH/notifications SLACK_WEBHOOK_URL=https://hooks.slack.com/services/REAL_URL"
            exit 1
            ;;
        *)
            echo "Unknown secret type: $secret_type"
            echo "Available types: db, redis, jwt, email, monitoring, db-admin, notifications"
            exit 1
            ;;
    esac
    
    echo "Secret rotation complete. Don't forget to reload the environment file and restart services."
    echo "Run: $0 load && cd $DEPLOY_DIR && docker-compose -f docker-compose.prod.yml restart"
}

# Function to list all secrets (just names, not values)
list_secrets() {
    echo "Available secrets in Vault:"
    echo "Path: $SECRET_PATH/*"
    
    # List all secret paths under our path
    vault kv list "$SECRET_PATH" 2>/dev/null || echo "No secrets found at $SECRET_PATH"
}

# Check command
case "$1" in
    setup)
        setup_secrets
        ;;
    load)
        load_secrets
        ;;
    rotate)
        rotate_secret "$2"
        ;;
    list)
        list_secrets
        ;;
    *)
        usage
        ;;
esac

exit 0