import { ReactNode, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { i18n, ready } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkResourcesLoaded = () => {
      if (!i18n.isInitialized) {
        return false;
      }

      // Check if all required namespaces are loaded for current language
      const requiredNamespaces = ['common', 'dashboard', 'inventory', 'settings'];
      const currentLanguage = i18n.language || 'en';
      
      const allLoaded = requiredNamespaces.every(ns => 
        i18n.hasResourceBundle(currentLanguage, ns)
      );
      
      if (allLoaded && ready) {
        setIsLoading(false);
        return true;
      }
      return false;
    };

    // Check initially and then periodically until loaded
    const checkInterval = setInterval(() => {
      if (checkResourcesLoaded()) {
        clearInterval(checkInterval);
      }
    }, 100);

    // Also listen for events
    const handleLoaded = () => {
      if (checkResourcesLoaded()) {
        clearInterval(checkInterval);
      }
    };

    const handleLanguageChanged = () => {
      setIsLoading(true); // Reset loading when language changes
      setTimeout(() => checkResourcesLoaded(), 100); // Check after a short delay
    };

    i18n.on('loaded', handleLoaded);
    i18n.on('languageChanged', handleLanguageChanged);
    i18n.on('initialized', handleLoaded);

    // Cleanup
    return () => {
      clearInterval(checkInterval);
      i18n.off('loaded', handleLoaded);
      i18n.off('languageChanged', handleLanguageChanged);
      i18n.off('initialized', handleLoaded);
    };
  }, [i18n, ready]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading translations...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}