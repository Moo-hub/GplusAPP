import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
  { code: 'de', label: 'DE' },
  { code: 'es', label: 'ES' },
];

export default function Header() {
  const { i18n, t } = useTranslation();
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  return (
    <header className="flex items-center justify-between py-4 px-2 mb-4 bg-primary-light dark:bg-gray-800 rounded-card shadow">
      <div className="flex items-center gap-2">
        <span className="text-primary-dark font-bold text-xl">GPlus</span>
      </div>
      <div className="flex items-center gap-2">
        <select
          className="rounded px-2 py-1 border border-primary-dark bg-white dark:bg-gray-700 dark:text-white"
          value={i18n.language}
          onChange={e => i18n.changeLanguage(e.target.value)}
        >
          {languages.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <button
          className="ml-2 px-2 py-1 rounded bg-primary-dark text-white dark:bg-primary-light dark:text-primary-dark"
          onClick={() => setDark(d => !d)}
          aria-label={t('dark_mode')}
        >
          {t('dark_mode')}
        </button>
      </div>
    </header>
  );
}


