/**
 * @file BreadcrumbsExample.jsx - مثال على استخدام مكون المسار الهيكلي
 */

import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LocalizedBreadcrumbs from './LocalizedBreadcrumbs';

/**
 * مكون صفحة المنتج
 * @returns {React.ReactElement}
 */
const ProductPage = () => (
  <div className="product-page">
    <LocalizedBreadcrumbs 
      routes={{
        '/products': 'navigation.productsPage',
        '/products/categories': 'navigation.categories'
      }}
      dynamicSegments={{
        '/products/categories/:categoryId': (categoryId) => `category.${categoryId}`,
        '/products/:productId': (productId) => `product.${productId}`
      }}
      separator="›"
      styles={{
        backgroundColor: '#f5f5f5',
        padding: '10px 15px',
        borderRadius: '4px'
      }}
    />
    
    <h1>محتوى صفحة المنتج</h1>
    {/* باقي محتوى الصفحة */}
  </div>
);

/**
 * مكون صفحة المستخدم
 * @returns {React.ReactElement}
 */
const UserPage = () => (
  <div className="user-page">
    <LocalizedBreadcrumbs 
      routes={{
        '/users': 'navigation.usersPage'
      }}
      dynamicSegments={{
        '/users/:userId': (userId) => `user.${userId}`,
        '/users/:userId/settings': 'navigation.userSettings'
      }}
      showHome={true}
      separator="/"
    />
    
    <h1>صفحة المستخدم</h1>
    {/* باقي محتوى الصفحة */}
  </div>
);

/**
 * مثال على كيفية استخدام مكون LocalizedBreadcrumbs في التطبيق
 * @returns {React.ReactElement}
 */
const BreadcrumbsExample = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header>
          {/* رأس التطبيق */}
        </header>
        
        {/* المسار الهيكلي العام للتطبيق */}
        <LocalizedBreadcrumbs 
          routes={{
            '/': 'navigation.home',
            '/products': 'navigation.products',
            '/services': 'navigation.services',
            '/about': 'navigation.about',
            '/contact': 'navigation.contact'
          }}
        />
        
        {/* طرق التطبيق */}
        <Routes>
          <Route path="/products/*" element={<ProductPage />} />
          <Route path="/users/*" element={<UserPage />} />
          {/* طرق أخرى */}
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default BreadcrumbsExample;