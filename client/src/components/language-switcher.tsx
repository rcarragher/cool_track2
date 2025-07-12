import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useEffect } from 'react';

const languages = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
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
      <SelectTrigger className="w-32">
        <SelectValue placeholder={currentLanguage.name} />
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <span className={language.dir === 'rtl' ? 'font-arabic' : ''}>
              {language.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}