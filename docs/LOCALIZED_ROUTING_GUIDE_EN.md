# Localized Routing Guide

## Overview

The localized routing system in GplusApp provides a comprehensive way to handle translated URLs in React applications. This system allows displaying routes in the user's selected language while maintaining normal navigation and operation functionality.

## Key Features

- **Translated Routes**: Display URLs in the user's selected language
- **Path-preserving Language Switching**: Change language while navigating to the same page with the translated path
- **Dynamic Parameter Support**: Handle dynamic parameters in translated routes
- **Seamless Integration with React Router**: Use standard React Router interfaces
- **Custom React Hooks**: Simplify the use of translated routes in components

## Core Components

### 1. `LocalizedRouter`

The main component that handles multilingual routes:

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
          {/* More routes... */}
        </Routes>
      </LocalizedRouter>
    </LanguageProvider>
  );
};

export default App;
```

### 2. `LocalizedLink`

A custom link component that automatically handles translated paths:

```jsx
import React from 'react';
import LocalizedLink from './components/common/LocalizedLink';

const Navigation = () => {
  return (
    <nav>
      <LocalizedLink to="/">Home</LocalizedLink>
      <LocalizedLink to="/products">Products</LocalizedLink>
      <LocalizedLink to="/about">About Us</LocalizedLink>
    </nav>
  );
};
```

### 3. `LanguageSwitcherWithRoute`

A language switcher component that preserves the current path:

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

### 4. Localized Routing Hooks

Custom React hooks for working with translated routes:

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
      <button onClick={handleNavigate}>Go to Products</button>
      <a href={localizedLink('/about')}>About Us</a>
    </div>
  );
};
```

## Configuring Translated Routes

Translated routes are defined in a mapping object that links internal routes to translated routes for each language:

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

You can modify this object to add new routes or additional languages.

## Available Hooks

### 1. `useLocalizedRouting`

Provides functions for working with translated routes:

```javascript
const {
  currentInternalPath, // Current internal path
  params,              // Current URL parameters
  navigateTo,          // Navigate to a translated path
  getFullLocalizedPath,// Get the full translated path
  changeRouteLanguage  // Change the language of the current path
} = useLocalizedRouting();
```

### 2. `useLocalizedLink`

Provides a function for creating translated paths for use with regular links:

```javascript
const localizedLink = useLocalizedLink();
const aboutLink = localizedLink('/about'); // '/ar/من-نحن' in Arabic
```

### 3. `useLanguageChanger`

Provides a function for changing the language with route updates:

```javascript
const changeLanguageAndRoute = useLanguageChanger();
// Change language to English and update the route
changeLanguageAndRoute('en');
```

## Usage Examples

### 1. Localized Protected Route

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

### 2. Localized Breadcrumbs

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
      {/* Page content... */}
    </div>
  );
};
```

## Best Practices

### 1. Always Use Internal Routes in Code

When referring to routes in code, always use internal (non-translated) routes:

```jsx
// ✅ Correct
<LocalizedLink to="/products" />

// ❌ Incorrect
<LocalizedLink to="/المنتجات" />
```

### 2. Handle Dynamic Parameters Correctly

When defining translated routes, make sure to define all dynamic parameters:

```javascript
const ROUTE_MAPPINGS = {
  ar: {
    '/products/:id': '/المنتجات/:id',
    '/users/:userId/posts/:postId': '/المستخدمون/:userId/المنشورات/:postId'
  }
};
```

### 3. Plan a Logical Path Structure for Each Language

- Try to maintain the same path structure as much as possible between languages
- Avoid completely different paths between languages
- Use underscores or hyphens for multi-word paths in Arabic

### 4. Test All Routes in Each Language

Make sure to test routes in all supported languages to ensure they work properly:

- User navigation between pages
- Switching languages on different pages
- Using direct links to translated routes
- Handling dynamic routes

## Customization and Extension

### 1. Adding New Languages

To add a new language, add its definitions to `LANGUAGE_CONSTANTS` and add route mappings:

```javascript
// constants/i18n.js
export const LANGUAGE_CONSTANTS = {
  DEFAULT_LANGUAGE: 'en',
  SUPPORTED_LANGUAGES: ['en', 'ar', 'fr'], // Adding French
  RTL_LANGUAGES: ['ar']
};

// components/common/LocalizedRouter.jsx
const ROUTE_MAPPINGS = {
  en: { /* English routes */ },
  ar: { /* Arabic routes */ },
  fr: {
    '/': '/',
    '/login': '/connexion',
    '/products': '/produits',
    '/about': '/a-propos',
    // More routes...
  }
};
```

### 2. External Route Mappings Storage

Translated routes can be loaded from an external JSON file:

```javascript
import React, { useEffect, useState } from 'react';

const LocalizedRouter = ({ children }) => {
  const [routeMappings, setRouteMappings] = useState({});
  
  useEffect(() => {
    // Load route mappings from a JSON file
    fetch('/locales/route-mappings.json')
      .then(response => response.json())
      .then(data => setRouteMappings(data))
      .catch(error => console.error('Error loading route mappings:', error));
  }, []);
  
  if (Object.keys(routeMappings).length === 0) {
    return <div>Loading...</div>;
  }
  
  // Rest of LocalizedRouter implementation...
};
```

### 3. SEO and Search Engines

To improve search engine experience, add alternate link tags in the page head:

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

## Conclusion

The localized routing system provides a comprehensive solution for creating a complete multilingual user experience in React applications. Using the available components and hooks, you can create an application that adapts to the user's language, not just in page content but also in URL structure.

Thanks to the seamless integration with React Router, you can continue using the same routing patterns you're used to, while taking advantage of translation and multilingual routing features.