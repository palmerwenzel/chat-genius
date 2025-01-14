import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

if (!process.env.RAG_SERVICE_URL) {
  throw new Error('Missing RAG_SERVICE_URL environment variable');
}

if (!process.env.RAG_SERVICE_API_KEY) {
  throw new Error('Missing RAG_SERVICE_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const aiService = {
  /**
   * Generate a conversation between two AI chatbots based on a prompt
   */
  async generateConversation(prompt: string, turns: number = 3): Promise<ChatMessage[]> {
    const systemPrompt = `You are participating in a conversation between two AI chatbots discussing the following topic: "${prompt}".
Each response should be a single message from one bot to the other, naturally continuing the conversation.
Keep responses concise and engaging. Use a casual, friendly tone.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Generate conversation turns
    for (let i = 0; i < turns * 2; i++) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          ...messages,
          {
            role: 'system',
            content: `You are ${i % 2 === 0 ? 'Bot 1' : 'Bot 2'}. Respond to continue the conversation.`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const message = response.choices[0].message;
      if (message) {
        messages.push({
          role: 'assistant',
          content: message.content || '',
        });
      }
    }

    return messages.filter(m => m.role === 'assistant');
  },

  /**
   * Generate a summary of channel messages using RAG
   */
  async generateSummary(messages: { content: string; sender: string }[]): Promise<string> {
    try {
      const response = await fetch(process.env.RAG_SERVICE_URL + '/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RAG_SERVICE_API_KEY}`,
        },
        body: JSON.stringify({
          messages: messages.map(m => ({
            content: m.content,
            metadata: {
              sender: m.sender,
            }
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary from RAG service');
      }

      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('Error using RAG service, falling back to OpenAI:', error);

      // Fallback to OpenAI if RAG service fails
      const context = messages
        .map(m => `${m.sender}: ${m.content}`)
        .join('\n');

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Generate a concise summary of the following conversation. Focus on key points and conclusions.'
          },
          {
            role: 'user',
            content: context
          }
        ],
        temperature: 0.3,
        max_tokens: 250,
      });

      return response.choices[0].message?.content || 'Failed to generate summary';
    }
  }
}; 