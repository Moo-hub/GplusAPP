--- Dockerfile+++ backend/Dockerfile@@ -1,7 +1,18 @@-# Backend Dockerfile
-FROM python:3.10-slim
+# Base image
+FROM python:3.11-slim
+
+# Set work directory
 WORKDIR /app
-COPY requirements.txt ./
+
+# Install dependencies
+COPY requirements.txt .
 RUN pip install --no-cache-dir -r requirements.txt
+
+# Copy source code
 COPY . .
-CMD alembic upgrade head && uvicorn gplus_smart_builder_pro.src.main:app --host 0.0.0.0 --port 8000
+
+# Expose port
+EXPOSE 8000
+
+# Command to run FastAPI with Uvicorn
+CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
