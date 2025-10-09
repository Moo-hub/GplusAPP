# دليل استخدام مكون المسار الهيكلي (Breadcrumbs) متعدد اللغات

## نظرة عامة

مكون `LocalizedBreadcrumbs` هو مكون متقدم للمسار الهيكلي في تطبيقات React يدعم تعدد اللغات وتوجيه النص من اليمين لليسار (RTL) والتوجيه من اليسار لليمين (LTR). يساعد هذا المكون في عرض تسلسل التنقل في تطبيقك مع دعم الترجمة الكامل وتكيف المكون مع اتجاه اللغة الحالية.

## الميزات الرئيسية

- **دعم تعدد اللغات**: ترجمة كاملة لجميع أجزاء المسار الهيكلي
- **دعم RTL/LTR**: تكيف تلقائي مع اتجاه اللغة الحالية
- **تخصيص الطرق**: تعيين مخصص للترجمات لكل مسار
- **معالجة الأجزاء الديناميكية**: دعم للمعلمات الديناميكية في الروابط
- **قابلية التخصيص**: فاصل مخصص وأنماط CSS إضافية
- **سهولة الاستخدام**: واجهة برمجية بسيطة وسهلة الفهم

## التثبيت والإعداد

1. تأكد من وجود الملفات التالية في مشروعك:
   - `src/components/common/LocalizedBreadcrumbs.jsx`
   - `src/utils/directionalHelpers.js`
   - `src/hooks/useTranslationNamespaces.js`
   - `src/i18nSetup.js`

2. أضف ملفات الترجمة اللازمة:
   - `public/locales/[language]/breadcrumbs.json`
   - `public/locales/[language]/navigation.json`

## الاستخدام الأساسي

```jsx
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LocalizedBreadcrumbs from './components/common/LocalizedBreadcrumbs';

const App = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <LocalizedBreadcrumbs />
        {/* باقي محتوى التطبيق */}
      </div>
    </BrowserRouter>
  );
};
```

## الخصائص (Props)

| الخاصية | النوع | الافتراضي | الوصف |
|---------|------|-----------|-------|
| `routes` | `object` | `{}` | كائن يحدد تعيين المسارات (URL path -> translation key) |
| `dynamicSegments` | `object` | `{}` | كائن يحدد كيفية التعامل مع أجزاء URL الديناميكية |
| `showHome` | `boolean` | `true` | ما إذا كان سيتم عرض رابط الصفحة الرئيسية |
| `separator` | `node` | `/` | الفاصل بين عناصر المسار |
| `styles` | `object` | `{}` | أنماط CSS إضافية |

## أمثلة متقدمة

### تخصيص طرق الترجمة

```jsx
<LocalizedBreadcrumbs 
  routes={{
    '/': 'navigation.homePage',
    '/products': 'navigation.productsSection',
    '/about': 'navigation.aboutUsPage'
  }}
/>
```

### معالجة الأجزاء الديناميكية

```jsx
<LocalizedBreadcrumbs 
  dynamicSegments={{
    '/products/:categoryId': (categoryId) => `categories.${categoryId}`,
    '/users/:userId': 'navigation.userProfile',
    '/posts/:postId': (postId, path, location) => {
      // يمكن استخدام المعلومات من الموقع للعثور على الترجمة الصحيحة
      return `post.${postId}`;
    }
  }}
/>
```

### تخصيص المظهر

```jsx
<LocalizedBreadcrumbs 
  separator="›"
  styles={{
    backgroundColor: '#f5f5f5',
    padding: '10px 15px',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }}
/>
```

## إضافة ترجمات جديدة

1. أضف مفاتيح الترجمة في ملف `public/locales/[language]/breadcrumbs.json`:

```json
{
  "navigation": {
    "breadcrumb": "Breadcrumb Navigation",
    "home": "Home",
    "products": "Products",
    "newSection": "New Section"
  }
}
```

1. استخدم المفاتيح في إعدادات المكون:

```jsx
<LocalizedBreadcrumbs 
  routes={{
    '/new-section': 'navigation.newSection'
  }}
/>
```

## المسارات المتداخلة

يمكن استخدام `LocalizedBreadcrumbs` مع المسارات المتداخلة في React Router:

```jsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/products" element={<ProductsLayout />}>
    <Route index element={<ProductsList />} />
    <Route path=":id" element={<ProductDetail />} />
  </Route>
</Routes>
```

## التكامل مع منظومة التوجيه

يعمل مكون `LocalizedBreadcrumbs` بشكل تلقائي مع `react-router-dom` ويستخدم `useLocation` للحصول على المسار الحالي. تأكد من استخدام المكون داخل سياق `BrowserRouter` أو `MemoryRouter`.

## أفضل الممارسات

1. **تنظيم مفاتيح الترجمة**: حافظ على تنظيم مفاتيح الترجمة في ملفات مناسبة وفقًا للوظيفة.

2. **استخدام المسارات الثابتة**: حدد المسارات الثابتة في كائن `routes` للحصول على ترجمات دقيقة.

3. **معالجة الأجزاء الديناميكية**: استخدم كائن `dynamicSegments` لمعالجة المعلمات الديناميكية في الروابط.

4. **الاختبار**: تأكد من اختبار المكون مع مختلف المسارات واللغات للتأكد من عمله بشكل صحيح.

## استكشاف الأخطاء وإصلاحها

### المشكلة: لا تظهر الترجمات بشكل صحيح

- تأكد من تحميل ملفات الترجمة الصحيحة باستخدام `useTranslationNamespaces`.
- تحقق من وجود مفاتيح الترجمة في ملفات الترجمة.

### المشكلة: لا يتم عرض المسار الهيكلي بالاتجاه الصحيح في RTL

- تأكد من تعيين اللغة بشكل صحيح في `useLanguage`.
- تحقق من عمل `directionalHelpers` بشكل صحيح.

### المشكلة: الأجزاء الديناميكية لا تعرض النص الصحيح

- تحقق من تكوين كائن `dynamicSegments` وتأكد من عودة مفتاح الترجمة الصحيح.

## المزيد من التخصيص

يمكن تمديد مكون `LocalizedBreadcrumbs` لدعم المزيد من الميزات مثل:

- إضافة أيقونات
- تغيير النمط بناءً على السمة (الوضع المظلم / الفاتح)
- إضافة قوائم منسدلة للتنقل السريع
- عرض معلومات إضافية عند تحويم مؤشر الماوس

## خاتمة

يوفر مكون `LocalizedBreadcrumbs` حلًا قويًا وقابلًا للتخصيص للمسارات الهيكلية في تطبيقات React متعددة اللغات. باستخدام هذا المكون، يمكنك تحسين تجربة المستخدم وتسهيل التنقل في تطبيقك مع دعم كامل لتعدد اللغات واتجاهات النصوص.