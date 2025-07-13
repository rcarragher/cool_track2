import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <span className="font-semibold text-lg">Inventory Tracker</span>
        </div>
        <LanguageSwitcher />
      </header>

      {/* Main content */}
      <main className="flex min-h-screen items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-sm text-muted-foreground">
        <p>&copy; 2024 Inventory Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}