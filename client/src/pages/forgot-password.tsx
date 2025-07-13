import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { ArrowLeft, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Password Reset
          </CardTitle>
          <CardDescription>
            This feature is coming soon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Password reset functionality is currently under development. 
              For now, you can change your password from within the application 
              after logging in.
            </p>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Temporary workaround:</strong><br />
                Log in with your current password, then use the "Change Password" 
                option in the user menu to update your credentials.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/auth/login">
              <Button className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </Link>
            
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Need help? </span>
              <span className="text-primary font-medium">Contact Support</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}