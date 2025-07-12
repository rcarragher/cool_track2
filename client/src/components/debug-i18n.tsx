import { useTranslation } from 'react-i18next';

export function DebugI18n() {
  const { i18n, t, ready } = useTranslation();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">i18n Debug Info</h3>
      <div>Language: {i18n.language}</div>
      <div>Ready: {ready ? 'true' : 'false'}</div>
      <div>Initialized: {i18n.isInitialized ? 'true' : 'false'}</div>
      <div>Loaded Languages: {Object.keys(i18n.store.data).join(', ')}</div>
      <div>Test Translation: {t('common:buttons.add')}</div>
      <div>Resources Keys: {JSON.stringify(Object.keys(i18n.getResourceBundle('en', 'common') || {}))}</div>
    </div>
  );
}