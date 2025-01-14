import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestUser, deleteTestUser, type TestUser } from '@/utils/supabase/test';

describe('Auth API', () => {
  let testUser: TestUser;

  beforeAll(async () => {
    // Create a test user
    testUser = await createTestUser('auth.test@example.com', 'Auth Test User');
  });

  afterAll(async () => {
    // Clean up test user
    if (testUser.user) {
      await deleteTestUser(testUser.user.id);
    }
  });

  describe('GET /api/auth/check', () => {
    it('should return authenticated=true for logged in user', async () => {
      const res = await fetch('/api/auth/check', {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(testUser.user?.id);
    });

    it('should return authenticated=false for no session', async () => {
      const res = await fetch('/api/auth/check');
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.authenticated).toBe(false);
      expect(data.user).toBeNull();
    });

    it('should return 401 for invalid session', async () => {
      const res = await fetch('/api/auth/check', {
        headers: {
          Cookie: 'sb-access-token=invalid; sb-refresh-token=invalid'
        }
      });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully log out a user', async () => {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify session is cleared
      const checkRes = await fetch('/api/auth/check', {
        headers: {
          Cookie: res.headers.get('set-cookie') || ''
        }
      });
      const checkData = await checkRes.json();
      expect(checkData.authenticated).toBe(false);
    });

    it('should return 401 when not logged in', async () => {
      const res = await fetch('/api/auth/logout', {
        method: 'POST'
      });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /auth/callback', () => {
    it('should redirect to login on missing code', async () => {
      const res = await fetch('/auth/callback');
      
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toBe('/login');
    });

    it('should preserve redirect URL', async () => {
      const res = await fetch('/auth/callback?next=/chat/general');
      
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toBe('/login');
    });

    it('should handle invalid code', async () => {
      const res = await fetch('/auth/callback?code=invalid');
      
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toMatch(/\/login\?error=/);
    });
  });
}); 