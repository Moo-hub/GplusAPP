# دليل الاختبارات لنظام التوجيه متعدد اللغات (Localized Routing Testing Guide)

هذا الملف يشرح كيفية إعداد وتنفيذ وإدارة الاختبارات الخاصة بنظام التوجيه متعدد اللغات في تطبيق GplusApp.

## المحتويات

1. [أنواع الاختبارات](#أنواع-الاختبارات)
2. [إعداد بيئة الاختبار](#إعداد-بيئة-الاختبار)
3. [اختبارات الوحدة (Unit Tests)](#اختبارات-الوحدة)
4. [اختبارات التكامل (Integration Tests)](#اختبارات-التكامل)
5. [اختبارات النهاية إلى النهاية (E2E Tests)](#اختبارات-النهاية-إلى-النهاية)
6. [أدوات اختبار مساعدة](#أدوات-اختبار-مساعدة)
7. [أفضل الممارسات](#أفضل-الممارسات)
8. [استكشاف الأخطاء وإصلاحها](#استكشاف-الأخطاء-وإصلاحها)

## أنواع الاختبارات

نظام التوجيه متعدد اللغات يتطلب اختبار على عدة مستويات:

1. **اختبارات الوحدة**: تختبر مكونات وخطافات معينة بشكل منعزل
2. **اختبارات التكامل**: تختبر كيفية عمل المكونات معًا
3. **اختبارات النهاية إلى النهاية**: تختبر النظام بأكمله في بيئة متصفح حقيقية

## إعداد بيئة الاختبار

### المتطلبات

قبل تشغيل الاختبارات، تأكد من تثبيت جميع التبعيات اللازمة:

```bash
npm install
```

### تهيئة ملفات الترجمة للاختبار

نستخدم نسخة مخصصة من i18n للاختبارات موجودة في `src/test-utils/i18n-for-tests.js`. هذا الملف يحتوي على ترجمات مبسطة لاستخدامها في الاختبارات بدلًا من تحميل ملفات الترجمة الكاملة.

## اختبارات الوحدة

### تشغيل اختبارات الوحدة

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل اختبارات محددة
npm test -- frontend/src/components/common/__tests__/LocalizedLink.test.jsx

# تشغيل الاختبارات في وضع المراقبة
npm run test:watch
```

### أمثلة لاختبارات الوحدة

#### اختبار مكون LocalizedLink

```jsx
import { render, screen } from '@testing-library/react';
import { renderWithI18nAndRouter } from '../../../test-utils/test-utils';
import LocalizedLink from '../LocalizedLink';

describe('LocalizedLink', () => {
  test('renders a link with correct localized path', () => {
    renderWithI18nAndRouter(
      <LocalizedLink to="/products">Products</LocalizedLink>,
      { language: 'en' }
    );
    
    const link = screen.getByText('Products');
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/en/products');
  });
});
```

#### اختبار خطاف useLocalizedRouting

```jsx
import { renderHook } from '@testing-library/react-hooks';
import { renderWithI18nAndRouter } from '../../../test-utils/test-utils';
import { useLocalizedRouting } from '../../hooks/useLocalizedRouting';

describe('useLocalizedRouting', () => {
  test('returns the current internal path', () => {
    const { result } = renderHook(() => useLocalizedRouting(), {
      wrapper: ({ children }) => renderWithI18nAndRouter(children, {
        initialEntries: ['/en/products']
      })
    });
    
    expect(result.current.currentInternalPath).toBe('/products');
  });
});
```

## اختبارات التكامل

### تشغيل اختبارات التكامل

اختبارات التكامل تختبر كيفية عمل المكونات معًا. يمكن تشغيلها باستخدام نفس أمر اختبارات الوحدة:

```bash
npm test -- frontend/src/components/common/__tests__/LocalizedRoutingIntegration.test.jsx
```

### مثال لاختبار التكامل

```jsx
import { render, screen } from '@testing-library/react';
import { renderWithI18nAndRouter } from '../../../test-utils/test-utils';
import LocalizedRouter from '../LocalizedRouter';
import LocalizedLink from '../LocalizedLink';
import { Routes, Route } from 'react-router-dom';

describe('Localized Routing Integration', () => {
  test('navigation between localized routes works', () => {
    // تهيئة الاختبار مع تقديم جميع المكونات اللازمة معًا
    renderWithI18nAndRouter(
      <>
        <LocalizedLink to="/products" data-testid="products-link">Products</LocalizedLink>
        <LocalizedRouter>
          <Routes>
            <Route path="/products" element={<div data-testid="products-page">Products</div>} />
          </Routes>
        </LocalizedRouter>
      </>,
      { language: 'en', initialEntries: ['/en'] }
    );
    
    // انقر على رابط المنتجات
    fireEvent.click(screen.getByTestId('products-link'));
    
    // تحقق من ظهور صفحة المنتجات
    expect(screen.getByTestId('products-page')).toBeInTheDocument();
  });
});
```

## اختبارات النهاية إلى النهاية

### تشغيل اختبارات Cypress

```bash
# تشغيل Cypress في وضع العرض
npm run cypress:open

# تشغيل اختبارات Cypress في وضع headless
npm run cypress:run

# تشغيل اختبارات محددة
npm run cypress:run -- --spec "cypress/e2e/localizedRouting.cy.js"
```

### أوامر Cypress المخصصة

تم إضافة أوامر مخصصة لتسهيل اختبار التوجيه متعدد اللغات في `cypress/support/commands.js`:

- `cy.changeLanguage(language)`: تغيير اللغة مباشرة
- `cy.checkDirection(direction)`: التحقق من اتجاه الصفحة (rtl/ltr)
- `cy.checkLanguage(language)`: التحقق من لغة الصفحة
- `cy.checkLocalizedPath(internalPath, language, expectedPath)`: التحقق من المسار المترجم

### مثال لاختبار النهاية إلى النهاية

```javascript
describe('Localized Routing E2E', () => {
  it('should navigate to localized routes when clicking links', () => {
    cy.visit('/');
    
    // انقر على رابط المنتجات
    cy.contains('Products').click();
    
    // تحقق من أن عنوان URL يحتوي على المسار المترجم
    cy.url().should('include', '/en/products');
    
    // تغيير اللغة إلى العربية
    cy.changeLanguage('ar');
    
    // تحقق من أن عنوان URL تغير إلى المسار العربي
    cy.url().should('include', '/ar/المنتجات');
  });
});
```

## أدوات اختبار مساعدة

### مكونات مساعدة للاختبار

تم إنشاء مكونات مساعدة في `src/test-utils/test-utils.jsx` لتبسيط كتابة الاختبارات:

- `renderWithI18nAndRouter`: يوفر مزودات i18n والتوجيه معًا
- `renderWithI18n`: يوفر مزود i18n فقط
- `renderWithRouter`: يوفر مزود التوجيه فقط

### i18n للاختبارات

تم إنشاء نسخة مخصصة من i18n للاختبارات في `src/test-utils/i18n-for-tests.js`. هذا الملف يحتوي على ترجمات مبسطة للاستخدام في الاختبارات.

## أفضل الممارسات

1. **عزل الاختبارات**: تأكد من عزل كل اختبار عن الآخر لمنع التأثير المتبادل
2. **استخدم البيانات الوهمية**: استخدم ترجمات وهمية مبسطة في الاختبارات
3. **اختبر السيناريوهات المختلفة**: اختبر التوجيه في كلا الاتجاهين (RTL/LTR)
4. **تغطية شاملة**: تأكد من تغطية جميع المكونات والخطافات الرئيسية
5. **تنظيم الاختبارات**: نظم الاختبارات بشكل منطقي حسب المكونات والوظائف

## استكشاف الأخطاء وإصلاحها

### مشكلات شائعة

1. **فشل التوجيه المترجم**: تأكد من تهيئة `LocalizedRouter` بشكل صحيح وتأكد من وجود مزود `LanguageProvider`
2. **ظهور ترجمات مفقودة**: تأكد من وجود جميع مفاتيح الترجمة في ملف `i18n-for-tests.js`
3. **مشكلات في اختبارات النهاية إلى النهاية**: تأكد من تحميل الصفحة بشكل كامل قبل إجراء الاختبارات، استخدم `cy.wait()` إذا لزم الأمر

### تلميحات للتصحيح

- استخدم `console.log` للتحقق من قيم المتغيرات في الاختبارات
- تأكد من تعيين اللغة الصحيحة في اختبارات الوحدة والتكامل
- استخدم أداة تصحيح الأخطاء في Cypress للتحقق من سلوك التطبيق خطوة بخطوة

---

## موارد إضافية

- [توثيق React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [توثيق Cypress](https://docs.cypress.io/)
- [توثيق i18next للاختبار](https://www.i18next.com/misc/testing)