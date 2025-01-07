import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/services/auth';
import type { User, Provider, AuthError } from '@supabase/supabase-js';

// Mock the auth service before importing the store
vi.mock('@/services/auth', () => ({
  auth: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInWithProvider: vi.fn(),
    updateProfile: vi.fn(),
    getSession: vi.fn().mockResolvedValue({ user: null, error: null }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
      error: null,
    })),
  },
}));

// Import the store after setting up mocks
import { useAuth } from '../auth';

describe('useAuth', () => {
  const mockUser: Partial<User> = {
    id: '123',
    email: 'test@example.com',
    created_at: '2024-01-07T00:00:00.000Z',
    app_metadata: {},
    aud: 'authenticated',
    user_metadata: { name: 'Test User' },
  };

  const mockError: Partial<AuthError> = {
    name: 'AuthError',
    message: 'Invalid credentials',
    status: 400,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.setState({ user: null, isLoading: false, error: null });
    // Reset getSession mock to default value
    vi.mocked(auth.getSession).mockResolvedValue({ user: null, error: null });
  });

  describe('signIn', () => {
    it('updates state on successful sign in', async () => {
      vi.mocked(auth.signIn).mockResolvedValue({ user: mockUser as User, error: null });

      const signIn = useAuth.getState().signIn;
      await signIn('test@example.com', 'password');

      expect(auth.signIn).toHaveBeenCalledWith('test@example.com', 'password');
      expect(useAuth.getState().user).toEqual(mockUser);
      expect(useAuth.getState().isLoading).toBe(false);
      expect(useAuth.getState().error).toBeNull();
    });

    it('handles sign in error', async () => {
      vi.mocked(auth.signIn).mockResolvedValue({ user: null, error: mockError as AuthError });

      const signIn = useAuth.getState().signIn;
      await expect(signIn('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');

      expect(useAuth.getState().user).toBeNull();
      expect(useAuth.getState().isLoading).toBe(false);
      expect(useAuth.getState().error).toBeTruthy();
    });
  });

  describe('signUp', () => {
    it('updates state on successful sign up', async () => {
      vi.mocked(auth.signUp).mockResolvedValue({ user: mockUser as User, error: null });

      const signUp = useAuth.getState().signUp;
      await signUp('test@example.com', 'password');

      expect(auth.signUp).toHaveBeenCalledWith('test@example.com', 'password', undefined);
      expect(useAuth.getState().user).toEqual(mockUser);
      expect(useAuth.getState().isLoading).toBe(false);
      expect(useAuth.getState().error).toBeNull();
    });

    it('handles user metadata during sign up', async () => {
      const userWithMetadata = {
        ...mockUser,
        user_metadata: { name: 'Test User' }
      };
      vi.mocked(auth.signUp).mockResolvedValue({ user: userWithMetadata as User, error: null });

      const signUp = useAuth.getState().signUp;
      await signUp('test@example.com', 'password', { name: 'Test User' });

      expect(auth.signUp).toHaveBeenCalledWith('test@example.com', 'password', { name: 'Test User' });
      expect(useAuth.getState().user).toEqual(userWithMetadata);
      expect(useAuth.getState().isLoading).toBe(false);
      expect(useAuth.getState().error).toBeNull();
    });
  });

  describe('signOut', () => {
    it('clears state on successful sign out', async () => {
      useAuth.setState({ user: mockUser as User });
      vi.mocked(auth.signOut).mockResolvedValue({ error: null });

      const signOut = useAuth.getState().signOut;
      await signOut();

      expect(auth.signOut).toHaveBeenCalled();
      expect(useAuth.getState().user).toBeNull();
      expect(useAuth.getState().isLoading).toBe(false);
      expect(useAuth.getState().error).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('updates user profile', async () => {
      const updatedUser = { 
        ...mockUser, 
        user_metadata: { name: 'Updated Name' } 
      };
      vi.mocked(auth.updateProfile).mockResolvedValue({ user: updatedUser as User, error: null });

      const updateProfile = useAuth.getState().updateProfile;
      await updateProfile({ name: 'Updated Name' });

      expect(auth.updateProfile).toHaveBeenCalledWith({ name: 'Updated Name' });
      expect(useAuth.getState().user).toEqual(updatedUser);
      expect(useAuth.getState().isLoading).toBe(false);
      expect(useAuth.getState().error).toBeNull();
    });
  });

  describe('signInWithProvider', () => {
    const mockOAuthResponse = {
      provider: 'github' as Provider,
      url: 'https://auth.supabase.com/oauth/authorize',
    };

    it('handles GitHub sign in', async () => {
      vi.mocked(auth.signInWithProvider).mockResolvedValue({ 
        data: mockOAuthResponse,
        error: null 
      });

      const signInWithProvider = useAuth.getState().signInWithProvider;
      await signInWithProvider('github');

      expect(auth.signInWithProvider).toHaveBeenCalledWith('github');
      expect(useAuth.getState().isLoading).toBe(false);
      expect(useAuth.getState().error).toBeNull();
    });

    it('handles Google sign in', async () => {
      vi.mocked(auth.signInWithProvider).mockResolvedValue({ 
        data: { ...mockOAuthResponse, provider: 'google' as Provider },
        error: null 
      });

      const signInWithProvider = useAuth.getState().signInWithProvider;
      await signInWithProvider('google');

      expect(auth.signInWithProvider).toHaveBeenCalledWith('google');
      expect(useAuth.getState().isLoading).toBe(false);
      expect(useAuth.getState().error).toBeNull();
    });

    it('handles OAuth error', async () => {
      vi.mocked(auth.signInWithProvider).mockResolvedValue({ 
        data: { provider: 'github', url: null } as { provider: Provider; url: null },
        error: { ...mockError, message: 'OAuth connection failed' } as AuthError 
      });

      const signInWithProvider = useAuth.getState().signInWithProvider;
      await expect(signInWithProvider('github')).rejects.toThrow('OAuth connection failed');

      expect(useAuth.getState().isLoading).toBe(false);
      expect(useAuth.getState().error).toBeTruthy();
    });
  });
}); 