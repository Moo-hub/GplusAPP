Batch 2: Environmental Dashboard — presentational view + i18n + tests

Summary

This Draft PR contains the first small commits for Batch 2 focused on the Environmental Dashboard UI and i18n wiring. It is intentionally small so CI can run early while we continue incremental improvements.

What this PR includes

- UI: `EnvironmentalDashboardView.jsx` converted to a presentational component (no fetching/state). The Container/Hook remain responsible for data and state.
- i18n: small additions to `public/locales/en/environmental.json` and `public/locales/ar/environmental.json` (loading, error, cta keys; placeholders normalized).
- Tests: backend integration tests remain green (2 passing tests locally). No frontend tests added in this PR — will add one small UI negative test next.

Why Draft

Open as Draft so CI can validate the integration contract and the docs while we push subsequent small commits (View polish, additional i18n keys, frontend negative tests). Keeping the PR as a Draft shortens review cycles and reduces risk.

How to run locally

PowerShell (from repo root):

```powershell
Set-Location 'C:\GplusApp_backup\repo_clean'
$env:PYTHONPATH='backend'
pytest tests/test_environmental.py tests/test_environmental_negative.py -q
```

Checklist (to convert to Ready for Review)

- [ ] Add frontend negative test for ErrorBoundary/Retry
- [ ] Add missing i18n keys used by final View
- [ ] Visual cleanups (icons, spacing) <= 150 lines
- [ ] CI green on all checks

Notes

- Avoid duplicating tags/prefix between APIRouter and include_router to keep OpenAPI clean.
- If desired, we can add `openapi_tags` in `backend/app/main.py` in a follow-up to populate the top-level tags array.

(Arabic)

الدفعة 2: لوحة التأثير البيئي — عرض تقديمي + i18n + اختبارات

ملخّص

هذه المسودة تحتوي التزامات صغيرة لبدء دفعة Batch 2: فصل العرض (View) كعنصر تقديمي وربط مفاتيح i18n صغيرة. الهدف: فتح مسودة مبكراً لبدء CI بينما نكمل بقية التحسينات.

تشغيل محلي

استخدم الأوامر السابقة مع ضبط PYTHONPATH على `backend`.
\nFollow-up: UI polish and i18n refinements.
