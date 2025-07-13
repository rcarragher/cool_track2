import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { useAuth } from '@/contexts/auth-context';
import { changePasswordSchema, type ChangePasswordData, validatePasswordStrength, getPasswordStrength } from '@/lib/auth-api';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ChangePasswordForm({ onSuccess, onCancel }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const { changePassword, isLoading } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const watchedNewPassword = watch('newPassword');
  const passwordStrength = watchedNewPassword ? getPasswordStrength(watchedNewPassword) : null;
  const passwordValidation = watchedNewPassword ? validatePasswordStrength(watchedNewPassword) : null;

  const onSubmit = async (data: ChangePasswordData) => {
    try {
      const { confirmNewPassword, ...changePasswordData } = data;
      await changePassword(changePasswordData);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Change password form error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          {t('auth.changePassword.title')}
        </CardTitle>
        <CardDescription>
          {t('auth.changePassword.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('auth.changePassword.currentPassword')}</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('currentPassword')}
                className={errors.currentPassword ? 'border-destructive pr-10' : 'pr-10'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                tabIndex={-1}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showCurrentPassword ? 'Hide password' : 'Show password'}
                </span>
              </Button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('auth.changePassword.newPassword')}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('newPassword')}
                className={errors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showNewPassword ? 'Hide password' : 'Show password'}
                </span>
              </Button>
            </div>
            
            {/* Password strength indicator */}
            {watchedNewPassword && passwordStrength && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Password strength:</span>
                  <span style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
                <Progress 
                  value={(passwordStrength.score / 4) * 100} 
                  className="h-2"
                  // style={{
                  //   background: `linear-gradient(to right, ${passwordStrength.color} ${(passwordStrength.score / 4) * 100}%, #e5e7eb ${(passwordStrength.score / 4) * 100}%)`
                  // }}
                />
              </div>
            )}

            {/* Password requirements */}
            {watchedNewPassword && passwordValidation && (
              <div className="space-y-1">
                {passwordValidation.errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <X className="h-3 w-3 text-destructive" />
                    <span className="text-destructive">{error}</span>
                  </div>
                ))}
                {passwordValidation.isValid && (
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">Password meets all requirements</span>
                  </div>
                )}
              </div>
            )}

            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">{t('auth.changePassword.confirmNewPassword')}</Label>
            <div className="relative">
              <Input
                id="confirmNewPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('confirmNewPassword')}
                className={errors.confirmNewPassword ? 'border-destructive pr-10' : 'pr-10'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showConfirmPassword ? 'Hide password' : 'Show password'}
                </span>
              </Button>
            </div>
            {errors.confirmNewPassword && (
              <p className="text-sm text-destructive">{errors.confirmNewPassword.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || (passwordValidation ? !passwordValidation.isValid : false)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.loading.updatingPassword')}
                </>
              ) : (
                t('auth.changePassword.submit')
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                {t('auth.changePassword.cancel')}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}