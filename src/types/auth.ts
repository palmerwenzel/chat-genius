import type { User, AuthError } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

export interface EmailSignInData {
  email: string;
  password: string;
}

export interface EmailSignUpData extends EmailSignInData {
  name?: string;
}

export type OAuthProvider = 'github' | 'google';

export interface AuthResult<T = void> {
  data: T | null;
  error: string | null;
}

// Type guard for auth errors
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'status' in error
  );
} 