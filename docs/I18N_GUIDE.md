# Internationalization (i18n) Guide for G+ Recycling App

## Overview

The G+ Recycling App supports multiple languages to serve a diverse user base. This guide provides comprehensive information about the internationalization (i18n) implementation, including the architecture, supported languages, translation workflow, and development guidelines.

## Table of Contents

1. [Supported Languages](#supported-languages)
2. [Technical Architecture](#technical-architecture)
3. [File Structure](#file-structure)
4. [Configuration](#configuration)
5. [Implementation for Developers](#implementation-for-developers)
6. [RTL (Right-to-Left) Support](#rtl-right-to-left-support)
7. [Translation Management](#translation-management)
8. [Testing Internationalization](#testing-internationalization)
9. [Best Practices](#best-practices)
10. [Future Enhancements](#future-enhancements)

## Supported Languages

The G+ Recycling App currently supports the following languages:

| Language | Locale Code | RTL | Status      |
|----------|-------------|-----|-------------|
| English  | en          | No  | Complete    |
| Arabic   | ar          | Yes | Complete    |
| Spanish  | es          | No  | Planned     |
| French   | fr          | No  | Planned     |
| German   | de          | No  | Planned     |

## Technical Architecture

The internationalization system in G+ Recycling App is built using the following technologies:

1. **react-i18next**: Core library for internationalization in React
2. **i18next**: Underlying internationalization framework
3. **i18next-http-backend**: Backend plugin for loading translations
4. **i18next-browser-languagedetector**: Language detection plugin
5. **Custom language switcher**: UI component for changing languages
6. **CSS variables**: For language-specific styling adjustments

### Architecture Diagram

```
┌─────────────────────────┐
│      React App          │
│                         │
│  ┌───────────────────┐  │
│  │   i18n Provider   │  │
│  └─────────┬─────────┘  │
│            │            │
│  ┌─────────▼─────────┐  │
│  │  Translation Hook │  │
│  └─────────┬─────────┘  │
│            │            │
│  ┌─────────▼─────────┐  │
│  │ UI Components     │  │
│  │ with t() function │  │
│  └───────────────────┘  │
│                         │
└─────────────┬───────────┘
              │
┌─────────────▼───────────┐
│   Translation Files     │
│                         │
│  ┌───────────────────┐  │
│  │  en/translation   │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │  ar/translation   │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ Other languages   │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

## File Structure

The internationalization files are organized as follows:

```
src/
├── i18n.js                 # Main i18n configuration
├── components/
│   └── LanguageSwitcher.jsx # Language selection component
├── locales/
│   ├── en/
│   │   ├── common.json     # Common translation strings
│   │   ├── auth.json       # Authentication-related strings
│   │   ├── pickups.json    # Pickup request strings
│   │   ├── dashboard.json  # Dashboard strings
│   │   └── errors.json     # Error messages
│   │
│   └── ar/
│       ├── common.json
│       ├── auth.json
│       ├── pickups.json
│       ├── dashboard.json
│       └── errors.json
```

## Configuration

### Main i18n Configuration

The core i18n functionality is configured in `src/i18n.js`:

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // Load translations from the locales folder
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    fallbackLng: 'en',
    // Debug output in console (disable in production)
    debug: process.env.NODE_ENV === 'development',
    // Separate namespaces for better organization
    ns: ['common', 'auth', 'pickups', 'dashboard', 'errors'],
    defaultNS: 'common',
    // Interpolation settings
    interpolation: {
      escapeValue: false, // Not needed for React
    },
    // Backend settings for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: true,
    },
  });

// Function to set document direction based on language
export const setLanguageDirection = (language) => {
  const direction = language === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = language;
  document.body.setAttribute('dir', direction);
  
  // Set the CSS variable for RTL awareness
  document.documentElement.style.setProperty('--text-direction', direction);
};

// Add language direction change on language change
i18n.on('languageChanged', (lng) => {
  setLanguageDirection(lng);
});

export default i18n;
```

### Environment Variables

Language-related environment variables can be configured in `.env`:

```
# Default language (will be overridden by user preference)
VITE_DEFAULT_LANGUAGE=en

# Enable/disable language auto-detection
VITE_AUTO_DETECT_LANGUAGE=true

# Available languages (comma-separated)
VITE_AVAILABLE_LANGUAGES=en,ar
```

## Implementation for Developers

### Basic Usage

To use translations in React components:

```jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

function MyComponent() {
  // Get the translation function and the current language
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      {/* Simple translation */}
      <h1>{t('common:welcome')}</h1>
      
      {/* Translation with variables */}
      <p>{t('common:greeting', { name: 'User' })}</p>
      
      {/* Plural forms */}
      <p>{t('pickups:requestCount', { count: 5 })}</p>
      
      {/* Button to change language */}
      <button onClick={() => i18n.changeLanguage('ar')}>
        {t('common:switchToArabic')}
      </button>
    </div>
  );
}

export default MyComponent;
```

### Translation Files

Example of a translation file (`locales/en/common.json`):

```json
{
  "welcome": "Welcome to G+ Recycling App",
  "greeting": "Hello, {{name}}!",
  "switchToArabic": "Switch to Arabic",
  "switchToEnglish": "Switch to English",
  "nav": {
    "home": "Home",
    "companies": "Companies",
    "pickups": "Pickups",
    "profile": "Profile",
    "login": "Login",
    "register": "Register",
    "logout": "Logout",
    "hello": "Hello, {{name}}"
  },
  "footer": {
    "rights": "All rights reserved",
    "privacy": "Privacy Policy",
    "terms": "Terms of Service"
  }
}
```

Example of an Arabic translation file (`locales/ar/common.json`):

```json
{
  "welcome": "مرحبا بك في تطبيق إعادة التدوير G+",
  "greeting": "مرحبًا، {{name}}!",
  "switchToArabic": "التبديل إلى العربية",
  "switchToEnglish": "التبديل إلى الإنجليزية",
  "nav": {
    "home": "الرئيسية",
    "companies": "الشركات",
    "pickups": "طلبات الاستلام",
    "profile": "الملف الشخصي",
    "login": "تسجيل الدخول",
    "register": "إنشاء حساب",
    "logout": "تسجيل الخروج",
    "hello": "مرحبًا، {{name}}"
  },
  "footer": {
    "rights": "جميع الحقوق محفوظة",
    "privacy": "سياسة الخصوصية",
    "terms": "شروط الاستخدام"
  }
}
```

### Language Switcher Component

A language switcher component can be implemented like this:

```jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  return (
    <div className="language-switcher">
      <button
        className={i18n.language === 'en' ? 'active' : ''}
        onClick={() => changeLanguage('en')}
      >
        {t('common:languages.english')}
      </button>
      <button
        className={i18n.language === 'ar' ? 'active' : ''}
        onClick={() => changeLanguage('ar')}
      >
        {t('common:languages.arabic')}
      </button>
    </div>
  );
};

export default LanguageSwitcher;
```

## RTL (Right-to-Left) Support

The G+ Recycling App fully supports right-to-left languages like Arabic. This is implemented through:

### 1. Dynamic HTML Direction Attribute

As shown in the i18n configuration, the app sets the appropriate `dir` attribute on the HTML elements:

```javascript
// Function to set document direction based on language
export const setLanguageDirection = (language) => {
  const direction = language === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = language;
  document.body.setAttribute('dir', direction);
  
  // Set the CSS variable for RTL awareness
  document.documentElement.style.setProperty('--text-direction', direction);
};
```

### 2. CSS Variables for RTL Support

CSS variables are used to handle RTL styling:

```css
:root {
  --text-direction: ltr;
  --start: left;
  --end: right;
}

[dir="rtl"] {
  --start: right;
  --end: left;
}

.element {
  margin-inline-start: 10px;  /* Uses --start direction */
  margin-inline-end: 20px;    /* Uses --end direction */
  text-align: start;          /* Aligns to --start */
}

/* For flexbox layouts */
.flex-container {
  display: flex;
  flex-direction: row;
}

[dir="rtl"] .flex-container {
  flex-direction: row-reverse;
}
```

### 3. Mirrored Icons and UI Elements

For icons and UI elements that need mirroring:

```jsx
import { ArrowLeft, ArrowRight } from './icons';

function DirectionalArrow() {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  
  // Show the appropriate arrow based on the text direction
  return isRTL ? <ArrowLeft /> : <ArrowRight />;
}
```

## Translation Management

### Translation Workflow

1. **Extract Keys**: Use `i18next-scanner` to automatically extract translation keys from source code
2. **Generate Template**: Create a template file with all keys for translators
3. **Translation**: Translators fill in the missing translations
4. **Import**: Import completed translations back into the project
5. **Validation**: Validate translations for completeness and formatting

### Translation Extraction Script

A script in `package.json` to extract translations:

```json
"scripts": {
  "extract-translations": "i18next-scanner --config i18next-scanner.config.js 'src/**/*.{js,jsx}'"
}
```

### i18next-scanner Configuration

Configuration for the translation extractor (`i18next-scanner.config.js`):

```javascript
module.exports = {
  input: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!**/node_modules/**'
  ],
  output: './src/locales/',
  options: {
    debug: true,
    func: {
      list: ['t', 'i18next.t', 'i18n.t'],
      extensions: ['.js', '.jsx']
    },
    lngs: ['en', 'ar'],
    ns: ['common', 'auth', 'pickups', 'dashboard', 'errors'],
    defaultLng: 'en',
    defaultNs: 'common',
    defaultValue: '',
    resource: {
      loadPath: '{{lng}}/{{ns}}.json',
      savePath: '{{lng}}/{{ns}}.json',
      jsonIndent: 2,
      lineEnding: '\n'
    },
    context: false
  }
};
```

## Testing Internationalization

### Manual Testing

1. Switch to each supported language in the UI
2. Verify that all text elements are correctly translated
3. Check RTL support for Arabic
4. Ensure that dates, numbers, and currency formats are correct

### Automated Testing

Example test for internationalization using React Testing Library:

```jsx
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18nForTests';
import MyComponent from './MyComponent';

// Setup test i18n instance
beforeAll(() => {
  i18n.init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        common: {
          welcome: 'Welcome to G+ Recycling App',
        },
      },
      ar: {
        common: {
          welcome: 'مرحبا بك في تطبيق إعادة التدوير G+',
        },
      },
    },
  });
});

test('displays correct translation for English', () => {
  i18n.changeLanguage('en');
  
  render(
    <I18nextProvider i18n={i18n}>
      <MyComponent />
    </I18nextProvider>
  );
  
  expect(screen.getByText('Welcome to G+ Recycling App')).toBeInTheDocument();
});

test('displays correct translation for Arabic', () => {
  i18n.changeLanguage('ar');
  
  render(
    <I18nextProvider i18n={i18n}>
      <MyComponent />
    </I18nextProvider>
  );
  
  expect(screen.getByText('مرحبا بك في تطبيق إعادة التدوير G+')).toBeInTheDocument();
});
```

## Best Practices

### For Developers

1. **Use translation keys with namespace**: Always use namespaced keys like `t('namespace:key')` for better organization
2. **Avoid string concatenation**: Use interpolation variables instead
   - Bad: `t('hello') + ' ' + userName`
   - Good: `t('greeting', { name: userName })`
3. **Format dates and numbers**: Use i18next's formatting functions
   - `i18n.format(date, 'date')`
   - `i18n.format(number, 'number')`
4. **Handle plurals correctly**: Use count parameter for pluralization
   - `t('items', { count: itemCount })`
5. **Implement lazy loading**: Load translations only when needed to improve performance

### For Translators

1. **Maintain placeholders**: Keep all variable placeholders like `{{name}}` intact
2. **Respect HTML tags**: Preserve HTML tags in translations
3. **Consider context**: Some words have different meanings in different contexts
4. **Test your translations**: Verify that translations fit in the UI without breaking layouts
5. **Respect pluralization rules**: Different languages have different pluralization rules

## Future Enhancements

1. **Additional Languages**: Support for Spanish, French, German, and more
2. **Translation Memory**: Implement a translation memory system to improve consistency
3. **Machine Translation Integration**: Add machine translation for initial drafts
4. **In-Context Editing**: Allow translating directly in the UI
5. **Translation Quality Metrics**: Implement tools to measure translation quality
6. **Terminology Management**: Create a glossary of approved terms for consistency

## Related Documentation

- [React i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [RTL Styling Best Practices](https://rtlstyling.com/posts/rtl-styling)