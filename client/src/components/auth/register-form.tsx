import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { useAuth } from '@/contexts/auth-context';
import { registerSchema, type RegisterData, validatePasswordStrength, getPasswordStrength } from '@/lib/auth-api';

export function RegisterForm() {
  const { t } = useTranslation();
  const { register: registerUser, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      householdName: '',
    },
  });

  const watchedPassword = watch('password');
  const passwordStrength = watchedPassword ? getPasswordStrength(watchedPassword) : null;
  const passwordValidation = watchedPassword ? validatePasswordStrength(watchedPassword) : null;

  const onSubmit = async (data: RegisterData) => {
    if (!acceptTerms) {
      return;
    }

    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate('/');
    } catch (error) {
      console.error('Registration form error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t('auth.register.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('auth.register.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.register.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.register.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register('password')}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? 'Hide password' : 'Show password'}
                  </span>
                </Button>
              </div>
              
              {/* Password strength indicator */}
              {watchedPassword && passwordStrength && (
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
                    style={{
                      background: `linear-gradient(to right, ${passwordStrength.color} ${(passwordStrength.score / 4) * 100}%, #e5e7eb ${(passwordStrength.score / 4) * 100}%)`
                    }}
                  />
                </div>
              )}

              {/* Password requirements */}
              {watchedPassword && passwordValidation && (
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

              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.register.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
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
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="householdName">{t('auth.register.householdNameOptional')}</Label>
              <Input
                id="householdName"
                type="text"
                placeholder="My Household"
                {...register('householdName')}
                className={errors.householdName ? 'border-destructive' : ''}
              />
              {errors.householdName && (
                <p className="text-sm text-destructive">{errors.householdName.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                required
              />
              <Label
                htmlFor="terms"
                className="text-sm font-normal cursor-pointer"
              >
                {t('auth.register.terms')}
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !acceptTerms || (passwordValidation ? !passwordValidation.isValid : false)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.loading.creatingAccount')}
                </>
              ) : (
                t('auth.register.submit')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t('auth.register.hasAccount')} </span>
            <Link href="/auth/login">
              <Button variant="link" className="px-0 text-sm">
                {t('auth.register.signIn')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}