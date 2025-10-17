# دليل المطور لتطبيق G+

## إعداد بيئة التطوير

### المتطلبات الأساسية
- Node.js v16 أو أحدث
- npm v7 أو أحدث
- محرر VSCode (موصى به)
- Git

### تهيئة المشروع المحلي
1. استنساخ المشروع:
```bash
git clone https://github.com/yourusername/gplus-app.git
cd gplus-app
```

2. تثبيت التبعيات:
```bash
cd frontend
npm install
```

3. تكوين ملفات البيئة:
   - نسخ `.env.example` إلى `.env.development` للتطوير المحلي
   - تعديل المتغيرات حسب الحاجة

4. بدء خادم التطوير:
```bash
npm run dev
```

## هيكل المشروع

### المجلدات الرئيسية

#### src/components/
مكونات React القابلة لإعادة الاستخدام. يجب أن تكون هذه المكونات عامة وغير مرتبطة بشاشة محددة.

#### src/screens/
مكونات الصفحات الكاملة المستخدمة في المسارات.

#### src/contexts/
سياقات React للحالة العامة مثل المصادقة والسمات.

#### src/services/
طبقة خدمات API للتواصل مع الخادم.

#### src/i18n/
ملفات ترجمة ومكونات i18n.

#### src/routes/
تعريفات المسارات وآليات الحماية.

## المبادئ التوجيهية للكود

### الأنماط العامة
- استخدم الدالات المكونة لجميع مكونات React
- استخدم الهوكات الأساسية مثل `useState` و`useEffect` و`useContext`
- قم بتقسيم المكونات الكبيرة إلى وحدات أصغر قابلة لإعادة الاستخدام
- احتفظ بالمنطق المعقد في الهوكات المخصصة

### التسميات
- استخدم `PascalCase` لمكونات React
- استخدم `camelCase` للمتغيرات والدوال
- استخدم `UPPER_CASE` للثوابت

### CSS
- استخدم ملفات CSS منفصلة لكل مكون رئيسي
- تنظيم CSS باستخدام نمط BEM

### اختبارات
- اكتب اختبارات وحدة لجميع المكونات المهمة
- اكتب اختبارات تكامل للتفاعلات المعقدة

## إضافة ميزات جديدة

### الخطوات الأساسية
1. إنشاء فرع جديد من `main`:
```bash
git checkout -b feature/my-new-feature
```

2. تنفيذ الميزة متضمنًا الاختبارات

3. كتابة اختبارات للميزة الجديدة

4. تقديم طلب سحب مع وصف تفصيلي للميزة

### نماذج الكود

#### مثال لإنشاء مكون جديد

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import './MyComponent.css';

export default function MyComponent({ title, children }) {
  return (
    <div className="my-component">
      <h2 className="my-component__title">{title}</h2>
      <div className="my-component__content">
        {children}
      </div>
    </div>
  );
}

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node
};
```

#### مثال لإضافة شاشة جديدة

1. إنشاء ملفات الشاشة:
```
src/screens/MyNewScreen/
  - MyNewScreen.jsx
  - MyNewScreen.css
  - index.js
```

2. تحديث المسارات في `routes/index.jsx`

## النشر

### بناء للإنتاج
```bash
npm run build
```

### فحص بناء الإنتاج محليًا
```bash
npm run preview
```

### الفحص قبل الإنتاج
قبل الدمج إلى `main`:
- تأكد من نجاح جميع الاختبارات
- تأكد من عدم وجود أخطاء تحقق من نوع TypeScript
- تأكد من أن البناء يتم بدون أخطاء