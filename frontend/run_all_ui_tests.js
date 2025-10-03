/**
 * run_all_ui_tests.js
 * ---------------------------------------
 * ملف لتشغيل جميع اختبارات React UI دفعة واحدة
 * مع توليد تقرير HTML وMarkdown لتغطية الكود.
 */

const { exec } = require("child_process");
const path = require("path");

const frontendDir = path.resolve(__dirname);

// أمر تشغيل الاختبارات مع توليد تغطية HTML
const testCommand = "npm test -- --coverage --watchAll=false";

// تشغيل الاختبارات
console.log("🚀 بدء تشغيل جميع اختبارات الواجهة...");
exec(testCommand, { cwd: frontendDir }, (err, stdout, stderr) => {
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);

  if (err) {
    console.error("❌ بعض الاختبارات فشلت أو حدث خطأ أثناء التنفيذ.");
    process.exit(1);
  } else {
    console.log("✅ جميع الاختبارات انتهت بنجاح.");

    // نسخ التقرير HTML لتسهيل الوصول
    const coverageDir = path.join(frontendDir, "coverage", "lcov-report");
    console.log(`📂 تقرير HTML موجود هنا: ${coverageDir}/index.html`);

    // إنشاء تقرير Markdown مختصر
    const fs = require("fs");
    const mdReport = `
# واجهة React UI - تقرير الاختبارات

- جميع الشاشات الرئيسية: Pickup, PickupSchedule, Vehicles, Points, Companies, PaymentScreen
- حالات الاختبار: Loading, Empty, Error, Success
- التغطية: ${path.join(frontendDir, "coverage/lcov-report/index.html")}
- تاريخ التنفيذ: ${new Date().toLocaleString()}

> يمكن فتح تقرير HTML للاطلاع على التغطية التفصيلية.
`;
    fs.writeFileSync(path.join(frontendDir, "ui_test_report.md"), mdReport);
    console.log("📝 تقرير Markdown تم توليده: ui_test_report.md");
  }
});