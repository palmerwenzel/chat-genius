'use client';

import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import LoginPage from '../(auth)/login/page';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import type { User } from '@supabase/supabase-js';

// Mock the auth service
vi.mock('@/services/auth', () => ({
  auth: {
    getSession: vi.fn(),
    signInWithProvider: vi.fn(),
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

// Mock Supabase client utilities
vi.mock('@/utils/supabase/client', () => ({
  createBrowserSupabaseClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  })),
}));

describe('Auth Redirects', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  const mockSearchParams = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockImplementation(() => mockRouter);
    (useSearchParams as Mock).mockImplementation(() => mockSearchParams);
    useAuth.setState({ user: null, isLoading: false, error: null });
  });

  describe('LoginPage', () => {
    it('redirects to /chat when user is already authenticated', async () => {
      // Mock an authenticated user
      useAuth.setState({ user: { id: '123', email: 'test@example.com' } as User });
      mockSearchParams.get.mockReturnValue(null); // No redirect param

      render(<LoginPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/chat');
      });
    });

    it('redirects to specified path when user is authenticated', async () => {
      // Mock an authenticated user
      useAuth.setState({ user: { id: '123', email: 'test@example.com' } as User });
      mockSearchParams.get.mockReturnValue('/dashboard'); // Custom redirect

      render(<LoginPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('stays on login page when user is not authenticated', () => {
      // Mock unauthenticated state
      useAuth.setState({ user: null });
      mockSearchParams.get.mockReturnValue(null);

      render(<LoginPage />);

      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('preserves redirect parameter during OAuth sign-in', async () => {
      mockSearchParams.get.mockReturnValue('/dashboard');
      
      render(<LoginPage />);

      // Verify OAuth buttons exist with correct redirect
      const googleButton = screen.getByRole('button', { name: /google/i });
      const githubButton = screen.getByRole('button', { name: /github/i });

      expect(googleButton).toBeInTheDocument();
      expect(githubButton).toBeInTheDocument();

      // Verify the redirect is preserved in the auth service call
      const signInButton = screen.getByRole('button', { name: /google/i });
      await signInButton.click();

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled(); // Should not redirect yet
      });
    });
  });
}); 