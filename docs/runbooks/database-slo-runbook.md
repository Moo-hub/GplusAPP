# Runbook: Database SLO (DB Latency/Availability)

## SLO Definition

- **Objective:** 99.9% DB uptime, < 100ms query latency over 30 days
- **Alert:** Triggered if DB SLO is violated or burn rate exceeds threshold

---

## 1. Alert Symptoms

- Elevated DB query latency or timeouts
- DB unavailable or connection errors
- Alert in Grafana: `Database SLO Violation`
- Slack notification with runbook link

## 2. Diagnostic Steps

- [ ] Check DB latency/availability graphs in Grafana
- [ ] Review DB logs for errors or slow queries
- [ ] Inspect backend logs for DB connection issues
- [ ] Check infrastructure (CPU, memory, disk, network)
- [ ] Review recent schema changes or migrations

## 3. Remediation Actions

- [ ] Restart DB service if unresponsive
- [ ] Roll back recent schema changes/migrations
- [ ] Scale up DB resources if under-provisioned
- [ ] Optimize slow queries or add indexes
- [ ] Failover to replica if available

## 4. Escalation

- If unresolved in 15 minutes, escalate to:
  - DB admin: @db-admin
  - DevOps: @devops-oncall

## 5. Post-Incident Actions

- [ ] Document root cause and timeline in incident report
- [ ] Update SLOs or alert thresholds if needed
- [ ] Add new monitoring or tests if gaps found
- [ ] Share learnings in team post-mortem

---

## Last updated: 2025-09-25
