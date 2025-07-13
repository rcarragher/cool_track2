import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/components/i18n-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { ForgotPasswordPage } from "@/pages/forgot-password";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Authentication routes */}
      <Route path="/auth/login">
        <ProtectedRoute requireAuth={false}>
          <AuthLayout>
            <LoginForm />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/auth/register">
        <ProtectedRoute requireAuth={false}>
          <AuthLayout>
            <RegisterForm />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/auth/forgot-password">
        <ProtectedRoute requireAuth={false}>
          <AuthLayout>
            <ForgotPasswordPage />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Catch-all route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <SonnerToaster position="top-right" />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
