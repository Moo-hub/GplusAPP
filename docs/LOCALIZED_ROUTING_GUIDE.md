# دليل التوجيه متعدد اللغات (Localized Routing)

## نظرة عامة

يوفر نظام التوجيه متعدد اللغات في تطبيق GplusApp طريقة شاملة للتعامل مع المسارات المترجمة (URLs) في تطبيقات React. يتيح هذا النظام عرض المسارات بلغة المستخدم المختارة مع الحفاظ على إمكانية التنقل والتشغيل العادية للتطبيق.

## الميزات الرئيسية

- **مسارات مترجمة**: عرض عناوين URL باللغة المحددة من المستخدم
- **تبديل اللغة مع الحفاظ على المسار**: تغيير اللغة مع الانتقال إلى نفس الصفحة بالمسار المترجم
- **دعم المعلمات الديناميكية**: معالجة المعلمات الديناميكية في المسارات المترجمة
- **تكامل سلس مع React Router**: استخدام واجهات React Router القياسية
- **خطافات React مخصصة**: تبسيط استخدام المسارات المترجمة في المكونات

## المكونات الرئيسية

### 1. `LocalizedRouter`

المكون الأساسي الذي يعالج المسارات متعددة اللغات:

```jsx
// App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18nSetup';
import LocalizedRouter from './components/common/LocalizedRouter';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';

const App = () => {
  return (
    <LanguageProvider>
      <LocalizedRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          {/* المزيد من المسارات... */}
        </Routes>
      </LocalizedRouter>
    </LanguageProvider>
  );
};

export default App;
```

### 2. `LocalizedLink`

مكون رابط مخصص يتعامل مع المسارات المترجمة تلقائيًا:

```jsx
import React from 'react';
import LocalizedLink from './components/common/LocalizedLink';

const Navigation = () => {
  return (
    <nav>
      <LocalizedLink to="/">الرئيسية</LocalizedLink>
      <LocalizedLink to="/products">المنتجات</LocalizedLink>
      <LocalizedLink to="/about">من نحن</LocalizedLink>
    </nav>
  );
};
```

### 3. `LanguageSwitcherWithRoute`

مكون تبديل اللغة الذي يحافظ على المسار الحالي:

```jsx
import React from 'react';
import LanguageSwitcherWithRoute from './components/common/LanguageSwitcherWithRoute';

const Header = () => {
  return (
    <header>
      <h1>GplusApp</h1>
      <LanguageSwitcherWithRoute />
    </header>
  );
};
```

### 4. خطافات التوجيه المترجم

خطافات React مخصصة للتعامل مع المسارات المترجمة:

```jsx
import React from 'react';
import { useLocalizedRouting, useLocalizedLink } from './hooks/useLocalizedRouting';

const CustomNavigation = () => {
  const { navigateTo } = useLocalizedRouting();
  const localizedLink = useLocalizedLink();
  
  const handleNavigate = () => {
    navigateTo('/products');
  };
  
  return (
    <div>
      <button onClick={handleNavigate}>الذهاب إلى المنتجات</button>
      <a href={localizedLink('/about')}>من نحن</a>
    </div>
  );
};
```

## تكوين المسارات المترجمة

المسارات المترجمة يتم تعريفها في كائن تخطيط يربط بين المسارات الداخلية والمسارات المترجمة لكل لغة:

```javascript
const ROUTE_MAPPINGS = {
  en: {
    '/': '/',
    '/login': '/login',
    '/register': '/register',
    '/products': '/products',
    '/products/:id': '/products/:id',
    '/about': '/about',
    '/contact': '/contact',
  },
  ar: {
    '/': '/',
    '/login': '/تسجيل-دخول',
    '/register': '/إنشاء-حساب',
    '/products': '/المنتجات',
    '/products/:id': '/المنتجات/:id',
    '/about': '/من-نحن',
    '/contact': '/اتصل-بنا',
  }
};
```

يمكنك تعديل هذا الكائن لإضافة مسارات جديدة أو لغات إضافية.

## الخطافات المتاحة

### 1. `useLocalizedRouting`

يوفر وظائف للتعامل مع المسارات المترجمة:

```javascript
const {
  currentInternalPath, // المسار الداخلي الحالي
  params,              // معلمات URL الحالية
  navigateTo,          // الانتقال إلى مسار مترجم
  getFullLocalizedPath,// الحصول على المسار المترجم الكامل
  changeRouteLanguage  // تغيير لغة المسار الحالي
} = useLocalizedRouting();
```

### 2. `useLocalizedLink`

يوفر دالة لإنشاء مسارات مترجمة للاستخدام مع روابط عادية:

```javascript
const localizedLink = useLocalizedLink();
const aboutLink = localizedLink('/about'); // '/ar/من-نحن' باللغة العربية
```

### 3. `useLanguageChanger`

يوفر دالة لتغيير اللغة مع تحديث المسار:

```javascript
const changeLanguageAndRoute = useLanguageChanger();
// تغيير اللغة إلى الإنجليزية وتحديث المسار
changeLanguageAndRoute('en');
```

## أمثلة الاستخدام

### 1. صفحة محمية متعددة اللغات

```jsx
import React from 'react';
import { Route } from 'react-router-dom';
import LocalizedProtectedRoute from './components/common/LocalizedProtectedRoute';
import DashboardPage from './pages/DashboardPage';

const ProtectedRoutes = ({ isAuthenticated }) => {
  return (
    <Route
      path="/dashboard"
      element={
        <LocalizedProtectedRoute
          isAuthenticated={isAuthenticated}
          redirectTo="/login"
        >
          <DashboardPage />
        </LocalizedProtectedRoute>
      }
    />
  );
};
```

### 2. المسار الهيكلي متعدد اللغات

```jsx
import React from 'react';
import LocalizedBreadcrumbs from './components/common/LocalizedBreadcrumbs';

const PageWithBreadcrumbs = () => {
  return (
    <div>
      <LocalizedBreadcrumbs
        routes={{
          '/': 'common.home',
          '/products': 'common.products',
          '/contact': 'common.contact'
        }}
        dynamicSegments={{
          '/products/:id': (id) => `products.product${id}`
        }}
      />
      {/* محتوى الصفحة... */}
    </div>
  );
};
```

## أفضل الممارسات

### 1. استخدم دائمًا المسارات الداخلية في الكود

عند الإشارة إلى المسارات في الكود، استخدم دائمًا المسارات الداخلية (غير المترجمة):

```jsx
// ✅ صحيح
<LocalizedLink to="/products" />

// ❌ خطأ
<LocalizedLink to="/المنتجات" />
```

### 2. تعامل مع المعلمات الديناميكية بشكل صحيح

عند تعريف المسارات المترجمة، تأكد من تعريف جميع المعلمات الديناميكية:

```javascript
const ROUTE_MAPPINGS = {
  ar: {
    '/products/:id': '/المنتجات/:id',
    '/users/:userId/posts/:postId': '/المستخدمون/:userId/المنشورات/:postId'
  }
};
```

### 3. خطط لبنية مسار منطقية لكل لغة

- حاول الحفاظ على نفس بنية المسار قدر الإمكان بين اللغات
- تجنب المسارات المختلفة تمامًا بين اللغات
- استخدم الفواصل السفلية أو الشرطات للكلمات المتعددة في المسارات العربية

### 4. اختبر جميع المسارات في كل لغة

تأكد من اختبار المسارات في جميع اللغات المدعومة للتأكد من عملها بشكل صحيح:

- انتقال المستخدم بين الصفحات
- تبديل اللغات في صفحات مختلفة
- استخدام الروابط المباشرة للمسارات المترجمة
- معالجة المسارات الديناميكية

## تخصيص وتوسيع النظام

### 1. إضافة لغات جديدة

لإضافة لغة جديدة، أضف تعريفاتها إلى `LANGUAGE_CONSTANTS` وأضف تخطيطات المسارات:

```javascript
// constants/i18n.js
export const LANGUAGE_CONSTANTS = {
  DEFAULT_LANGUAGE: 'en',
  SUPPORTED_LANGUAGES: ['en', 'ar', 'fr'], // إضافة الفرنسية
  RTL_LANGUAGES: ['ar']
};

// components/common/LocalizedRouter.jsx
const ROUTE_MAPPINGS = {
  en: { /* المسارات الإنجليزية */ },
  ar: { /* المسارات العربية */ },
  fr: {
    '/': '/',
    '/login': '/connexion',
    '/products': '/produits',
    '/about': '/a-propos',
    // المزيد من المسارات...
  }
};
```

### 2. تخزين المسارات المترجمة خارجيًا

يمكن تحميل المسارات المترجمة من ملف JSON خارجي:

```javascript
import React, { useEffect, useState } from 'react';

const LocalizedRouter = ({ children }) => {
  const [routeMappings, setRouteMappings] = useState({});
  
  useEffect(() => {
    // تحميل المسارات من ملف JSON
    fetch('/locales/route-mappings.json')
      .then(response => response.json())
      .then(data => setRouteMappings(data))
      .catch(error => console.error('Error loading route mappings:', error));
  }, []);
  
  if (Object.keys(routeMappings).length === 0) {
    return <div>Loading...</div>;
  }
  
  // باقي تنفيذ LocalizedRouter...
};
```

### 3. SEO وروبوتات محركات البحث

لتحسين تجربة محركات البحث، أضف علامة الارتباط البديل في رأس الصفحة:

```jsx
import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocalizedLink } from './hooks/useLocalizedRouting';
import { LANGUAGE_CONSTANTS } from './constants/i18n';

const SEOLinks = ({ path }) => {
  const localizedLink = useLocalizedLink();
  
  return (
    <Helmet>
      {LANGUAGE_CONSTANTS.SUPPORTED_LANGUAGES.map(lang => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={`${window.location.origin}/${lang}${localizedLink(path)}`}
        />
      ))}
    </Helmet>
  );
};
```

## الخاتمة

يوفر نظام التوجيه متعدد اللغات حلاً شاملاً لإنشاء تجربة مستخدم متعددة اللغات كاملة في تطبيقات React. باستخدام المكونات والخطافات المتوفرة، يمكنك إنشاء تطبيق يتكيف مع لغة المستخدم، ليس فقط في محتوى الصفحات ولكن أيضًا في بنية عناوين URL.

بفضل التكامل السلس مع React Router، يمكنك الاستمرار في استخدام نفس أنماط التوجيه التي اعتدت عليها، مع الاستفادة من ميزات الترجمة والتوجيه متعدد اللغات.