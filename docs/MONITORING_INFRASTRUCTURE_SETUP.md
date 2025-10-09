# G+ Recycling App - Monitoring Infrastructure

This document provides a summary of the monitoring and alerting infrastructure for the G+ Recycling App, including how it was set up and how to use it.

## Monitoring Stack Components

The G+ Recycling App monitoring stack consists of:

1. **Prometheus**: Time series database for storing metrics
2. **Grafana**: Visualization platform for metrics and alerts
3. **AlertManager**: Alert handling and routing
4. **Exporters**: Components that collect metrics from various services:
   - Node Exporter: System metrics
   - Postgres Exporter: Database metrics
   - Redis Exporter: Cache metrics
   - NGINX Exporter: Web server metrics

## Infrastructure Setup

### Directory Structure

The monitoring infrastructure is organized as follows:

```
GplusApp/
├── prometheus.yml          # Main Prometheus configuration
├── alerts/                 # Alert rule definitions
│   ├── backend_alerts.yml
│   ├── database_alerts.yml
│   ├── nginx_alerts.yml
│   └── redis_alerts.yml
├── alertmanager/
│   └── config.yml          # AlertManager configuration
└── grafana/
    └── provisioning/
        ├── dashboards/     # Dashboard definitions and provider config
        │   ├── dashboard.yml
        │   ├── overview-dashboard.json
        │   ├── api-performance-dashboard.json
        │   ├── database-performance-dashboard.json
        │   └── redis-performance-dashboard.json
        └── datasources/    # Data source configurations
            └── datasource.yml
```

### Container Configuration

The monitoring services are configured in `docker-compose.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus:v2.45.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts:/etc/prometheus/rules
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    ports:
      - "9090:9090"
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:v0.25.0
    volumes:
      - ./alertmanager:/etc/alertmanager
    command:
      - '--config.file=/etc/alertmanager/config.yml'
      - '--storage.path=/alertmanager'
    ports:
      - "9093:9093"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:9.3.6
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=securepassword
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    ports:
      - "3000:3000"
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:v1.6.0
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    restart: unless-stopped

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:v0.12.0
    environment:
      - DATA_SOURCE_NAME=postgresql://postgres:password@postgres:5432/gplus?sslmode=disable
    ports:
      - "9187:9187"
    restart: unless-stopped

  redis-exporter:
    image: oliver006/redis_exporter:v1.48.0
    environment:
      - REDIS_ADDR=redis://redis:6379
    ports:
      - "9121:9121"
    restart: unless-stopped

  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:0.11.0
    command:
      - '-nginx.scrape-uri=http://nginx:8080/stub_status'
    ports:
      - "9113:9113"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

## Alert Rules

Alert rules are defined in YAML files in the `alerts` directory:

1. **Backend Alerts** (`backend_alerts.yml`):
   - API response time thresholds
   - Error rate monitoring
   - Service availability
   - Request queue monitoring
   - Resource utilization

2. **Database Alerts** (`database_alerts.yml`):
   - Connection pooling limits
   - Disk space monitoring
   - Query performance
   - Dead tuples accumulation
   - Replication lag monitoring

3. **Redis Alerts** (`redis_alerts.yml`):
   - Memory utilization
   - Connection limits
   - Cache hit ratio
   - Eviction rate monitoring
   - Command latency

4. **NGINX Alerts** (`nginx_alerts.yml`):
   - Connection limits
   - Error rate monitoring
   - Request throughput
   - SSL handshake failures
   - Service availability

## Dashboards

Four main dashboards have been created to visualize different aspects of the system:

1. **Overview Dashboard**: General system health
2. **API Performance Dashboard**: API metrics and performance
3. **Database Performance Dashboard**: PostgreSQL metrics
4. **Redis Performance Dashboard**: Cache performance metrics

## Using the Monitoring Stack

### Accessing Monitoring Tools

- **Prometheus**: [http://localhost:9090](http://localhost:9090)
- **Grafana**: [http://localhost:3000](http://localhost:3000) (default credentials: admin/securepassword)
- **AlertManager**: [http://localhost:9093](http://localhost:9093)

### Common Monitoring Tasks

#### Checking System Health

1. Open the Overview Dashboard in Grafana
2. Review the status indicators for all services
3. Check for any active alerts in the alerts panel

#### Investigating Performance Issues

1. Identify the affected component (API, database, Redis, NGINX)
2. Open the corresponding dashboard
3. Look for metrics that deviate from normal patterns
4. Check logs for related errors or warnings
5. Correlate issues across different components

#### Alert Response

1. When an alert is triggered, acknowledge it in AlertManager
2. Follow the incident response procedure in `ALERTS.md`
3. Use Grafana dashboards to investigate the issue
4. Apply fixes or mitigations
5. Document the incident and resolution

## Maintenance and Updates

### Updating Alert Rules

1. Edit the appropriate file in the `alerts` directory
2. Reload Prometheus configuration:
   ```bash
   curl -X POST http://localhost:9090/-/reload
   ```

### Adding New Metrics

1. Update the relevant exporter configuration
2. Update Prometheus scrape configurations in `prometheus.yml`
3. Create new panels or dashboards in Grafana to visualize the metrics

### Creating Custom Dashboards

1. Use the Grafana UI to design new dashboards
2. Export the dashboard to JSON
3. Add the JSON file to `grafana/provisioning/dashboards/`
4. Update `dashboard.yml` if necessary

## Conclusion

The monitoring and alerting infrastructure provides comprehensive visibility into the G+ Recycling App's performance and health. By following the best practices and procedures outlined in this document and related guides, the team can ensure high availability and optimal performance of the application.