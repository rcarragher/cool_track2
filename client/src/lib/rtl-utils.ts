import { useTranslation } from 'react-i18next';

/**
 * Hook to determine if the current language is RTL
 */
export function useIsRTL() {
  const { i18n } = useTranslation();
  return i18n.dir?.() === 'rtl' || ['ar', 'he', 'fa'].includes(i18n.language);
}

/**
 * Utility to convert directional classes to logical properties
 * This helps in migrating existing components to RTL-aware ones
 */
export const rtlClassMap = {
  // Padding
  'pl-': 'ps-', // padding-left -> padding-start
  'pr-': 'pe-', // padding-right -> padding-end
  
  // Margin
  'ml-': 'ms-', // margin-left -> margin-start
  'mr-': 'me-', // margin-right -> margin-end
  
  // Border
  'border-l': 'border-s', // border-left -> border-start
  'border-r': 'border-e', // border-right -> border-end
  
  // Position
  'left-': 'start-', // left -> start
  'right-': 'end-', // right -> end
  
  // Text align
  'text-left': 'text-start',
  'text-right': 'text-end',
} as const;

/**
 * Convert a class string to use logical properties
 */
export function convertToLogicalClasses(classes: string): string {
  let result = classes;
  
  Object.entries(rtlClassMap).forEach(([directional, logical]) => {
    // Handle numbered classes like pl-4, pr-2, etc.
    const directionalRegex = new RegExp(`${directional.replace('-', '\\-')}(\\d+)`, 'g');
    result = result.replace(directionalRegex, `${logical}$1`);
    
    // Handle non-numbered classes
    if (!directional.endsWith('-')) {
      result = result.replace(new RegExp(`\\b${directional}\\b`, 'g'), logical);
    }
  });
  
  return result;
}

/**
 * Get direction-aware class based on current language
 */
export function getRTLClass(ltrClass: string, rtlClass: string, isRTL?: boolean): string {
  return isRTL ? rtlClass : ltrClass;
}