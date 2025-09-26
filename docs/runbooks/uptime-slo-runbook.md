# Runbook: Uptime SLO (Availability)

## SLO Definition

- **Objective:** 99.9% API uptime over 30 days
- **Alert:** Triggered if uptime SLO is violated or burn rate exceeds threshold

---

## 1. Alert Symptoms

- API is unreachable or returns 5xx for all requests
- Alert in Grafana: `API Uptime SLO Violation`
- Slack notification with runbook link

## 2. Diagnostic Steps

- [ ] Check uptime/downtime graphs in Grafana
- [ ] Confirm outage from multiple locations
- [ ] Review recent deployments or infrastructure changes
- [ ] Check backend, DB, and network logs
- [ ] Inspect load balancer and DNS health

## 3. Remediation Actions

- [ ] Restart affected services (backend, DB, load balancer)
- [ ] Roll back recent deployments if correlated
- [ ] Failover to backup infrastructure if available
- [ ] Contact hosting provider if datacenter/network issue

## 4. Escalation

- If unresolved in 15 minutes, escalate to:
  - DevOps: @devops-oncall
  - Cloud provider support

## 5. Post-Incident Actions

- [ ] Document root cause and timeline in incident report
- [ ] Update SLOs or alert thresholds if needed
- [ ] Add new monitoring or tests if gaps found
- [ ] Share learnings in team post-mortem

---

## Last updated: 2025-09-25
