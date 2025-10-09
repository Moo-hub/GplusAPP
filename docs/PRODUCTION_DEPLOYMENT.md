# G+ Recycling App - Production Deployment Guide

This document outlines the complete production deployment process for the G+ Recycling App, including environment management, secrets handling, and deployment workflows.

## Infrastructure Overview

The G+ Recycling App production infrastructure consists of:

1. **Application Services**
   - Backend API (FastAPI)
   - Frontend (React)
   - PostgreSQL Database
   - Redis Cache

2. **Monitoring & Management**
   - Prometheus & Grafana for monitoring
   - Traefik as reverse proxy and load balancer
   - PgAdmin for database management

3. **Security Infrastructure**
   - SSL/TLS termination
   - JWT authentication
   - Rate limiting
   - Security scanning and monitoring

## Deployment Architecture

```ascii
                            ┌─────────────┐
                            │   Internet  │
                            └──────┬──────┘
                                   │
                   ┌───────────────▼────────────────┐
                   │        SSL Termination         │
                   │      (Traefik/Cloudflare)      │
                   └───────────────┬────────────────┘
                                   │
                   ┌───────────────▼────────────────┐
                   │      Load Balancer (Traefik)   │
                   └┬─────────────────────────────┬─┘
                    │                             │
        ┌───────────▼───────────┐     ┌──────────▼───────────┐
        │    Frontend Cluster   │     │    Backend Cluster   │
        │   (React/Nginx/CDN)   │     │      (FastAPI)       │
        └───────────┬───────────┘     └──────────┬───────────┘
                    │                            │
                    │                 ┌──────────▼───────────┐
                    │                 │   Database Cluster   │
                    │                 │     (PostgreSQL)     │
                    │                 └──────────┬───────────┘
                    │                            │
                    │                 ┌──────────▼───────────┐
                    │                 │      Redis Cache      │
                    │                 └──────────────────────┘
                    │
                    │
        ┌───────────▼───────────────────────────────────────┐
        │                  Monitoring Stack                 │
        │     (Prometheus, Grafana, AlertManager)          │
        └───────────────────────────────────────────────────┘
```

## Environment Management

### Environment File Structure

Production environment variables are managed securely using:

1. **Base Environment File**: Contains non-sensitive configuration values
2. **Secrets File**: Contains sensitive information stored securely
3. **Environment-Specific Overrides**: Values specific to production, staging, etc.

### Production Environment Variables

Create a `.env.prod` file with the following structure (never commit this file):

```ini
# App configuration
APP_ENV=production
FRONTEND_ORIGIN=https://app.gplusrecycling.com
BACKEND_API_URL=https://api.gplusrecycling.com

# Database configuration
POSTGRES_SERVER=db
POSTGRES_USER=postgres_user
POSTGRES_PASSWORD=<from-vault>
POSTGRES_DB=gplus_prod

# Redis configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<from-vault>

# JWT authentication
JWT_SECRET_KEY=<from-vault>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email settings
SMTP_SERVER=smtp.mailprovider.com
SMTP_PORT=587
SMTP_USERNAME=<from-vault>
SMTP_PASSWORD=<from-vault>
SMTP_SENDER=noreply@gplusrecycling.com

# Monitoring & alerting
GRAFANA_ADMIN_PASSWORD=<from-vault>
PROMETHEUS_AUTH_USERNAME=prometheus
PROMETHEUS_AUTH_PASSWORD=<from-vault>

# PgAdmin settings
PGADMIN_DEFAULT_EMAIL=admin@gplusrecycling.com
PGADMIN_DEFAULT_PASSWORD=<from-vault>

# Slack integration
SLACK_WEBHOOK_URL=<from-vault>

# Security settings
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
```

### Secret Management

For production, we use HashiCorp Vault for secure secret management:

1. **Initial Setup**:
   ```bash
   # Install Vault client
   sudo apt-get install vault

   # Configure Vault client
   vault login
   ```

2. **Storing Secrets**:
   ```bash
   # Store secrets
   vault kv put secret/gplus/prod/db POSTGRES_PASSWORD=secure_password
   vault kv put secret/gplus/prod/redis REDIS_PASSWORD=secure_password
   vault kv put secret/gplus/prod/jwt JWT_SECRET_KEY=secure_key
   vault kv put secret/gplus/prod/email SMTP_USERNAME=user SMTP_PASSWORD=pass
   ```

3. **Loading Secrets for Deployment**:
   ```bash
   # Create script to load secrets (secrets-loader.sh)
   #!/bin/bash
   export POSTGRES_PASSWORD=$(vault kv get -field=POSTGRES_PASSWORD secret/gplus/prod/db)
   export REDIS_PASSWORD=$(vault kv get -field=REDIS_PASSWORD secret/gplus/prod/redis)
   export JWT_SECRET_KEY=$(vault kv get -field=JWT_SECRET_KEY secret/gplus/prod/jwt)
   export SMTP_USERNAME=$(vault kv get -field=SMTP_USERNAME secret/gplus/prod/email)
   export SMTP_PASSWORD=$(vault kv get -field=SMTP_PASSWORD secret/gplus/prod/email)
   export GRAFANA_ADMIN_PASSWORD=$(vault kv get -field=GRAFANA_ADMIN_PASSWORD secret/gplus/prod/monitoring)
   export PROMETHEUS_AUTH_PASSWORD=$(vault kv get -field=PROMETHEUS_AUTH_PASSWORD secret/gplus/prod/monitoring)
   export PGADMIN_DEFAULT_PASSWORD=$(vault kv get -field=PGADMIN_DEFAULT_PASSWORD secret/gplus/prod/db)
   export SLACK_WEBHOOK_URL=$(vault kv get -field=SLACK_WEBHOOK_URL secret/gplus/prod/notifications)

   # Run docker-compose with environment variables loaded
   docker-compose -f docker-compose.prod.yml up -d
   ```

## CI/CD Pipeline Configuration

### GitHub Actions Workflow

Update your GitHub Actions workflow to include proper production deployment:

```yaml
name: Production Deployment

on:
  push:
    branches:
      - main
    tags:
      - 'v*.*.*'

jobs:
  # Test and build jobs from existing workflow...

  deploy-production:
    needs: [build-and-push, security-scan]
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.7.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
          
      - name: Deploy to Production Server
        env:
          SERVER_HOST: ${{ secrets.PRODUCTION_SERVER_HOST }}
          SERVER_USER: ${{ secrets.PRODUCTION_SERVER_USER }}
          DEPLOY_PATH: /opt/gplus-app
        run: |
          # Create deployment package
          mkdir -p deploy
          cp docker-compose.prod.yml deploy/
          cp prometheus.yml deploy/
          cp -r grafana deploy/
          cp -r alerts deploy/
          
          # Create env file from secrets
          echo "POSTGRES_PASSWORD=${{ secrets.POSTGRES_PASSWORD }}" > deploy/.env.prod
          echo "REDIS_PASSWORD=${{ secrets.REDIS_PASSWORD }}" >> deploy/.env.prod
          echo "JWT_SECRET_KEY=${{ secrets.JWT_SECRET_KEY }}" >> deploy/.env.prod
          echo "SMTP_USERNAME=${{ secrets.SMTP_USERNAME }}" >> deploy/.env.prod
          echo "SMTP_PASSWORD=${{ secrets.SMTP_PASSWORD }}" >> deploy/.env.prod
          echo "GRAFANA_ADMIN_PASSWORD=${{ secrets.GRAFANA_ADMIN_PASSWORD }}" >> deploy/.env.prod
          echo "PROMETHEUS_AUTH_PASSWORD=${{ secrets.PROMETHEUS_AUTH_PASSWORD }}" >> deploy/.env.prod
          echo "PGADMIN_DEFAULT_PASSWORD=${{ secrets.PGADMIN_DEFAULT_PASSWORD }}" >> deploy/.env.prod
          echo "SLACK_WEBHOOK_URL=${{ secrets.SLACK_WEBHOOK_URL }}" >> deploy/.env.prod
          
          # Add non-sensitive configuration
          cat >> deploy/.env.prod << EOF
          APP_ENV=production
          FRONTEND_ORIGIN=https://app.gplusrecycling.com
          BACKEND_API_URL=https://api.gplusrecycling.com
          POSTGRES_SERVER=db
          POSTGRES_USER=postgres_user
          POSTGRES_DB=gplus_prod
          REDIS_HOST=redis
          REDIS_PORT=6379
          JWT_ALGORITHM=HS256
          ACCESS_TOKEN_EXPIRE_MINUTES=15
          REFRESH_TOKEN_EXPIRE_DAYS=7
          SMTP_SERVER=smtp.mailprovider.com
          SMTP_PORT=587
          SMTP_SENDER=noreply@gplusrecycling.com
          PROMETHEUS_AUTH_USERNAME=prometheus
          PGADMIN_DEFAULT_EMAIL=admin@gplusrecycling.com
          RATE_LIMIT_ENABLED=true
          RATE_LIMIT_PER_MINUTE=60
          EOF
          
          # Transfer files to production server
          scp -r -o StrictHostKeyChecking=no deploy/* $SERVER_USER@$SERVER_HOST:$DEPLOY_PATH/
          
          # Execute deployment commands
          ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST << EOF
            cd $DEPLOY_PATH
            mv .env.prod .env
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            
            # Run database migrations
            docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
            
            # Verify deployment
            echo "Verifying services..."
            docker-compose -f docker-compose.prod.yml ps
            
            # Cleanup old images
            echo "Cleaning up old images..."
            docker image prune -a -f --filter "until=24h"
          EOF
      
      - name: Notify Slack on Success
        if: success()
        uses: rtCamp/action-slack-notify@v2
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_COLOR: good
          SLACK_TITLE: Production Deployment Success
          SLACK_MESSAGE: 'G+ Recycling App has been successfully deployed to production 🚀'
      
      - name: Notify Slack on Failure
        if: failure()
        uses: rtCamp/action-slack-notify@v2
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_COLOR: danger
          SLACK_TITLE: Production Deployment Failed
          SLACK_MESSAGE: 'Production deployment failed! Please check the GitHub Actions logs.'
```

## Enhanced Traefik Configuration

Create a `traefik.prod.yml` configuration file for production:

```yaml
# Static configuration
global:
  checkNewVersion: true
  sendAnonymousUsage: false

log:
  level: INFO

api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  
  websecure:
    address: ":443"
    http:
      tls:
        certResolver: letsencrypt

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@gplusrecycling.com
      storage: /etc/traefik/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
  
  file:
    filename: /etc/traefik/dynamic-config.yml
```

Create `dynamic-config.yml` for dynamic Traefik configuration:

```yaml
http:
  middlewares:
    securityHeaders:
      headers:
        browserXssFilter: true
        contentTypeNosniff: true
        frameDeny: true
        sslRedirect: true
        stsIncludeSubdomains: true
        stsPreload: true
        stsSeconds: 31536000
        contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' api.gplusrecycling.com"
        
    rateLimit:
      rateLimit:
        average: 100
        burst: 50
        
    apiAuth:
      basicAuth:
        users:
          - "admin:$apr1$H6uskkkW$IgXLP6ewTrSuBkTrqE8wj/"
          
  routers:
    frontend:
      rule: "Host(`app.gplusrecycling.com`)"
      service: frontend
      middlewares:
        - securityHeaders
        - rateLimit
      tls: {}
      
    backend:
      rule: "Host(`api.gplusrecycling.com`)"
      service: backend
      middlewares:
        - securityHeaders
        - rateLimit
      tls: {}
      
    grafana:
      rule: "Host(`monitoring.gplusrecycling.com`)"
      service: grafana
      middlewares:
        - securityHeaders
        - apiAuth
      tls: {}
      
    prometheus:
      rule: "Host(`metrics.gplusrecycling.com`)"
      service: prometheus
      middlewares:
        - securityHeaders
        - apiAuth
      tls: {}
      
    pgadmin:
      rule: "Host(`database.gplusrecycling.com`)"
      service: pgadmin
      middlewares:
        - securityHeaders
        - apiAuth
      tls: {}
      
  services:
    frontend:
      loadBalancer:
        servers:
          - url: "http://frontend:80"
          
    backend:
      loadBalancer:
        servers:
          - url: "http://backend:8000"
          
    grafana:
      loadBalancer:
        servers:
          - url: "http://grafana:3000"
          
    prometheus:
      loadBalancer:
        servers:
          - url: "http://prometheus:9090"
          
    pgadmin:
      loadBalancer:
        servers:
          - url: "http://pgadmin:80"
```

## Updated Docker Compose Production File

Enhance the existing `docker-compose.prod.yml` file:

```yaml
version: '3.9'
services:
  backend:
    image: ghcr.io/moo-hub/gplusapp-backend:${TAG:-latest}
    container_name: backend
    restart: always
    env_file:
      - .env
    command: gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000 --workers 4
    volumes:
      - backend_data:/app/data
    networks:
      - gplusnet
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 512M
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.gplusrecycling.com`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.services.backend.loadbalancer.server.port=8000"

  frontend:
    image: ghcr.io/moo-hub/gplusapp-frontend:${TAG:-latest}
    container_name: frontend
    restart: always
    networks:
      - gplusnet
    depends_on:
      - backend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`app.gplusrecycling.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.services.frontend.loadbalancer.server.port=80"

  db:
    image: postgres:15
    container_name: db
    restart: always
    env_file:
      - .env
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./database/backups:/backups
    networks:
      - gplusnet
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G

  redis:
    image: redis:7
    container_name: redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    restart: always
    env_file:
      - .env
    volumes:
      - redis_data:/data
    networks:
      - gplusnet
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: always
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts:/etc/prometheus/alerts
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--storage.tsdb.retention.time=15d'
      - '--web.enable-lifecycle'
    networks:
      - gplusnet
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.prometheus.rule=Host(`metrics.gplusrecycling.com`)"
      - "traefik.http.routers.prometheus.entrypoints=websecure"
      - "traefik.http.routers.prometheus.middlewares=apiAuth@file"
      - "traefik.http.services.prometheus.loadbalancer.server.port=9090"

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: always
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
      - grafana_data:/var/lib/grafana
    env_file:
      - .env
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_DOMAIN=monitoring.gplusrecycling.com
      - GF_SMTP_ENABLED=true
      - GF_SMTP_HOST=${SMTP_SERVER}:${SMTP_PORT}
      - GF_SMTP_USER=${SMTP_USERNAME}
      - GF_SMTP_PASSWORD=${SMTP_PASSWORD}
      - GF_SMTP_FROM_ADDRESS=${SMTP_SENDER}
    depends_on:
      - prometheus
    networks:
      - gplusnet
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(`monitoring.gplusrecycling.com`)"
      - "traefik.http.routers.grafana.entrypoints=websecure"
      - "traefik.http.services.grafana.loadbalancer.server.port=3000"

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    restart: always
    volumes:
      - ./alertmanager/config.yml:/etc/alertmanager/config.yml
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/config.yml'
      - '--storage.path=/alertmanager'
    networks:
      - gplusnet

  pgadmin:
    image: dpage/pgadmin4
    container_name: pgadmin
    restart: always
    env_file:
      - .env
    networks:
      - gplusnet
    depends_on:
      - db
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.pgadmin.rule=Host(`database.gplusrecycling.com`)"
      - "traefik.http.routers.pgadmin.entrypoints=websecure"
      - "traefik.http.routers.pgadmin.middlewares=apiAuth@file"
      - "traefik.http.services.pgadmin.loadbalancer.server.port=80"

  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./traefik.prod.yml:/etc/traefik/traefik.yml
      - ./dynamic-config.yml:/etc/traefik/dynamic-config.yml
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - acme_data:/etc/traefik
    networks:
      - gplusnet

  backup-service:
    image: postgres:15
    container_name: backup-service
    command: |
      bash -c '
        while true; do
          DATE=`date +%Y-%m-%d-%H-%M`
          echo "Creating backup $DATE"
          pg_dump -h db -U postgres -d $${POSTGRES_DB} -f /backups/backup-$${DATE}.sql
          echo "Backup completed"
          echo "Removing old backups"
          find /backups -type f -name "backup-*.sql" -mtime +7 -delete
          echo "Sleeping for 24 hours"
          sleep 86400
        done
      '
    environment:
      - PGPASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - ./database/backups:/backups
    networks:
      - gplusnet
    depends_on:
      - db

volumes:
  pgdata:
  redis_data:
  prometheus_data:
  grafana_data:
  alertmanager_data:
  backend_data:
  acme_data:

networks:
  gplusnet:
    driver: bridge
```

## Server Setup and Maintenance

### Production Server Requirements

Minimum production server requirements:

| Component | Requirement |
|-----------|-------------|
| CPU | 4 cores |
| RAM | 8GB minimum, 16GB recommended |
| Disk | 100GB SSD minimum |
| OS | Ubuntu 22.04 LTS |
| Network | 100Mbps, public IP with DNS |

### Server Setup

1. **Base Server Setup**:

   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install required packages
   sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
   
   # Install Docker
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
   sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
   sudo apt update
   sudo apt install -y docker-ce
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.17.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Create application directory
   sudo mkdir -p /opt/gplus-app
   sudo chown $(whoami):$(whoami) /opt/gplus-app
   ```

2. **Firewall Configuration**:

   ```bash
   # Configure UFW
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

3. **User Management**:

   ```bash
   # Create deployment user
   sudo adduser deploy
   sudo usermod -aG docker deploy
   sudo mkdir -p /home/deploy/.ssh
   sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
   sudo chown -R deploy:deploy /home/deploy/.ssh
   sudo chmod 700 /home/deploy/.ssh
   sudo chmod 600 /home/deploy/.ssh/authorized_keys
   ```

### Backup Strategy

1. **Database Backups**:
   - Daily automated backups using the backup-service container
   - Backups stored in `/backups` directory
   - Retention period: 7 days for local backups

2. **Off-site Backup**:
   - Set up a cron job to transfer backups to an S3 bucket:

   ```bash
   # Install AWS CLI
   sudo apt install -y awscli
   
   # Configure AWS credentials
   aws configure
   
   # Create backup script (backup-to-s3.sh)
   #!/bin/bash
   aws s3 sync /opt/gplus-app/database/backups s3://gplus-backups/database/
   
   # Make it executable
   chmod +x backup-to-s3.sh
   
   # Add to crontab (daily at 3:30 AM)
   (crontab -l 2>/dev/null; echo "30 3 * * * /opt/gplus-app/backup-to-s3.sh") | crontab -
   ```

3. **Application Data Backups**:
   - Set up a script to backup volumes:

   ```bash
   # Create backup script (backup-volumes.sh)
   #!/bin/bash
   BACKUP_DATE=$(date +%Y-%m-%d)
   BACKUP_DIR=/opt/gplus-app/volume-backups
   
   mkdir -p $BACKUP_DIR
   
   # Stop services
   cd /opt/gplus-app
   docker-compose -f docker-compose.prod.yml stop
   
   # Backup volumes
   docker run --rm -v pgdata:/source -v $BACKUP_DIR:/backup ubuntu tar -czf /backup/pgdata-$BACKUP_DATE.tar.gz -C /source .
   docker run --rm -v redis_data:/source -v $BACKUP_DIR:/backup ubuntu tar -czf /backup/redis-$BACKUP_DATE.tar.gz -C /source .
   docker run --rm -v grafana_data:/source -v $BACKUP_DIR:/backup ubuntu tar -czf /backup/grafana-$BACKUP_DATE.tar.gz -C /source .
   
   # Restart services
   docker-compose -f docker-compose.prod.yml start
   
   # Sync to S3
   aws s3 sync $BACKUP_DIR s3://gplus-backups/volumes/
   
   # Clean up old backups (keep 7 days)
   find $BACKUP_DIR -type f -name "*.tar.gz" -mtime +7 -delete
   ```

### Monitoring and Maintenance

1. **Health Checks**:

   Set up an external monitoring service (like UptimeRobot or Pingdom) to check:
   - Frontend availability: https://app.gplusrecycling.com
   - Backend API: https://api.gplusrecycling.com/health

2. **Log Management**:
   ```bash
   # Create log management script (rotate-logs.sh)
   #!/bin/bash
   cd /opt/gplus-app
   
   # View logs
   docker-compose -f docker-compose.prod.yml logs > app-logs-$(date +%Y-%m-%d).log
   
   # Rotate container logs
   docker-compose -f docker-compose.prod.yml exec backend sh -c "find /app/logs -type f -name '*.log' -mtime +30 -delete"
   ```

3. **System Updates**:
   ```bash
   # Create update script (system-update.sh)
   #!/bin/bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Update docker images
   cd /opt/gplus-app
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   
   # Clean up old images
   docker image prune -a -f --filter "until=24h"
   ```

## Deployment Workflow

### Initial Production Deployment

1. **Prepare Server**:
   - Follow the Server Setup instructions above
   - Configure DNS entries for all domains
   - Set up SSL certificates

2. **Configure Environment**:
   - Create all required environment files
   - Configure secrets in HashiCorp Vault or similar

3. **Deploy Infrastructure**:
   ```bash
   cd /opt/gplus-app
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Verify Deployment**:
   - Check if all services are running:
     ```bash
     docker-compose -f docker-compose.prod.yml ps
     ```
   - Access application at https://app.gplusrecycling.com
   - Verify API endpoints at https://api.gplusrecycling.com/docs
   - Check monitoring at https://monitoring.gplusrecycling.com

### Continuous Deployment Process

1. **Create Release**:
   - Tag a new version in GitHub: `v1.2.3`
   - This triggers the production deployment workflow

2. **Automated Deployment**:
   - GitHub Actions builds and tests the code
   - Docker images are pushed to registry
   - Deployment script runs on production server
   - New version is deployed with zero downtime

3. **Post-Deployment Verification**:
   - Automated health checks run
   - Notification sent to Slack when deployment completes
   - Manual verification of key functionality

### Rollback Procedure

In case of deployment issues:

1. **Immediate Rollback**:
   ```bash
   cd /opt/gplus-app
   
   # Roll back to previous tag
   export TAG=v1.2.2
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Database Rollback** (if needed):
   ```bash
   # Restore database from backup
   cd /opt/gplus-app
   docker-compose -f docker-compose.prod.yml exec db sh -c 'psql -U postgres -d gplus_prod < /backups/backup-YYYY-MM-DD-HH-MM.sql'
   ```

## Security Considerations

1. **Regular Security Scanning**:
   - Run weekly security scans using OWASP ZAP
   - Configure automated vulnerability scanning
   - Review Docker image security with Trivy

2. **SSL/TLS Configuration**:
   - Use strong SSL/TLS settings
   - Configure HSTS headers
   - Regularly update certificates
   - Monitor certificate expiration

3. **Network Security**:
   - Restrict access to admin interfaces
   - Use IP whitelisting for sensitive endpoints
   - Implement rate limiting
   - Configure firewall rules

4. **Access Management**:
   - Use least privilege principle for all accounts
   - Rotate credentials regularly
   - Implement MFA for admin access
   - Audit user access regularly

## Conclusion

This production deployment guide provides a comprehensive framework for securely deploying and maintaining the G+ Recycling App in production. Following these practices ensures a secure, reliable, and maintainable production environment.

For additional information, refer to:
- [CI/CD Pipeline Documentation](./CI_CD_PIPELINE.md)
- [Security Guide](./SECURITY_GUIDE.md)
- [Monitoring and Alerting](./MONITORING_AND_ALERTING.md)