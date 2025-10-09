/// <reference types="cypress" />

describe('Localized Routing System E2E Tests', () => {
  beforeEach(() => {
    // زيارة الصفحة الرئيسية قبل كل اختبار
    cy.visit('/');
    
    // تأكد من تحميل الصفحة الرئيسية
    cy.contains('GplusApp').should('be.visible');
    
    // تنتظر حتى يتم تحميل نظام الترجمة
    cy.wait(500); // انتظار قصير لضمان تحميل الترجمات
  });

  it('should automatically redirect to language-prefixed route', () => {
    // زيارة الصفحة الرئيسية بدون بادئة لغة
    cy.visit('/');
    
    // يجب أن يعيد التوجيه إلى المسار مع بادئة اللغة الافتراضية (الإنجليزية)
    cy.url().should('include', '/en');
  });

  it('should navigate to localized routes when clicking links', () => {
    // انقر على رابط المنتجات
    cy.contains('Products').click();
    
    // تحقق من أن عنوان URL يحتوي على المسار المترجم
    cy.url().should('include', '/en/products');
    
    // تحقق من أن محتوى صفحة المنتجات ظاهر
    cy.contains('Products Page').should('be.visible');
    
    // انقر على رابط "من نحن"
    cy.contains('About Us').click();
    
    // تحقق من أن عنوان URL يحتوي على المسار المترجم
    cy.url().should('include', '/en/about');
    
    // تحقق من أن محتوى صفحة "من نحن" ظاهر
    cy.contains('About Page').should('be.visible');
  });

  it('should change language while preserving current route', () => {
    // انتقل إلى صفحة المنتجات أولاً
    cy.contains('Products').click();
    cy.url().should('include', '/en/products');
    
    // انقر على زر تغيير اللغة إلى العربية
    cy.contains('العربية').click();
    
    // تحقق من أن عنوان URL تغير إلى المسار العربي مع الحفاظ على نفس الصفحة
    cy.url().should('include', '/ar/المنتجات');
    
    // تحقق من أن محتوى الصفحة تغير إلى العربية
    cy.contains('صفحة المنتجات').should('be.visible');
    
    // تحقق من أن القائمة الرئيسية تظهر بالعربية أيضًا
    cy.contains('الرئيسية').should('be.visible');
    cy.contains('من نحن').should('be.visible');
  });

  it('should handle dynamic parameters in localized routes', () => {
    // انتقل إلى صفحة المنتجات أولاً
    cy.contains('Products').click();
    
    // انقر على رابط منتج محدد
    cy.contains('Product 1').click();
    
    // تحقق من أن عنوان URL يحتوي على معرف المنتج
    cy.url().should('include', '/en/products/1');
    
    // تحقق من أن تفاصيل المنتج تظهر
    cy.contains('Product Details: 1').should('be.visible');
    
    // تغيير اللغة إلى العربية
    cy.contains('العربية').click();
    
    // تحقق من أن عنوان URL تغير إلى المسار العربي مع الحفاظ على معرف المنتج
    cy.url().should('include', '/ar/المنتجات/1');
    
    // تحقق من أن تفاصيل المنتج تظهر بالعربية
    cy.contains('تفاصيل المنتج: 1').should('be.visible');
  });

  it('should handle direct navigation to localized routes', () => {
    // انتقل مباشرة إلى مسار مترجم بالعربية
    cy.visit('/ar/المنتجات');
    
    // تحقق من أن محتوى الصفحة يظهر بالعربية
    cy.contains('صفحة المنتجات').should('be.visible');
    
    // تحقق من أن القائمة الرئيسية تظهر بالعربية أيضًا
    cy.contains('الرئيسية').should('be.visible');
    cy.contains('من نحن').should('be.visible');
  });

  it('should handle protected routes with localization', () => {
    // محاولة الوصول إلى مسار محمي (لوحة التحكم)
    cy.contains('Dashboard').click();
    
    // يجب أن يعيد التوجيه إلى صفحة تسجيل الدخول
    cy.url().should('include', '/en/login');
    cy.contains('Login Page').should('be.visible');
    
    // تسجيل الدخول
    cy.get('button').contains('Sign In').click();
    
    // يجب أن ينتقل إلى لوحة التحكم
    cy.url().should('include', '/en/dashboard');
    cy.contains('Dashboard Page').should('be.visible');
    
    // تغيير اللغة إلى العربية
    cy.contains('العربية').click();
    
    // تحقق من أن عنوان URL تغير إلى المسار العربي مع الحفاظ على نفس الصفحة
    cy.url().should('include', '/ar/لوحة-التحكم');
    cy.contains('صفحة لوحة التحكم').should('be.visible');
  });
});