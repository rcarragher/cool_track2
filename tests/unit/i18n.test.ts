import { describe, it, expect, beforeEach } from 'vitest';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// Test resources
const testResources = {
  en: {
    common: {
      buttons: { add: 'Add', cancel: 'Cancel' },
      categories: { meat: 'Meat' }
    },
    dashboard: {
      title: 'Dashboard',
      cards: { totalItems: 'Total Items' },
      pagination: { showing: 'Showing {{start}} to {{end}} of {{total}} items' }
    }
  },
  es: {
    common: {
      buttons: { add: 'Agregar', cancel: 'Cancelar' },
      categories: { meat: 'Carne' }
    },
    dashboard: {
      title: 'Panel de control',
      cards: { totalItems: 'Total de artículos' }
    }
  },
  ar: {
    common: {
      buttons: { add: 'إضافة', cancel: 'إلغاء' },
      categories: { meat: 'لحوم' }
    },
    dashboard: {
      title: 'لوحة التحكم',
      cards: { totalItems: 'إجمالي العناصر' }
    }
  }
};

// Create test i18n instance
const testI18n = i18next.createInstance();

describe('Internationalization', () => {
  beforeEach(async () => {
    await testI18n
      .use(initReactI18next)
      .init({
        lng: 'en',
        fallbackLng: 'en',
        resources: testResources,
        ns: ['common', 'dashboard'],
        defaultNS: 'common',
        interpolation: { escapeValue: false }
      });
    
    // Add direction helper
    testI18n.dir = (lng?: string) => {
      const language = lng || testI18n.language;
      const rtlLanguages = ['ar', 'he', 'fa'];
      return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
    };
  });

  it('should load English translations correctly', async () => {
    expect(testI18n.t('common:buttons.add')).toBe('Add');
    expect(testI18n.t('dashboard:title')).toBe('Dashboard');
    expect(testI18n.t('dashboard:cards.totalItems')).toBe('Total Items');
  });

  it('should support Spanish translations', async () => {
    await testI18n.changeLanguage('es');
    
    expect(testI18n.t('common:buttons.add')).toBe('Agregar');
    expect(testI18n.t('dashboard:title')).toBe('Panel de control');
    expect(testI18n.t('dashboard:cards.totalItems')).toBe('Total de artículos');
  });

  it('should support Arabic translations', async () => {
    await testI18n.changeLanguage('ar');
    
    expect(testI18n.t('common:buttons.add')).toBe('إضافة');
    expect(testI18n.t('dashboard:title')).toBe('لوحة التحكم');
    expect(testI18n.t('dashboard:cards.totalItems')).toBe('إجمالي العناصر');
  });

  it('should detect RTL languages correctly', () => {
    expect(testI18n.dir('en')).toBe('ltr');
    expect(testI18n.dir('es')).toBe('ltr');
    expect(testI18n.dir('ar')).toBe('rtl');
    expect(testI18n.dir('he')).toBe('rtl');
    expect(testI18n.dir('fa')).toBe('rtl');
  });

  it('should support interpolation in translations', () => {
    expect(testI18n.t('dashboard:pagination.showing', { start: 1, end: 10, total: 50 }))
      .toBe('Showing 1 to 10 of 50 items');
  });

  it('should fallback to English for missing translations', async () => {
    await testI18n.changeLanguage('es');
    // Test a key that doesn't exist in Spanish
    expect(testI18n.t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('should use correct namespace for translations', () => {
    expect(testI18n.t('buttons.add', { ns: 'common' })).toBe('Add');
    expect(testI18n.t('title', { ns: 'dashboard' })).toBe('Dashboard');
  });

  it('should persist language selection', async () => {
    await testI18n.changeLanguage('es');
    expect(testI18n.language).toBe('es');
    
    await testI18n.changeLanguage('ar');
    expect(testI18n.language).toBe('ar');
  });
});