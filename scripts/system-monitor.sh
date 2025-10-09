#!/bin/bash

# System Monitoring and Maintenance Script for G+ Recycling App
# This script performs various system health checks, maintenance tasks, and monitoring
# It can be scheduled to run periodically via cron

# Exit on error
set -e

# Configuration
DEPLOY_DIR="/opt/gplus-app"
LOG_DIR="$DEPLOY_DIR/logs"
ENV_FILE="$DEPLOY_DIR/.env"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
ALERT_EMAIL=${ALERT_EMAIL:-"admin@gplusrecycling.com"}
DISK_THRESHOLD=${DISK_THRESHOLD:-85} # Alert when disk usage is over 85%
MEM_THRESHOLD=${MEM_THRESHOLD:-85}  # Alert when memory usage is over 85%
CPU_THRESHOLD=${CPU_THRESHOLD:-90}  # Alert when CPU usage is over 90%

# Create required directories
mkdir -p "$LOG_DIR"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/system-monitoring-$(date '+%Y-%m-%d').log"
}

# Send email alert function
send_alert() {
    local subject="$1"
    local message="$2"
    
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "[G+ ALERT] $subject" "$ALERT_EMAIL"
        log "Alert email sent to $ALERT_EMAIL: $subject"
    else
        log "WARNING: 'mail' command not found. Could not send alert email."
        log "ALERT: $subject - $message"
    fi
}

# Send Slack alert function
send_slack_alert() {
    local subject="$1"
    local message="$2"
    local webhook_url=""
    
    # Try to get Slack webhook URL from environment file
    if [ -f "$ENV_FILE" ]; then
        webhook_url=$(grep SLACK_WEBHOOK_URL "$ENV_FILE" | cut -d '=' -f2)
    fi
    
    if [ -n "$webhook_url" ] && command -v curl &> /dev/null; then
        # Format the message for Slack JSON payload
        local payload="{\"text\":\":warning: *$subject*\n$message\"}"
        
        # Send to Slack
        curl -s -X POST -H 'Content-type: application/json' --data "$payload" "$webhook_url"
        log "Alert sent to Slack: $subject"
    else
        log "WARNING: Slack webhook URL not found or curl not available. Could not send Slack alert."
    fi
}

# Check if Docker is running
check_docker() {
    log "Checking Docker service status..."
    
    if ! docker info > /dev/null 2>&1; then
        log "ERROR: Docker is not running!"
        send_alert "Docker service down" "The Docker service on $(hostname) is not running. Please investigate."
        send_slack_alert "Docker service down" "The Docker service on $(hostname) is not running. Please investigate."
        return 1
    else
        log "Docker service is running."
        return 0
    fi
}

# Check container health
check_containers() {
    log "Checking container health..."
    
    # Check if any containers are down
    local down_containers=$(docker-compose -f "$COMPOSE_FILE" ps --services --filter "status=stopped" 2>/dev/null)
    
    if [ -n "$down_containers" ]; then
        log "ERROR: The following containers are down: $down_containers"
        send_alert "Containers down" "The following containers are down on $(hostname): $down_containers"
        send_slack_alert "Containers down" "The following containers are down on $(hostname): $down_containers"
    else
        log "All containers are running."
    fi
    
    # Check container health checks
    local unhealthy_containers=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" 2>/dev/null)
    
    if [ -n "$unhealthy_containers" ]; then
        log "ERROR: The following containers are unhealthy: $unhealthy_containers"
        send_alert "Unhealthy containers" "The following containers are unhealthy on $(hostname): $unhealthy_containers"
        send_slack_alert "Unhealthy containers" "The following containers are unhealthy on $(hostname): $unhealthy_containers"
    else
        log "All container health checks are passing."
    fi
}

# Check disk usage
check_disk_usage() {
    log "Checking disk usage..."
    
    # Get disk usage percentage for the root filesystem
    local disk_usage=$(df -h / | grep -v Filesystem | awk '{print $5}' | sed 's/%//')
    
    log "Current disk usage: ${disk_usage}%"
    
    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        log "WARNING: Disk usage is above threshold (${disk_usage}% > ${DISK_THRESHOLD}%)"
        send_alert "High disk usage" "Disk usage on $(hostname) is at ${disk_usage}% (threshold: ${DISK_THRESHOLD}%)"
        send_slack_alert "High disk usage" "Disk usage on $(hostname) is at ${disk_usage}% (threshold: ${DISK_THRESHOLD}%)"
    fi
    
    # Check Docker disk usage
    log "Checking Docker disk usage..."
    docker system df -v | grep "Total" >> "$LOG_DIR/system-monitoring-$(date '+%Y-%m-%d').log"
}

# Check memory usage
check_memory_usage() {
    log "Checking memory usage..."
    
    # Get memory usage percentage
    local mem_usage=$(free | grep Mem | awk '{print int(($3/$2) * 100)}')
    
    log "Current memory usage: ${mem_usage}%"
    
    if [ "$mem_usage" -gt "$MEM_THRESHOLD" ]; then
        log "WARNING: Memory usage is above threshold (${mem_usage}% > ${MEM_THRESHOLD}%)"
        send_alert "High memory usage" "Memory usage on $(hostname) is at ${mem_usage}% (threshold: ${MEM_THRESHOLD}%)"
        send_slack_alert "High memory usage" "Memory usage on $(hostname) is at ${mem_usage}% (threshold: ${MEM_THRESHOLD}%)"
    fi
}

# Check CPU usage
check_cpu_usage() {
    log "Checking CPU usage..."
    
    # Get CPU usage percentage using top (averaged over 3 samples)
    local cpu_usage=$(top -bn2 | grep "Cpu(s)" | tail -n1 | awk '{print int($2 + $4)}')
    
    log "Current CPU usage: ${cpu_usage}%"
    
    if [ "$cpu_usage" -gt "$CPU_THRESHOLD" ]; then
        log "WARNING: CPU usage is above threshold (${cpu_usage}% > ${CPU_THRESHOLD}%)"
        send_alert "High CPU usage" "CPU usage on $(hostname) is at ${cpu_usage}% (threshold: ${CPU_THRESHOLD}%)"
        send_slack_alert "High CPU usage" "CPU usage on $(hostname) is at ${cpu_usage}% (threshold: ${CPU_THRESHOLD}%)"
    fi
}

# Check internet connectivity
check_internet_connectivity() {
    log "Checking internet connectivity..."
    
    if ping -c 3 google.com > /dev/null 2>&1; then
        log "Internet connectivity is available."
    else
        log "WARNING: Internet connectivity issue detected."
        send_alert "Internet connectivity issue" "Internet connectivity issue detected on $(hostname). Please investigate."
        send_slack_alert "Internet connectivity issue" "Internet connectivity issue detected on $(hostname). Please investigate."
    fi
}

# Check API health
check_api_health() {
    log "Checking API health..."
    
    # Try to reach the API health endpoint
    if curl -s http://localhost:8000/health | grep -q "ok"; then
        log "API health check passed."
    else
        log "WARNING: API health check failed."
        send_alert "API health check failed" "The API health check on $(hostname) is failing. Please investigate."
        send_slack_alert "API health check failed" "The API health check on $(hostname) is failing. Please investigate."
    fi
}

# Check for security updates
check_security_updates() {
    log "Checking for security updates..."
    
    if command -v apt &> /dev/null; then
        # For Debian/Ubuntu
        apt update -qq
        local updates=$(apt list --upgradable 2>/dev/null | grep -c "security")
        
        if [ "$updates" -gt 0 ]; then
            log "WARNING: $updates security updates are available."
            send_alert "Security updates available" "$updates security updates are available on $(hostname)."
            send_slack_alert "Security updates available" "$updates security updates are available on $(hostname)."
        else
            log "No security updates available."
        fi
    elif command -v yum &> /dev/null; then
        # For CentOS/RHEL
        local updates=$(yum check-update --security | grep -c "needed for security")
        
        if [ "$updates" -gt 0 ]; then
            log "WARNING: Security updates are available."
            send_alert "Security updates available" "Security updates are available on $(hostname)."
            send_slack_alert "Security updates available" "Security updates are available on $(hostname)."
        else
            log "No security updates available."
        fi
    fi
}

# Perform system maintenance
system_maintenance() {
    log "Running system maintenance tasks..."
    
    # Cleanup Docker resources
    log "Cleaning up Docker resources..."
    docker system prune -f --filter "until=24h"
    
    # Rotate logs
    log "Rotating logs..."
    find "$LOG_DIR" -name "*.log" -type f -mtime +14 -delete
    
    # Check and repair disk
    log "Checking disk for errors..."
    df -h >> "$LOG_DIR/system-monitoring-$(date '+%Y-%m-%d').log"
}

# Generate system report
generate_system_report() {
    local report_file="$LOG_DIR/system-report-$(date '+%Y-%m-%d').txt"
    log "Generating system report in $report_file..."
    
    {
        echo "======== G+ Recycling App System Report ========"
        echo "Date: $(date)"
        echo "Hostname: $(hostname)"
        echo ""
        
        echo "===== System Info ====="
        echo "Kernel: $(uname -r)"
        echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
        echo ""
        
        echo "===== Resource Usage ====="
        echo "CPU Usage:"
        top -bn1 | head -n 5
        echo ""
        
        echo "Memory Usage:"
        free -h
        echo ""
        
        echo "Disk Usage:"
        df -h
        echo ""
        
        echo "===== Docker Info ====="
        echo "Docker Version: $(docker --version)"
        echo ""
        
        echo "Docker Containers:"
        docker ps -a
        echo ""
        
        echo "Docker Images:"
        docker images
        echo ""
        
        echo "Docker Volumes:"
        docker volume ls
        echo ""
        
        echo "Docker Networks:"
        docker network ls
        echo ""
        
        echo "===== Container Resource Usage ====="
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
        echo ""
        
        echo "===== Recent Logs ====="
        echo "Last 10 lines of backend logs:"
        docker-compose -f "$COMPOSE_FILE" logs --tail 10 backend
        echo ""
        
        echo "Last 10 lines of frontend logs:"
        docker-compose -f "$COMPOSE_FILE" logs --tail 10 frontend
        echo ""
        
    } > "$report_file"
    
    log "System report generated: $report_file"
}

# Function to show usage
usage() {
    echo "G+ Recycling App System Monitoring and Maintenance"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  check-all        - Run all checks"
    echo "  check-docker     - Check Docker service"
    echo "  check-containers - Check container health"
    echo "  check-disk       - Check disk usage"
    echo "  check-memory     - Check memory usage"
    echo "  check-cpu        - Check CPU usage"
    echo "  check-internet   - Check internet connectivity"
    echo "  check-api        - Check API health"
    echo "  check-security   - Check for security updates"
    echo "  maintenance      - Perform system maintenance"
    echo "  report           - Generate system report"
    echo ""
    echo "Examples:"
    echo "  $0 check-all"
    echo "  $0 report"
    echo ""
    exit 1
}

# Main function
main() {
    log "Starting system monitoring and maintenance script..."
    
    check_docker
    check_containers
    check_disk_usage
    check_memory_usage
    check_cpu_usage
    check_internet_connectivity
    check_api_health
    check_security_updates
    system_maintenance
    generate_system_report
    
    log "System monitoring and maintenance completed."
}

# Check command
case "$1" in
    check-all)
        check_docker
        check_containers
        check_disk_usage
        check_memory_usage
        check_cpu_usage
        check_internet_connectivity
        check_api_health
        check_security_updates
        ;;
    check-docker)
        check_docker
        ;;
    check-containers)
        check_containers
        ;;
    check-disk)
        check_disk_usage
        ;;
    check-memory)
        check_memory_usage
        ;;
    check-cpu)
        check_cpu_usage
        ;;
    check-internet)
        check_internet_connectivity
        ;;
    check-api)
        check_api_health
        ;;
    check-security)
        check_security_updates
        ;;
    maintenance)
        system_maintenance
        ;;
    report)
        generate_system_report
        ;;
    *)
        if [ -z "$1" ]; then
            main
        else
            usage
        fi
        ;;
esac

exit 0