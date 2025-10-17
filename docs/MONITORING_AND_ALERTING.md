# G+ Recycling App - Monitoring and Alerting Guide

This document provides a comprehensive guide to the monitoring and alerting infrastructure set up for the G+ Recycling App, expanding on the information in `ALERTS.md`.

## Monitoring Architecture

```mermaid
graph TD
    subgraph "Application Components"
        Backend["Backend API\n(FastAPI)"]
        Database["PostgreSQL"]
        Redis["Redis Cache"]
        NGINX["NGINX"]
    end

    subgraph "Metrics Exporters"
        BE[Backend Metrics]
        PE[PostgreSQL Exporter]
        RE[Redis Exporter]
        NE[NGINX Exporter]
        NODE[Node Exporter]
    end

    subgraph "Monitoring Stack"
        Prometheus["Prometheus\n(Metrics Collection)"]
        AlertManager["AlertManager\n(Alert Handling)"]
        Grafana["Grafana\n(Dashboards)"]
    end

    subgraph "Notification Channels"
        Email["Email Alerts"]
        Slack["Slack Channel"]
        PagerDuty["PagerDuty"]
    end

    Backend --> BE
    Database --> PE
    Redis --> RE
    NGINX --> NE

    BE --> Prometheus
    PE --> Prometheus
    RE --> Prometheus
    NE --> Prometheus
    NODE --> Prometheus

    Prometheus --> AlertManager
    Prometheus --> Grafana

    AlertManager --> Email
    AlertManager --> Slack
    AlertManager --> PagerDuty
```

## Metrics Collection

### Application Metrics

The backend API exposes the following metrics:

- `api_http_requests_total`: Total number of HTTP requests by endpoint and status code
- `api_request_duration_seconds`: Histogram of request durations
- `api_request_size_bytes`: Histogram of request sizes
- `api_response_size_bytes`: Histogram of response sizes
- `business_metrics_pickups_created_total`: Counter for created pickup requests
- `business_metrics_user_registrations_total`: Counter for user registrations
- `business_metrics_points_awarded_total`: Counter for awarded recycling points

### System Metrics

System-level metrics are collected using Node Exporter:

- CPU utilization
- Memory usage
- Disk I/O
- Network traffic
- File system usage

### Database Metrics

PostgreSQL metrics are collected using postgres-exporter:

- Connection counts
- Query performance
- Transaction rates
- Table statistics
- Index usage

### Redis Metrics

Redis metrics are collected using redis-exporter:

- Memory usage
- Key counts
- Command execution rates
- Connected clients
- Cache hit ratio

### NGINX Metrics

NGINX metrics are collected using nginx-exporter:

- Active connections
- Request rates
- Response times
- Status code distribution

## Alert Rules

As referenced in `ALERTS.md`, our system implements the following key alert categories:

- **Latency (95th percentile)**: Detecting slow API responses
- **5xx Error Rate**: Monitoring server errors
- **DB Connections**: Watching database connection pool usage
- **Redis Memory**: Tracking Redis memory consumption
- **Container Restarts**: Identifying unstable services

Detailed alert definitions can be found in `grafana/provisioning/alerting/alert-rules.yaml`.

### Backend API Alerts

- **HighApiResponseTime**: 95th percentile response time above 2s for 5 minutes
- **CriticalApiResponseTime**: 95th percentile response time above 5s for 2 minutes
- **HighErrorRate**: Error rate above 5% for 5 minutes
- **CriticalErrorRate**: Error rate above 10% for 2 minutes
- **ApiServiceDown**: API service unreachable for 1 minute
- **LongTaskQueueBacklog**: Over 100 tasks queued for more than 10 minutes

### Database Alerts

- **HighDatabaseConnections**: More than 100 connections for 5 minutes
- **CriticalDatabaseConnections**: More than 150 connections for 2 minutes
- **LowDatabaseDiskSpace**: Disk usage above 85% for 5 minutes
- **SlowQueries**: Queries taking more than 5 minutes to execute

### Redis Alerts

- **HighRedisMemoryUsage**: Memory usage above 85% for 5 minutes
- **CriticalRedisMemoryUsage**: Memory usage above 95% for 2 minutes
- **HighRedisKeyEvictions**: More than 10 evictions per second for 5 minutes
- **LowRedisHitRatio**: Cache hit ratio below 50% for 30 minutes

### System Alerts

- **HighCpuUsage**: CPU usage above 80% for 5 minutes
- **HighMemoryUsage**: Memory usage above 85% for 5 minutes
- **DiskSpaceLow**: Disk space less than 15% free for 5 minutes
- **HighLoad**: System load averages above 4 for 15 minutes

## Alert Management

Alerts are managed through AlertManager, which provides:

- **Alert Grouping**: Related alerts are grouped to reduce notification noise
- **Inhibition**: Less severe alerts are suppressed when a more severe alert is active
- **Silencing**: Alerts can be temporarily silenced during maintenance
- **Time-based Routing**: Different routing based on time of day or day of week

The AlertManager configuration is defined in `alertmanager/config.yml`:

```yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alertmanager@gplus.com'
  smtp_auth_username: 'alertmanager'
  smtp_auth_password: 'password'
  slack_api_url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

route:
  group_by: ['alertname', 'job', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'team-email'
  routes:
  - match:
      severity: critical
    receiver: 'pagerduty'
    continue: true
  - match:
      severity: warning
    receiver: 'slack-notifications'
    continue: true
  - match:
      category: database
    receiver: 'database-team'
  - match:
      category: api
    receiver: 'backend-team'

inhibit_rules:
- source_match:
    severity: 'critical'
  target_match:
    severity: 'warning'
  equal: ['alertname', 'job']

receivers:
- name: 'team-email'
  email_configs:
  - to: 'team@gplus.com'
    send_resolved: true

- name: 'slack-notifications'
  slack_configs:
  - channel: '#alerts'
    send_resolved: true
    title: '{{ template "slack.default.title" . }}'
    text: '{{ template "slack.default.text" . }}'

- name: 'pagerduty'
  pagerduty_configs:
  - service_key: '<pagerduty-service-key>'
    send_resolved: true

- name: 'database-team'
  email_configs:
  - to: 'db-team@gplus.com'
    send_resolved: true
  slack_configs:
  - channel: '#db-alerts'
    send_resolved: true

- name: 'backend-team'
  email_configs:
  - to: 'backend-team@gplus.com'
    send_resolved: true
  slack_configs:
  - channel: '#backend-alerts'
    send_resolved: true
```

### Notification Channels

Alerts are routed to different notification channels based on severity and component:

#### Email Notifications

Email notifications are sent for all alerts and provide detailed information:

- Alert name and description
- Affected service or component
- Alert severity and status
- Timestamps for when the alert was triggered and resolved
- Links to relevant Grafana dashboards

Email notifications are configured to:
- Send to specific team distribution lists based on the alert category
- Include resolved notifications to inform teams when issues are fixed
- Group related alerts to reduce email volume

#### Slack Notifications

Slack notifications provide real-time alerts in dedicated channels:

- `#alerts`: General alerts channel for all warning-level notifications
- `#db-alerts`: Database-specific alerts
- `#backend-alerts`: API and backend service alerts
- `#critical-alerts`: High-priority alerts requiring immediate attention

Slack notifications include:
- Interactive buttons to acknowledge alerts
- Links to runbooks and dashboards
- Graphs showing the metric that triggered the alert
- Color-coding based on severity (green, yellow, red)

#### PagerDuty Integration

Critical alerts are routed to PagerDuty for incident management:

- Immediate notification via phone call, SMS, and mobile push notifications
- Escalation policies to ensure alerts are not missed
- Incident tracking and resolution workflow
- On-call rotation management
- Post-incident reviews

PagerDuty is configured with:
- Service-specific routing based on the alert category
- Automatic escalation after defined time thresholds
- Integration with the incident response process documented in `ALERTS.md`

## Dashboards

Grafana dashboards are provided for visualizing metrics:

### Overview Dashboard

The main dashboard showing key system health metrics:

- API request rates and response times
- Error rates by endpoint
- Database connection count and query performance
- Redis memory usage and cache hit ratio
- Business metrics (pickups created, users registered, points awarded)

### API Performance Dashboard

Detailed API performance metrics:

- Request rates by endpoint
- Response time distributions
- Error rates by endpoint and status code
- Top slowest endpoints

This dashboard provides deep insight into API performance, allowing you to:

- Identify slow endpoints that need optimization
- Monitor error rates in real-time
- Track business metrics like pickup requests and user registrations
- View request distribution patterns to understand usage

Key panels include:
1. **API Request Rate by Endpoint** - Shows the volume of requests to different API endpoints
2. **API Response Time (95th percentile)** - Displays the response time that 95% of requests are faster than
3. **Overall Error Rate** - Shows the percentage of requests resulting in 5xx errors
4. **Error Count by Endpoint** - Breaks down errors by specific endpoint
5. **Request Distribution** - Shows which endpoints are most frequently used
6. **Top Slowest Endpoints** - Lists the endpoints with the highest response times

### Database Dashboard

PostgreSQL monitoring:

- Connection pooling metrics
- Query performance and slow queries
- Table and index statistics
- Transaction rates and durations

This dashboard helps database administrators monitor PostgreSQL performance with:

- Active connection counts and states
- Database operation rates (inserts, updates, deletes, selects)
- Transaction duration tracking
- Cache hit ratio monitoring
- Dead tuple identification for vacuum planning
- Slow query analysis

Key panels include:
1. **Active Connections** - Shows the number of active database connections
2. **Disk Usage** - Monitors database disk space utilization
3. **Connection States** - Tracks active, idle, and idle-in-transaction connections
4. **Database Operations** - Shows the rate of row operations (fetched, inserted, updated, deleted)
5. **Transaction Duration** - Monitors the length of database transactions
6. **Cache Hit Ratio** - Shows the effectiveness of the database buffer cache
7. **Top Tables with Dead Tuples** - Identifies tables needing vacuum
8. **Top Slow Queries** - Lists the slowest SQL queries for optimization

### Redis Dashboard

Redis monitoring:

- Memory usage and fragmentation
- Key space statistics
- Command execution rates
- Network metrics

This dashboard is essential for monitoring the Redis cache:

- Memory utilization and limiting
- Cache hit/miss ratio tracking
- Client connection monitoring
- Command throughput analysis
- Key eviction and expiration rates

Key panels include:
1. **Connected Clients** - Shows the number of clients connected to Redis
2. **Memory Usage** - Displays Redis memory utilization as a percentage
3. **Cache Hit Ratio** - Shows the effectiveness of the cache
4. **Blocked Clients** - Monitors clients blocked on Redis operations
5. **Memory Usage Over Time** - Tracks memory consumption trends
6. **Cache Hits vs Misses** - Compares successful vs unsuccessful cache lookups
7. **Command Execution Rate** - Shows the throughput of different Redis commands
8. **Key Evictions and Expirations** - Monitors key removal due to memory limits or TTL
9. **Keys per Database** - Shows the distribution of keys across Redis databases

## Accessing Monitoring Tools

- **Prometheus**: [http://localhost:9090](http://localhost:9090)
- **Grafana**: [http://localhost:3000](http://localhost:3000) (default credentials: admin/securepassword)
- **AlertManager**: [http://localhost:9093](http://localhost:9093)

## Setting Up Monitoring

The monitoring stack is included in the docker-compose configuration. To start it:

```bash
docker-compose up -d prometheus grafana alertmanager node-exporter postgres-exporter redis-exporter nginx-exporter
```

### Prometheus Configuration

Prometheus is configured in `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - "/etc/prometheus/rules/backend_alerts.yml"
  - "/etc/prometheus/rules/database_alerts.yml"
  - "/etc/prometheus/rules/nginx_alerts.yml"
  - "/etc/prometheus/rules/redis_alerts.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'api'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['api:8000']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

### Grafana Setup

Grafana is configured with provisioning to automatically set up datasources and dashboards:

1. **Datasources Configuration**:
   
   File: `grafana/provisioning/datasources/datasource.yml`
   ```yaml
   apiVersion: 1

   datasources:
     - name: Prometheus
       type: prometheus
       url: http://prometheus:9090
       access: proxy
       isDefault: true
   ```

2. **Dashboard Configuration**:

   File: `grafana/provisioning/dashboards/dashboard.yml`
   ```yaml
   apiVersion: 1

   providers:
     - name: 'default'
       orgId: 1
       folder: ''
       type: file
       disableDeletion: false
       updateIntervalSeconds: 10
       allowUiUpdates: true
       options:
         path: /var/lib/grafana/dashboards
         foldersFromFilesStructure: true
   ```

3. **Dashboard Files**:
   
   Dashboard JSON files are stored in `grafana/provisioning/dashboards/`:
   - `overview-dashboard.json`: Main system overview
   - `api-performance-dashboard.json`: Detailed API metrics
   - `database-performance-dashboard.json`: PostgreSQL performance metrics
   - `redis-performance-dashboard.json`: Redis cache metrics

## Configuring Alert Rules

Alert rules are defined in Prometheus format and stored in the `prometheus/rules` directory. To add a new alert rule:

1. Create a new YAML file in the `prometheus/rules` directory
2. Define your alert rule using Prometheus's alert rule syntax
3. Add the file to the `rule_files` section in `prometheus.yml`
4. Restart Prometheus to apply the changes

Example alert rule:

```yaml
groups:
  - name: api-alerts
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for the last 5 minutes"
```

## Extending the Monitoring

To add new metrics:

1. Identify the metrics you want to collect
2. Instrument your code using the Prometheus client library
3. Add the metrics to the appropriate exporter
4. Update dashboards to visualize the new metrics
5. Create alert rules if needed

## Incident Response Process

When an alert is triggered, follow the incident response process outlined in `ALERTS.md`:

1. Acknowledge the alert in AlertManager or Slack
2. Investigate the issue using Grafana dashboards
3. Apply immediate mitigation if possible
4. Document the incident using the Incident Report Template
5. Implement preventive actions

## Recommended Operational Practices

- Review dashboards daily to identify trends and potential issues
- Tune alert thresholds based on observed patterns to reduce false positives
- Document incident responses and update alert rules accordingly
- Periodically test alert delivery to ensure notifications are working
- Review alert history monthly to identify recurring issues

## Troubleshooting Common Issues with Monitoring

### High API Response Times

If you receive alerts about high API response times:

1. Check the API Performance Dashboard to identify affected endpoints
2. Look at the database dashboard for slow queries or connection issues
3. Check Redis dashboard for cache hit ratio (low hit ratio could mean ineffective caching)
4. Review recent code deployments that might have affected performance
5. Examine container logs for application errors:
   ```bash
   docker-compose logs --tail=100 api
   ```
6. Consider scaling the service if it's a load issue:
   ```bash
   docker-compose up -d --scale api=3
   ```

### Database Connection Pool Saturation

If database connections are near capacity:

1. Check the Database Performance Dashboard for active queries
2. Look for long-running transactions that might be holding connections
3. Examine the API dashboard for unusual request patterns
4. Review application code for connection leaks
5. Consider increasing the connection pool size temporarily:
   ```sql
   ALTER SYSTEM SET max_connections = 200;
   SELECT pg_reload_conf();
   ```
6. Restart problematic services that might be leaking connections

### High Redis Memory Usage

If Redis memory utilization is approaching the limit:

1. Check the Redis Dashboard for key space metrics
2. Use Redis CLI to identify large keys:
   ```bash
   docker-compose exec redis redis-cli --bigkeys
   ```
3. Look for unexpected patterns in key creation or large values
4. Consider increasing Redis memory temporarily:
   ```bash
   docker-compose exec redis redis-cli CONFIG SET maxmemory 512mb
   ```
5. Review caching strategy for optimization opportunities

### Error Rate Spikes

If error rates suddenly increase:

1. Check application logs for exceptions:
   ```bash
   docker-compose logs --tail=200 api | grep ERROR
   ```
2. Look at the API Performance Dashboard to see which endpoints are affected
3. Review recent deployments for potential causes
4. Check external dependencies (database, Redis, third-party services)
5. Consider rolling back recent changes if necessary

## Further Reading

- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [PostgreSQL Monitoring Best Practices](https://www.postgresql.org/docs/current/monitoring.html)
- [Redis Monitoring Documentation](https://redis.io/topics/monitoring)
