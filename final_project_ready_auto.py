#!/usr/bin/env python3
"""
final_project_ready_auto.py
نسخة متكاملة لتحضير مشروع GplusApp للتسليم أو التشغيل الإنتاجي
ميزات:
- توليد ملفات .env لكل بيئة
- تشغيل Backend/Frontend/Docker Compose مؤقتًا للاختبارات
- اختبارات smoke متقدمة
- توليد تقرير Markdown وPDF
- إشعارات Slack أو بريد إلكتروني
- واجهة تفاعلية لاختيار البيئة والخدمات
"""

import os
import subprocess
import secrets
import sys
import shutil
from pathlib import Path
from datetime import datetime
import markdown2

# ---------------------------
# إعدادات عامة
# ---------------------------
PROJECT_ROOT = Path(__file__).parent.resolve()
ENVIRONMENTS = ["dev", "staging", "prod"]
SERVICES = ["backend", "frontend", "docker-compose"]
REPORT_MD = PROJECT_ROOT / "final_project_report.md"
REPORT_PDF = PROJECT_ROOT / "final_project_report.pdf"
SLACK_WEBHOOK = os.environ.get("SLACK_WEBHOOK_URL", "")  # ضع رابط Slack هنا إن أردت

# ---------------------------
# توليد ملفات .env لكل بيئة
# ---------------------------
def generate_env(env_name):
    env_file = PROJECT_ROOT / f".env.{env_name}"
    secret_key = secrets.token_hex(32)
    content = f"""
# Environment: {env_name}
DATABASE_URL=postgresql://user:password@localhost:5432/gplus_{env_name}
REDIS_URL=redis://localhost:6379/0
SECRET_KEY={secret_key}
REACT_APP_API_URL=http://localhost:8000/api
"""
    env_file.write_text(content.strip())
    return env_file

# ---------------------------
# تشغيل خدمة مؤقتة
# ---------------------------
def run_service(service):
    print(f"\n[INFO] تشغيل {service} مؤقتًا...")
    if service == "backend":
        return subprocess.Popen(["uvicorn", "gplus_smart_builder_pro.src.main:app", "--reload"])
    elif service == "frontend":
        return subprocess.Popen(["npm", "run", "dev"], cwd=PROJECT_ROOT / "frontend")
    elif service == "docker-compose":
        return subprocess.Popen(["docker-compose", "up", "--build"])
    return None

# ---------------------------
# اختبارات smoke
# ---------------------------
def smoke_tests():
    results = {}
    # Backend smoke test
    try:
        env = os.environ.copy()
        env["PYTHONPATH"] = str(PROJECT_ROOT)
        subprocess.run([
            sys.executable, "-m", "pytest", "--maxfail=1", "--disable-warnings"
        ], cwd=PROJECT_ROOT / "gplus_smart_builder_pro", check=True, env=env)
        results["backend"] = "PASS"
    except subprocess.CalledProcessError:
        results["backend"] = "FAIL"

    # Frontend smoke test
    try:
        subprocess.run(["npm", "run", "test", "--", "--watchAll=false"], cwd=PROJECT_ROOT / "frontend", check=True)
        results["frontend"] = "PASS"
    except subprocess.CalledProcessError:
        results["frontend"] = "FAIL"

    return results

# ---------------------------
# توليد تقرير Markdown وPDF
# ---------------------------
def generate_report(env, smoke_results):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    md_content = f"# تقرير جاهزية مشروع GplusApp\n\n**البيئة:** {env}\n**التاريخ:** {timestamp}\n\n## نتائج اختبارات Smoke\n"
    for svc, result in smoke_results.items():
        md_content += f"- **{svc}**: {result}\n"
    REPORT_MD.write_text(md_content)

    # توليد PDF
    html = markdown2.markdown(md_content)
    try:
        import pdfkit
        pdfkit.from_string(html, REPORT_PDF.as_posix())
    except Exception as e:
        print(f"[WARNING] تعذر توليد PDF: {e}")

# ---------------------------
# إرسال إشعار Slack
# ---------------------------
def notify_slack(report_text):
    if not SLACK_WEBHOOK:
        print("[INFO] لم يتم ضبط Slack Webhook، تخطي الإشعار")
        return
    import requests
    payload = {"text": report_text}
    try:
        requests.post(SLACK_WEBHOOK, json=payload)
        print("[INFO] تم إرسال إشعار Slack")
    except Exception as e:
        print(f"[ERROR] فشل إرسال Slack: {e}")

# ---------------------------
# واجهة تفاعلية
# ---------------------------
def interactive():
    print("=== مشروع GplusApp: أتمتة جاهزية التشغيل ===\n")

    # اختيار البيئة
    print("اختر البيئة:")
    for i, env in enumerate(ENVIRONMENTS, 1):
        print(f"{i}. {env}")
    env_choice = int(input("الاختيار: ")) - 1
    env_selected = ENVIRONMENTS[env_choice]
    env_file = generate_env(env_selected)
    print(f"[INFO] تم توليد ملف البيئة: {env_file}")

    # اختيار الخدمات للتشغيل
    print("\nاختر الخدمات للتشغيل مؤقتًا (افصل بين الأرقام بمسافة):")
    for i, svc in enumerate(SERVICES, 1):
        print(f"{i}. {svc}")
    svc_choices = input("الاختيار: ").split()
    svc_selected = [SERVICES[int(c) - 1] for c in svc_choices]

    # تشغيل الخدمات
    processes = []
    try:
        for svc in svc_selected:
            p = run_service(svc)
            if p:
                processes.append(p)

        print("\n[INFO] بدء اختبارات smoke...")
        smoke_results = smoke_tests()
        print("[INFO] نتائج الاختبارات:", smoke_results)

        # توليد التقرير
        generate_report(env_selected, smoke_results)
        print(f"[INFO] تم توليد تقرير Markdown وPDF: {REPORT_MD}, {REPORT_PDF}")

        # إرسال إشعار Slack
        notify_slack(f"تقرير جاهزية GplusApp ({env_selected})\n\n{smoke_results}")

    finally:
        print("\n[INFO] إنهاء جميع العمليات المؤقتة...")
        for p in processes:
            p.terminate()

# ---------------------------
# Main
# ---------------------------
if __name__ == "__main__":
    interactive()
