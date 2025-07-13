import { useState } from 'react';
import { Menu, User, LogOut, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { LanguageSwitcher } from './language-switcher';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context';

interface HeaderMenuProps {
  onSettingsClick: () => void;
  onChangePasswordClick?: () => void;
}

export function HeaderMenu({ onSettingsClick, onChangePasswordClick }: HeaderMenuProps) {
  const { t } = useTranslation(['common']);
  const { user, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{user?.email}</span>
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* User info section */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.email}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.role === 'admin' && (
                <span className="inline-flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Administrator
                </span>
              )}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Settings */}
        <DropdownMenuItem onClick={onSettingsClick}>
          <Settings className="mr-2 h-4 w-4" />
          <span>{t('common:menu.settings')}</span>
        </DropdownMenuItem>
        
        {/* Change Password */}
        {onChangePasswordClick && (
          <DropdownMenuItem onClick={onChangePasswordClick}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Change Password</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Language switcher */}
        <div className="px-2 py-1.5">
          <LanguageSwitcher />
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('common:menu.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}