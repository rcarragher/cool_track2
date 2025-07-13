import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, type User, type LoginData, type RegisterData, type ChangePasswordData } from '@/lib/auth-api';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<void>;
  register: (userData: Omit<RegisterData, 'confirmPassword'>) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (passwordData: Omit<ChangePasswordData, 'confirmNewPassword'>) => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Query to get current user
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update user state when query data changes
  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user);
    } else if (error) {
      setUser(null);
    }
  }, [userData, error]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['auth', 'user'], { user: data.user });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(t('auth.success.loginSuccess'));
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
      // Map common error messages to translation keys
      const errorMessage = getErrorMessage(error.message, t);
      toast.error(errorMessage);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['auth', 'user'], { user: data.user });
      toast.success(t('auth.success.registerSuccess'));
    },
    onError: (error: Error) => {
      console.error('Register error:', error);
      const errorMessage = getErrorMessage(error.message, t);
      toast.error(errorMessage);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear(); // Clear all cached data
      toast.success(t('auth.success.logoutSuccess'));
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      setUser(null);
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
      toast.error(t('auth.errors.serverError'));
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success(t('auth.success.passwordChanged'));
    },
    onError: (error: Error) => {
      console.error('Change password error:', error);
      const errorMessage = getErrorMessage(error.message, t);
      toast.error(errorMessage);
    },
  });

  // Logout all sessions mutation
  const logoutAllMutation = useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: (data) => {
      setUser(null);
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
      toast.success(`${t('auth.success.logoutSuccess')} (${data.destroyedSessions} sessions)`);
    },
    onError: (error: Error) => {
      console.error('Logout all error:', error);
      const errorMessage = getErrorMessage(error.message, t);
      toast.error(errorMessage);
    },
  });

  const contextValue: AuthContextType = {
    user,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated: !!user,
    login: async (credentials: LoginData) => {
      await loginMutation.mutateAsync(credentials);
    },
    register: async (userData: Omit<RegisterData, 'confirmPassword'>) => {
      await registerMutation.mutateAsync(userData);
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    changePassword: async (passwordData: Omit<ChangePasswordData, 'confirmNewPassword'>) => {
      await changePasswordMutation.mutateAsync(passwordData);
    },
    logoutAll: async () => {
      await logoutAllMutation.mutateAsync();
    },
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to map error messages to translation keys
function getErrorMessage(errorMessage: string, t: any): string {
  const errorMappings: Record<string, string> = {
    'Invalid email or password': 'auth.errors.invalidCredentials',
    'Invalid credentials': 'auth.errors.invalidCredentials',
    'User already exists': 'auth.errors.emailExists',
    'An account with this email address already exists': 'auth.errors.emailExists',
    'Your session has expired': 'auth.errors.sessionExpired',
    'Invalid session': 'auth.errors.sessionExpired',
    'Authentication required': 'auth.errors.authRequired',
    'Please log in to access this resource': 'auth.errors.authRequired',
    'Access denied': 'auth.errors.accessDenied',
    'Too many registration attempts': 'auth.errors.rateLimitExceeded',
    'Too many login attempts': 'auth.errors.rateLimitExceeded',
    'Invalid current password': 'auth.errors.invalidCurrentPassword',
    'The current password you entered is incorrect': 'auth.errors.invalidCurrentPassword',
    'No account found with this email address': 'auth.errors.userNotFound',
  };

  // Check for exact matches first
  if (errorMappings[errorMessage]) {
    return t(errorMappings[errorMessage]);
  }

  // Check for partial matches
  for (const [key, translationKey] of Object.entries(errorMappings)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return t(translationKey);
    }
  }

  // Check for network errors
  if (errorMessage.toLowerCase().includes('network') || 
      errorMessage.toLowerCase().includes('fetch') ||
      errorMessage.toLowerCase().includes('connection')) {
    return t('auth.errors.networkError');
  }

  // Default to server error
  return t('auth.errors.serverError');
}