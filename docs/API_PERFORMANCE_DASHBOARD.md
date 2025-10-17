# API Performance Dashboard Guide

This document provides comprehensive information about the API Performance Dashboard, a tool for monitoring API performance, Redis metrics, and system health in the G+ Recycling application.

## Overview

The API Performance Dashboard is available in two forms:

1. **Admin UI Dashboard**: A simplified dashboard available within the application admin interface
2. **Grafana Dashboard**: A comprehensive monitoring dashboard for detailed technical analysis

This guide covers both implementations, with emphasis on the more feature-rich Grafana dashboard.

## Key Metrics Monitored

The API Performance Dashboard provides real-time monitoring of:

1. **API Response Times**: Track endpoint performance and identify bottlenecks
2. **Request Volumes**: Monitor traffic patterns across different endpoints
3. **Error Rates**: Track error frequencies by endpoint and status code
4. **Redis Cache Performance**: Analyze cache hit ratios and memory usage
5. **Business Metrics**: Monitor application usage patterns like pickups created and users registered
6. **System Health**: Get an overview of the health status of Redis, database, and API services

## Accessing the Dashboards

### Admin UI Dashboard

The simplified dashboard is available to administrators at `/admin/performance`. Users must have administrator privileges to access this page.

### Grafana Dashboard

The comprehensive Grafana dashboard provides detailed technical monitoring:

1. Access Grafana at [http://localhost:3000](http://localhost:3000) (or your configured Grafana URL)
2. Log in with your credentials (default: admin/securepassword)
3. Navigate to Dashboards → Browse
4. Select the "API Performance Dashboard" from the list
5. Use the time range selector in the top-right corner to adjust the view period

## Dashboard Features

### Admin UI Dashboard Features

#### Auto-refresh

The dashboard supports automatic refreshing of data at configurable intervals:

- No auto-refresh
- Every 10 seconds
- Every 30 seconds
- Every minute
- Every 5 minutes

You can also manually refresh the data using the "Refresh" button.

### System Health

This section provides a high-level overview of your system components:

- **Redis**: Connection status, latency, and health status
- **Database**: Connection status and performance metrics
- **API**: Overall API service health

Status indicators use color coding:

- 🟢 Green: Healthy
- 🟠 Orange: Degraded
- 🔴 Red: Unavailable

### Redis Memory Usage

This card displays:

- Memory usage gauge with visual indicators for pressure levels
- Used memory vs. total memory
- Memory fragmentation ratio
- Connected clients count
- Memory usage trend (increasing, decreasing, or stable)

Memory pressure levels are color-coded:

- Green: Low pressure (<60%)
- Yellow: Medium pressure (60-75%)
- Orange: High pressure (75-90%)
- Red: Critical pressure (>90%)

### API Performance

This section shows:

- Average API response time across all endpoints
- Overall cache hit ratio
- Requests per minute
- Top 3 endpoints by request volume

### Redis Key Pattern Usage

This chart visualizes:
- Memory usage by different Redis key patterns
- Percentage of total memory used by each pattern
- Total memory consumption

### Endpoint Performance Table

The detailed table at the bottom of the dashboard lists:
- All tracked API endpoints
- Average response time for each endpoint
- Cache hit ratio for each endpoint
- Total request count

## Troubleshooting

If the dashboard displays "Error loading metrics data", check:
1. Redis connection status
2. API server connectivity
3. Admin permissions

If specific metrics are missing, it might indicate that the Redis monitoring system needs additional configuration.

## Related Documents

- [Redis Monitoring Guide](./REDIS_MONITORING_GUIDE.md)
- [Enhanced Security Monitoring Guide](./ENHANCED_SECURITY_MONITORING_GUIDE.md)

## Support

For issues with the API Performance Dashboard, contact the system administrator or refer to the technical documentation.

## Grafana Dashboard Panels

The Grafana dashboard includes more detailed panels for in-depth monitoring and troubleshooting:

### API Request Rate by Endpoint

This panel displays the volume of requests (requests per second) for each API endpoint over time.

**Use Cases**:

- Identify traffic patterns and peak usage times
- Monitor the impact of marketing campaigns or feature releases
- Detect abnormal traffic spikes that might indicate issues or attacks

**How to Use**:

- Hover over lines to see exact values at specific times
- Use the legend to toggle visibility of specific endpoints
- Look for sudden changes in request patterns

### API Response Time (95th percentile)

Shows the 95th percentile response time for each endpoint, meaning 95% of requests are faster than this value.

**Use Cases**:

- Identify endpoints that are consistently slow
- Detect performance degradation over time
- Validate performance improvements after optimizations

**Key Thresholds**:

- Green: <1s (Good)
- Yellow: 1s-2s (Needs attention)
- Orange: 2s-5s (Problem)
- Red: >5s (Critical issue)

### Overall Error Rate (5xx)

Displays the percentage of requests resulting in server errors (5xx status codes).

**Use Cases**:

- Monitor overall API health
- Detect service disruptions
- Track error trends over time

**Key Thresholds**:

- Green: <1% (Healthy)
- Yellow: 1-5% (Concerning)
- Orange: 5-10% (Problematic)
- Red: >10% (Critical)

### Error Count by Endpoint

Shows the number of errors broken down by endpoint over the selected time period.

**Use Cases**:

- Identify specific problematic endpoints
- Prioritize troubleshooting efforts
- Track error patterns

**How to Use**:

- Use the bar heights to quickly identify the most error-prone endpoints
- Compare with normal baseline to identify unusual patterns

### Request Distribution by Endpoint

Pie chart showing the distribution of API requests across different endpoints over the last 24 hours.

**Use Cases**:

- Understand which endpoints are most heavily used
- Identify resource allocation needs
- Plan optimization efforts

### Top 10 Slowest Endpoints

Table showing the 10 endpoints with the highest 95th percentile response times.

**Use Cases**:

- Quickly identify the most performance-critical endpoints
- Prioritize optimization efforts
- Track performance improvements over time

### Business Metrics (hourly)

Tracks key business metrics over time:

- Pickups Created: Number of new recycling pickup requests
- User Registrations: New user signups
- Points Awarded: Recycling points issued to users (shown in hundreds)

**Use Cases**:

- Correlate business activity with technical metrics
- Detect business impact of technical issues
- Validate feature adoption

## Troubleshooting with Grafana Dashboard

### Investigating a Performance Issue

1. Start with the **Overall Error Rate** to determine if errors are contributing to the issue
2. Check the **API Response Time** panel to identify slow endpoints
3. Look at the **API Request Rate** to see if there's unusual traffic
4. Examine the **Top 10 Slowest Endpoints** table for specific problem areas
5. Switch to the Database or Redis dashboards to check for related backend issues

### Validating an Optimization

1. Note the baseline metrics before the optimization
2. Deploy your changes
3. Monitor the **API Response Time** panel for the specific endpoint
4. Check if the endpoint improves in the **Top 10 Slowest Endpoints** ranking
5. Verify there's no negative impact on **Error Rate** or **Request Rate**

### Monitoring During a Release

1. Set the dashboard time range to cover the deployment window
2. Watch the **Error Rate** panel for any increase in errors
3. Monitor **API Response Times** for performance degradation
4. Keep an eye on **Business Metrics** to ensure user activities continue normally
5. Look for unexpected changes in **Request Distribution** that might indicate issues

## Alert Configuration

The monitoring system includes pre-configured alerts for the API performance dashboard:

1. **HighApiResponseTime**: Triggers when 95th percentile response time exceeds 2s for 5 minutes
2. **CriticalApiResponseTime**: Triggers when 95th percentile response time exceeds 5s for 2 minutes
3. **HighErrorRate**: Triggers when error rate exceeds 5% for 5 minutes
4. **CriticalErrorRate**: Triggers when error rate exceeds 10% for 2 minutes

Alerts are managed through AlertManager and can be configured in the alerts configuration files.