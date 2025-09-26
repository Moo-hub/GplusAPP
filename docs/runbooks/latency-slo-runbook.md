# Runbook: Latency SLO (API Response Time)

## SLO Definition

- **Objective:** 95% of API requests respond in < 500ms over 30 days
- **Alert:** Triggered if latency SLO is violated or burn rate exceeds threshold

---

## 1. Alert Symptoms

- Elevated API response times (>500ms)
- Alert in Grafana: `High API Latency SLO Violation`
- Slack notification with runbook link

## 2. Diagnostic Steps

- [ ] Check current and historical latency graphs in Grafana
- [ ] Identify affected endpoints/services
- [ ] Review recent deployments or config changes
- [ ] Check backend logs for errors/timeouts
- [ ] Inspect database and Redis metrics for bottlenecks
- [ ] Review infrastructure (CPU, memory, network)

## 3. Remediation Actions

- [ ] Roll back recent deployments if correlated
- [ ] Restart affected services (backend, DB, Redis)
- [ ] Scale up resources if under-provisioned
- [ ] Optimize slow queries or endpoints
- [ ] Clear cache if cache-related

## 4. Escalation

- If unresolved in 30 minutes, escalate to:
  - Backend lead: @backend-lead
  - DevOps: @devops-oncall

## 5. Post-Incident Actions

- [ ] Document root cause and timeline in incident report
- [ ] Update SLOs or alert thresholds if needed
- [ ] Add new monitoring or tests if gaps found
- [ ] Share learnings in team post-mortem

---

## Last updated: 2025-09-25
