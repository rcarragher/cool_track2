import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useEffect } from 'react';

const languages = [
  { code: 'en', name: 'English', dir: 'ltr', flag: '🇺🇸' },
  { code: 'es', name: 'Español', dir: 'ltr', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', dir: 'rtl', flag: '🇸🇦' },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = async (languageCode: string) => {
    const language = languages.find(lang => lang.code === languageCode);
    if (language) {
      try {
        // Change language and wait for it to load
        await i18n.changeLanguage(languageCode);
        
        // Update document direction
        document.documentElement.dir = language.dir;
        document.documentElement.lang = languageCode;
        
        // Update localStorage for persistence (i18next may already do this)
        localStorage.setItem('coolkeeper-language', languageCode);
      } catch (error) {
        console.error('Failed to change language:', error);
      }
    }
  };

  // Set initial direction on mount
  useEffect(() => {
    const currentLanguage = languages.find(lang => lang.code === i18n.language);
    if (currentLanguage) {
      document.documentElement.dir = currentLanguage.dir;
      document.documentElement.lang = i18n.language;
    }
  }, [i18n.language]);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-40">
        <SelectValue>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{currentLanguage.flag}</span>
            <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{language.flag}</span>
              <span className="text-sm font-medium">{language.code.toUpperCase()}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}