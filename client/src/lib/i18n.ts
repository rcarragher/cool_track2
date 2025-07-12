import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)  
  .use(initReactI18next)
  .init({
    lng: 'en', // Default language
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    backend: {
      // Path to load translations from
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // Add proper error handling
      requestOptions: {
        cache: 'no-cache'
      }
    },

    detection: {
      // Language detection options
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'coolkeeper-language',
    },

    // Define namespaces
    ns: ['common', 'dashboard', 'inventory', 'settings'],
    defaultNS: 'common',

    // Load all namespaces initially
    preload: ['en', 'es', 'ar'],
    
    // React options
    react: {
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'],
      useSuspense: false, // Disable suspense to avoid loading issues
    },
  });

// Add direction information for languages
i18n.services.formatter?.add('direction', (value, lng) => {
  const rtlLanguages = ['ar', 'he', 'fa'];
  return rtlLanguages.includes(lng || i18n.language) ? 'rtl' : 'ltr';
});

// Helper to get text direction
i18n.dir = (lng?: string) => {
  const language = lng || i18n.language;
  const rtlLanguages = ['ar', 'he', 'fa'];
  return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
};

export default i18n;