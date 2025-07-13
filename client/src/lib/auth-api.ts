import { z } from 'zod';

// Types for authentication API
export interface User {
  id: number;
  email: string;
  role: string;
  householdId: number;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  sessionId: string;
  message: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: string[];
}

// Request schemas matching backend
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  householdName: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"]
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

// API client functions
class AuthApiClient {
  private baseUrl = '/api/auth';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session management
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      // If there are validation details, include them in the error message
      if (data.details && Array.isArray(data.details)) {
        // Handle ZodError format (array of issue objects) or simple string array
        const detailsText = data.details.map((detail: any) => {
          if (typeof detail === 'string') {
            return detail;
          } else if (detail.message) {
            return detail.message;
          } else {
            return String(detail);
          }
        }).join(', ');
        throw new Error(`${data.message || data.error}: ${detailsText}`);
      }
      throw new Error(data.message || data.error || 'An error occurred');
    }

    return data;
  }

  login = async (credentials: LoginData): Promise<AuthResponse> => {
    return this.request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  register = async (userData: Omit<RegisterData, 'confirmPassword'>): Promise<AuthResponse> => {
    return this.request<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  logout = async (): Promise<{ message: string }> => {
    return this.request<{ message: string }>('/logout', {
      method: 'POST',
    });
  }

  getCurrentUser = async (): Promise<{ user: User }> => {
    return this.request<{ user: User }>('/me');
  }

  changePassword = async (passwordData: Omit<ChangePasswordData, 'confirmNewPassword'>): Promise<{ message: string; sessionId: string }> => {
    return this.request<{ message: string; sessionId: string }>('/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  logoutAll = async (): Promise<{ message: string; destroyedSessions: number }> => {
    return this.request<{ message: string; destroyedSessions: number }>('/logout-all', {
      method: 'POST',
    });
  }
}

export const authApi = new AuthApiClient();

// Password strength validation
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Password strength score (0-4)
export function getPasswordStrength(password: string): {
  score: number;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
} {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
  
  return {
    score,
    label: labels[score],
    color: colors[score]
  };
}