Title: refactor(batch-1): unify routers + dashboard container/view/hook + i18n namespace + integration test

### السياق والهدف
- توحيد المسارات ضمن Routers مجالية وضبط prefixes/tags، تفكيك EnvironmentalDashboard إلى Container/View/Hook، إضافة Error Boundary، تنظيم namespace i18n، وإضافة اختبار تكاملي لمسار البيئة.

### نوع التغيير
- إعادة هيكلة بدون تغيير سلوكي
- تحسين DX + اختبارات تكامل

### خطوات التحقق
- $env:PYTHONPATH='backend' && pytest tests/test_environmental.py -q
- التحقق من وجود "/api/v1/environmental/impacts" في openapi.json وظهور قسم Environmental في Swagger.

### المخاطر والتراجع
- منخفضة؛ تغييرات صغيرة ومعزولة ومحمية باختبار تكاملي ويمكن التراجع عنها بإزالة تضمين الـRouter أو إرجاع الملفات.

### ملفات رئيسية معدّلة
- backend/app/environmental/* (router, service)
- backend/app/api/api_v1/endpoints/environmental_impact.py (bridge)
- src/hooks/useEnvironmentalImpact.js
- src/components/EnvironmentalDashboardContainer.jsx
- src/components/EnvironmentalDashboardView.jsx
- public/locales/en/environmental.json
- public/locales/ar/environmental.json
- tests/test_environmental.py

---
Please run CI and review the incremental changes. I'll continue to push small commits to this branch to finalize the View and add negative tests.
