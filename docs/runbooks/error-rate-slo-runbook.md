# Runbook: Error Rate SLO (5xx Errors)

## SLO Definition

- **Objective:** 99.5% of requests succeed (no 5xx) over 30 days
- **Alert:** Triggered if error rate SLO is violated or burn rate exceeds threshold

---

## 1. Alert Symptoms

- Spike in 5xx errors (500, 502, 503, 504)
- Alert in Grafana: `High 5xx Error Rate SLO Violation`
- Slack notification with runbook link

## 2. Diagnostic Steps

- [ ] Check error rate graphs in Grafana
- [ ] Identify affected endpoints/services
- [ ] Review backend logs for stack traces
- [ ] Check DB/Redis health and logs
- [ ] Inspect recent deployments or config changes

## 3. Remediation Actions

- [ ] Roll back recent deployments if correlated
- [ ] Restart affected services
- [ ] Fix or revert faulty code/config
- [ ] Apply hotfix if root cause is known

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
