# Monitoring Stack Setup Guide

This guide explains how to set up and run the complete monitoring infrastructure for the GplusAPP project.

## Overview

The monitoring stack includes:
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Alertmanager**: Alert routing and management
- **Loki**: Log aggregation (optional)

## Prerequisites

- Docker and Docker Compose installed
- Application running (backend and frontend)
- Ports available: 9090 (Prometheus), 3001 (Grafana), 9093 (Alertmanager)

## Quick Start

### 1. Using Docker Compose

Create a `docker-compose.monitoring.yml` file in the project root:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: gplus_prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts:/etc/prometheus/alerts
      - prometheus-data:/prometheus
    networks:
      - monitoring
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: gplus_grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    networks:
      - monitoring
    restart: unless-stopped
    depends_on:
      - prometheus

  alertmanager:
    image: prom/alertmanager:latest
    container_name: gplus_alertmanager
    command:
      - '--config.file=/etc/alertmanager/config.yml'
      - '--storage.path=/alertmanager'
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/config.yml:/etc/alertmanager/config.yml
      - alertmanager-data:/alertmanager
    networks:
      - monitoring
    restart: unless-stopped

  # Optional: Loki for log aggregation
  loki:
    image: grafana/loki:latest
    container_name: gplus_loki
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - loki-data:/loki
    networks:
      - monitoring
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:
  alertmanager-data:
  loki-data:

networks:
  monitoring:
    driver: bridge
```

### 2. Start the Monitoring Stack

```bash
# Start all monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Check status
docker-compose -f docker-compose.monitoring.yml ps

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f
```

### 3. Access the Services

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Alertmanager**: http://localhost:9093

## Configuration

### Prometheus Configuration

The `prometheus.yml` file is already configured in your project root. Key sections:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

# Alert rules
rule_files:
  - "alerts/*.yml"

# Scrape configurations
scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['host.docker.internal:8000']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['host.docker.internal:5432']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['host.docker.internal:6379']
```

### Alert Rules

Alert rules are defined in the `alerts/` directory:

- `backend_alerts.yml`: Backend API alerts
- `database_alerts.yml`: PostgreSQL alerts
- `redis_alerts.yml`: Redis cache alerts
- `nginx_alerts.yml`: NGINX alerts

### Alertmanager Configuration

Edit `alertmanager/config.yml` to configure alert routing:

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'

receivers:
  - name: 'default'
    email_configs:
      - to: 'alerts@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'your-email@gmail.com'
        auth_password: 'your-app-password'
```

## Grafana Setup

### 1. First Login

1. Navigate to http://localhost:3001
2. Login with `admin/admin`
3. Change the default password when prompted

### 2. Add Prometheus Data Source

1. Go to **Configuration** → **Data Sources**
2. Click **Add data source**
3. Select **Prometheus**
4. Set URL to `http://prometheus:9090`
5. Click **Save & Test**

### 3. Import Dashboards

#### Option A: Import Pre-built Dashboards

1. Go to **Dashboards** → **Import**
2. Enter dashboard ID or upload JSON:
   - **Node Exporter**: 1860
   - **PostgreSQL**: 9628
   - **Redis**: 11835
   - **NGINX**: 12708

#### Option B: Create Custom Dashboard

See the `grafana/` directory for custom dashboard JSON files.

### 4. Configure Alerts

1. Go to **Alerting** → **Alert rules**
2. Create new alert rules based on your metrics
3. Configure notification channels

## Backend Integration

### Enable Prometheus Metrics

The backend already has Prometheus instrumentation. Ensure it's enabled:

```python
# backend/app/main.py
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

# Enable Prometheus metrics
Instrumentator().instrument(app).expose(app)
```

### Custom Metrics

Add custom business metrics:

```python
from prometheus_client import Counter, Histogram

# Example metrics
pickup_requests_total = Counter(
    'pickup_requests_total',
    'Total number of pickup requests'
)

points_awarded_total = Counter(
    'points_awarded_total',
    'Total points awarded to users'
)
```

## Monitoring Best Practices

### 1. Key Metrics to Monitor

**Application Metrics:**
- Request rate and latency
- Error rates (4xx, 5xx)
- Active users
- Database query performance

**Infrastructure Metrics:**
- CPU and memory usage
- Disk I/O
- Network traffic
- Container health

**Business Metrics:**
- User registrations
- Pickup requests
- Points awarded
- Active companies

### 2. Alert Thresholds

Configure alerts for:
- API response time > 1s
- Error rate > 5%
- CPU usage > 80%
- Memory usage > 85%
- Disk usage > 90%
- Database connections > 80% of max

### 3. Dashboard Organization

Create separate dashboards for:
- **Overview**: High-level system health
- **Backend**: API performance and errors
- **Database**: Query performance and connections
- **Infrastructure**: Server resources
- **Business**: KPIs and user metrics

## Troubleshooting

### Prometheus Not Scraping Targets

1. Check if targets are accessible:
   ```bash
   curl http://localhost:8000/metrics
   ```

2. Verify Prometheus configuration:
   ```bash
   docker exec gplus_prometheus promtool check config /etc/prometheus/prometheus.yml
   ```

3. Check Prometheus logs:
   ```bash
   docker logs gplus_prometheus
   ```

### Grafana Can't Connect to Prometheus

1. Ensure Prometheus is running:
   ```bash
   docker ps | grep prometheus
   ```

2. Test connection from Grafana container:
   ```bash
   docker exec gplus_grafana curl http://prometheus:9090/api/v1/status/config
   ```

### Alerts Not Firing

1. Check alert rules in Prometheus UI: http://localhost:9090/alerts
2. Verify Alertmanager configuration
3. Check Alertmanager logs:
   ```bash
   docker logs gplus_alertmanager
   ```

## Maintenance

### Backup Grafana Dashboards

```bash
# Export all dashboards
docker exec gplus_grafana grafana-cli admin export-dashboard > dashboards-backup.json
```

### Clean Up Old Metrics

Prometheus automatically manages retention. Default is 15 days. To change:

```yaml
# In docker-compose.monitoring.yml
command:
  - '--storage.tsdb.retention.time=30d'
```

### Update Services

```bash
# Pull latest images
docker-compose -f docker-compose.monitoring.yml pull

# Restart services
docker-compose -f docker-compose.monitoring.yml up -d
```

## Production Considerations

1. **Security:**
   - Change default Grafana password
   - Enable HTTPS
   - Restrict access with firewall rules
   - Use authentication for Prometheus

2. **High Availability:**
   - Run multiple Prometheus instances
   - Use Thanos for long-term storage
   - Set up Grafana in HA mode

3. **Scalability:**
   - Use remote storage for Prometheus
   - Implement metric federation
   - Optimize scrape intervals

4. **Backup:**
   - Regular backups of Grafana dashboards
   - Backup Prometheus data
   - Version control alert rules

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [FastAPI Prometheus Instrumentator](https://github.com/trallnag/prometheus-fastapi-instrumentator)

## Support

For issues or questions:
1. Check the logs: `docker-compose -f docker-compose.monitoring.yml logs`
2. Review Prometheus targets: http://localhost:9090/targets
3. Consult the [MONITORING_AND_ALERTING.md](./MONITORING_AND_ALERTING.md) guide

---

**Last Updated**: December 2024
**Version**: 1.0
