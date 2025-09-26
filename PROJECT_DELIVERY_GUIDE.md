# دليل تسليم مشروع GplusApp

---

## 📁 الهيكل النهائي للمجلدات

```python
```

GplusApp/
│
├── alembic/
├── backend/                # (فارغ أو مدمج)
├── cache/
├── cleanup_duplicates_advanced.py
├── config.yaml
├── deduplication_report.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── Dockerfile
├── docs/
├── duplicate_backups/      # نسخ احتياطية للملفات المكررة
├── frontend/
├── gplus_core.py
├── gplus_smart_builder_pro/
├── grafana/
├── locales/
├── logs/
├── prometheus.yml
├── README.md
├── requirements.txt
├── SLOs.md
├── template/
├── templates/
├── tests/
└── ...

```python
```

---

## 🗂️ الملفات الأساسية ومساراتها

- **Backend (FastAPI):**
  - `gplus_smart_builder_pro/src/main.py` (نقطة الدخول)
  - جميع الموديولات: `auth.py`, `crud.py`, `database.py`, `models/`, `schemas/`, `routers/`, `services/`, `monitoring/`
  - اختبارات: `gplus_smart_builder_pro/tests/`
  - ترحيلات قاعدة البيانات: `alembic/`, `alembic.ini`
  - إعدادات: `Dockerfile`, `requirements.txt`, `.env.example`

- **Frontend (React + Vite + Tailwind):**
  - `frontend/src/App.jsx`, `main.jsx`, `AppContext.js`, `i18n.js`, `logError.js`, `sanitizeInput.js`
  - جميع المكونات والشاشات: `frontend/src/components/`, `frontend/src/components/screens/`
  - اختبارات الواجهة: `frontend/src/components/__tests__/`
  - الترجمة: `frontend/src/locales/`
  - إعدادات: `frontend/package.json`, `vite.config.js`, `tailwind.config.js`

- **البنية التحتية والمراقبة:**
  - `docker-compose.yml`, `docker-compose.prod.yml`
  - `prometheus.yml`, `grafana/`
  - `logs/`, `SLOs.md`

- **التوثيق والتقارير:**
  - `README.md` (محدث وموحد)
  - `docs/`, `deduplication_report.md`
  - `duplicate_backups/` (نسخ احتياطية للملفات قبل الدمج/الحذف)

---

## 🚀 دليل تشغيل المشروع محليًا

1. **إعداد البيئة:**
   - انسخ `.env.example` إلى `.env` في كل من `gplus_smart_builder_pro/` و`frontend/` وأضف القيم المطلوبة.

2. **تشغيل الخدمات:**
   - شغّل كل شيء معًا:

     ```sh
     docker-compose up --build
     ```

   - أو شغّل كل جزء يدويًا:
     - **Backend:**  

       ```sh
       cd gplus_smart_builder_pro
       pip install -r requirements.txt
       alembic upgrade head
       uvicorn src.main:app --reload
       ```

     - **Frontend:**  

       ```sh
       cd frontend
       npm install
       npm run dev
       ```

3. **الاختبارات:**
   - **Backend:**  

     ```sh
     cd gplus_smart_builder_pro
     pytest
     ```

   - **Frontend:**  

     ```sh
     cd frontend
     npm test
     ```

---

## ⚙️ دليل CI/CD والتشغيل في الإنتاج

- **GitHub Actions:**  
  - ملف العمل في `.github/workflows/`
  - يبني ويختبر ويعمل Push للصور إلى DockerHub/Vercel.
- **Docker Compose Production:**  

  ```sh
  docker-compose -f docker-compose.prod.yml up --build -d
  ```

- **المراقبة والتنبيهات:**  
  - Prometheus وGrafana مدمجين (راجع `prometheus.yml` و`grafana/`).

---

## 📝 ملاحظات هامة

- جميع الملفات المكررة تم حذفها أو دمجها، مع الاحتفاظ بنسخ احتياطية في `duplicate_backups/`.
- تقرير الدمج والاختلافات متوفر في `deduplication_report.md`.
- المشروع الآن نظيف، منظم، وجاهز للإطلاق أو التسليم النهائي.

---

> **للاستفسار أو الدعم:** راجع README.md أو تواصل مع فريق التطوير.

```python
```
