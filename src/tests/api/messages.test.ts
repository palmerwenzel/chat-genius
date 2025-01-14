import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestUser, deleteTestUser, type TestUser } from '@/utils/supabase/test';

describe('Messages API', () => {
  let testUser: TestUser;
  let testChannelId: string;
  let testMessageId: string;

  beforeAll(async () => {
    // Create a test user
    testUser = await createTestUser('messages.test@example.com', 'Messages Test User');

    // Create a test channel
    const createChannelRes = await fetch('/api/channels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await testUser.client.auth.getSession().then(({ data }) => 
          `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
        )
      },
      body: JSON.stringify({
        name: 'test-message-channel',
        description: 'Test channel for message API tests'
      })
    });
    const { channel } = await createChannelRes.json();
    testChannelId = channel.id;
  });

  afterAll(async () => {
    // Clean up test channel
    await fetch(`/api/channels/${testChannelId}`, {
      method: 'DELETE',
      headers: {
        Cookie: await testUser.client.auth.getSession().then(({ data }) => 
          `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
        )
      }
    });

    // Clean up test user
    if (testUser.user) {
      await deleteTestUser(testUser.user.id);
    }
  });

  describe('GET /api/messages', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await fetch('/api/messages?channelId=' + testChannelId);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should return messages for authenticated user', async () => {
      const res = await fetch('/api/messages?channelId=' + testChannelId, {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.messages)).toBe(true);
    });

    it('should validate query parameters', async () => {
      const res = await fetch('/api/messages', {
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

    it('should handle pagination', async () => {
      const res = await fetch(`/api/messages?channelId=${testChannelId}&limit=10&offset=0`, {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.messages)).toBe(true);
    });
  });

  describe('POST /api/messages', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelId: testChannelId,
          content: 'Test message'
        })
      });
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should create message for authenticated user', async () => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          channelId: testChannelId,
          content: 'Test message content'
        })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBeDefined();
      expect(data.message.content).toBe('Test message content');
      testMessageId = data.message.id;
    });

    it('should validate message content', async () => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          channelId: testChannelId,
          content: '' // Invalid content
        })
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/messages/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await fetch(`/api/messages/${testMessageId}`);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should return message by ID', async () => {
      const res = await fetch(`/api/messages/${testMessageId}`, {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBeDefined();
      expect(data.message.id).toBe(testMessageId);
    });

    it('should return 404 for non-existent message', async () => {
      const res = await fetch('/api/messages/non-existent-id', {
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

  describe('PATCH /api/messages/[id]', () => {
    it('should update message content', async () => {
      const res = await fetch(`/api/messages/${testMessageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          content: 'Updated message content'
        })
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toBeDefined();
      expect(data.message.content).toBe('Updated message content');
    });

    it('should validate update data', async () => {
      const res = await fetch(`/api/messages/${testMessageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          content: '' // Invalid content
        })
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should prevent updating other user messages', async () => {
      // Create another test user
      const otherUser = await createTestUser('other.test@example.com', 'Other Test User');

      const res = await fetch(`/api/messages/${testMessageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await otherUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          content: 'Attempt to update other user message'
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

  describe('DELETE /api/messages/[id]', () => {
    it('should delete message', async () => {
      const res = await fetch(`/api/messages/${testMessageId}`, {
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

      // Verify message is deleted
      const checkRes = await fetch(`/api/messages/${testMessageId}`, {
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
      });
      expect(checkRes.status).toBe(404);
    });

    it('should prevent deleting other user messages', async () => {
      // Create another test user and message
      const otherUser = await createTestUser('other.delete@example.com', 'Other Delete User');
      const createRes = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await otherUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        },
        body: JSON.stringify({
          channelId: testChannelId,
          content: 'Other user message'
        })
      });
      const { message } = await createRes.json();

      // Try to delete with original user
      const res = await fetch(`/api/messages/${message.id}`, {
        method: 'DELETE',
        headers: {
          Cookie: await testUser.client.auth.getSession().then(({ data }) => 
            `sb-access-token=${data.session?.access_token}; sb-refresh-token=${data.session?.refresh_token}`
          )
        }
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