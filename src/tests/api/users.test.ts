import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestUser, deleteTestUser, type TestUser } from '@/utils/supabase/test';

describe('Users API', () => {
  let testUser: TestUser;

  beforeAll(async () => {
    // Create a test user
    testUser = await createTestUser('users.test@example.com', 'Users Test User');
  });

  afterAll(async () => {
    // Clean up test user
    if (testUser.user) {
      await deleteTestUser(testUser.user.id);
    }
  });

  describe('GET /api/users', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await fetch('/api/users');
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should require id or username parameter', async () => {
      const res = await fetch('/api/users', {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should find user by ID', async () => {
      const res = await fetch(`/api/users?id=${testUser.user?.id}`, {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(testUser.user?.id);
    });

    it('should find user by username', async () => {
      // First update the user to set a username
      await fetch(`/api/users/${testUser.user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          username: 'testuser123'
        })
      });

      const res = await fetch('/api/users?username=testuser123', {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.username).toBe('testuser123');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await fetch('/api/users?id=non-existent-id', {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/users/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await fetch(`/api/users/${testUser.user?.id}`);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should return user by ID', async () => {
      const res = await fetch(`/api/users/${testUser.user?.id}`, {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(testUser.user?.id);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await fetch('/api/users/non-existent-id', {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });

  describe('PATCH /api/users/[id]', () => {
    it('should update user profile', async () => {
      const res = await fetch(`/api/users/${testUser.user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          full_name: 'Updated Test User',
          avatar_url: 'https://example.com/avatar.jpg'
        })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.full_name).toBe('Updated Test User');
      expect(data.user.avatar_url).toBe('https://example.com/avatar.jpg');
    });

    it('should validate update data', async () => {
      const res = await fetch(`/api/users/${testUser.user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          username: '' // Invalid username
        })
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should prevent updating other user profiles', async () => {
      // Create another test user
      const otherUser = await createTestUser('other.user@example.com', 'Other User');

      const res = await fetch(`/api/users/${otherUser.user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          full_name: 'Attempt to update other user'
        })
      });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBeDefined();

      // Clean up other user
      if (otherUser.user) {
        await deleteTestUser(otherUser.user.id);
      }
    });
  });
}); 