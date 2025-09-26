# My Heading

## 📊 GPlus Monitoring & Alerts Runbook

## Another Section

## Alert Rules & Monitoring

- Latency (95th percentile)
- 5xx Error Rate
- DB Connections
- Redis Memory
- Container Restarts

(تفاصيل كل Alert موجودة في grafana/provisioning/alerting/alert-rules.yaml)

---

## 📑 Incident Report Template

> استخدم هذا القالب لتوثيق أي Incident (مشكلة) حصلت أثناء المراقبة أو التنبيهات.
> الهدف: تسهيل التحقيقات (post-mortem) وتحسين الاستجابة مستقبلًا.

### Incident ID

(مثال: `INC-2025-09-25-01`)

### Summary

وصف مختصر للمشكلة (مثال: ارتفاع مفاجئ في Latency بسبب ضغط غير متوقع).

### Timeline

- **[HH:MM]** متى ظهر التنبيه (من Grafana/Slack).
- **[HH:MM]** من استلم التنبيه.
- **[HH:MM]** ما الخطوات التي تم تنفيذها بالترتيب.
- **[HH:MM]** وقت حل المشكلة.

### Impact

- الخدمات المتأثرة (Backend, DB, Redis, Frontend).
- عدد المستخدمين المتأثرين (تقديري).

### Root Cause

ما السبب الأساسي (Bug, Load spike, Config error, Network issue…).

### Resolution Steps

ما الذي تم عمله لإصلاح المشكلة (Restart, Scaling, Fix config…).

### Preventive Actions

- ما الخطوات التي ستُضاف لمنع تكرار المشكلة؟
- هل تحتاج Alert جديد؟ Test إضافي؟ توثيق أفضل؟

---

📌 **ملاحظة**

- كل Incident لازم يتوثّق بنفس اليوم.
- الهدف مش لوم الأشخاص، الهدف تحسين النظام.

- Item 1
- Item 2
