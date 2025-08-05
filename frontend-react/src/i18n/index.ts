import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';

const resources = {
  en: {
    translation: enTranslations
  },
  hi: {
    translation: hiTranslations
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: true, // Enable debug mode to see what's happening
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Add language change listener for debugging
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  localStorage.setItem('i18nextLng', lng);
});

// Initialize language from localStorage if available
const savedLanguage = localStorage.getItem('i18nextLng');
if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi')) {
  i18n.changeLanguage(savedLanguage);
}

export default i18n; 