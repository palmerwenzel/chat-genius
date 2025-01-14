import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestUser, deleteTestUser, type TestUser } from '@/utils/supabase/test';

describe('Channels API', () => {
  let testUser: TestUser;
  let testChannelId: string;

  beforeAll(async () => {
    // Create a test user
    testUser = await createTestUser('channels.test@example.com', 'Channels Test User');
  });

  afterAll(async () => {
    // Clean up test user
    if (testUser.user) {
      await deleteTestUser(testUser.user.id);
    }
  });

  describe('GET /api/channels', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await fetch('/api/channels');
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should return channels for authenticated user', async () => {
      const res = await fetch('/api/channels', {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.channels)).toBe(true);
    });

    it('should find channel by name', async () => {
      // First create a channel
      const createRes = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          name: 'test-channel',
          description: 'Test channel for API tests'
        })
      });
      const { channel } = await createRes.json();
      testChannelId = channel.id;

      // Then try to find it by name
      const res = await fetch('/api/channels?name=test-channel', {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.channel).toBeDefined();
      expect(data.channel.name).toBe('test-channel');
    });
  });

  describe('POST /api/channels', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'test-channel',
          description: 'Test channel'
        })
      });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should create channel for authenticated user', async () => {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          name: 'another-test-channel',
          description: 'Another test channel'
        })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.channel).toBeDefined();
      expect(data.channel.name).toBe('another-test-channel');
    });

    it('should validate channel name', async () => {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          name: '',
          description: 'Invalid channel'
        })
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/channels/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await fetch(`/api/channels/${testChannelId}`);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should return channel by ID', async () => {
      const res = await fetch(`/api/channels/${testChannelId}`, {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.channel).toBeDefined();
      expect(data.channel.id).toBe(testChannelId);
    });

    it('should return 404 for non-existent channel', async () => {
      const res = await fetch('/api/channels/non-existent-id', {
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

  describe('PATCH /api/channels/[id]', () => {
    it('should update channel details', async () => {
      const res = await fetch(`/api/channels/${testChannelId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          description: 'Updated description'
        })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.channel).toBeDefined();
      expect(data.channel.description).toBe('Updated description');
    });

    it('should validate update data', async () => {
      const res = await fetch(`/api/channels/${testChannelId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          name: '' // Invalid name
        })
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('DELETE /api/channels/[id]', () => {
    it('should delete channel', async () => {
      const res = await fetch(`/api/channels/${testChannelId}`, {
        method: 'DELETE',
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify channel is deleted
      const checkRes = await fetch(`/api/channels/${testChannelId}`, {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      expect(checkRes.status).toBe(404);
    });
  });
}); 