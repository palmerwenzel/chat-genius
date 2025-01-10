# Local Development Setup Guide

## Core Development Environment

### Prerequisites
```bash
Node.js >= 18
npm >= 9.0.0
Docker Desktop # For PostgreSQL only
```

### Initial Setup
```bash
# Clone and install dependencies
git clone <repository>
cd chat-genius
npm install

# Create environment files
cp .env.example .env

# Create uploads directory for local file storage
mkdir uploads
chmod 777 uploads
```

## Local Services Setup

### Database (PostgreSQL)
```bash
# Start PostgreSQL container
docker run --name chat-genius-db \
  -e POSTGRES_DB=chatgenius \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15

# Environment variables
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chatgenius"
```

## Development Commands

### Frontend Development
```bash
# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### Backend Development
```bash
# Start development server
npm run dev:server

# Run migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

## Local Testing Configuration

### Authentication (NextAuth.js)
```env
# .env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret
# For OAuth providers (optional)
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret
```

### WebSocket Testing
```typescript
// config/websocket.ts
export const WS_URL = process.env.NODE_ENV === 'development' 
  ? 'ws://localhost:3001' 
  : 'wss://your-production-url';
```

### OpenAI Integration
```env
OPENAI_API_KEY=your-api-key
# Optional: Use lower-cost models for development
OPENAI_MODEL=gpt-3.5-turbo
```

## Docker Compose (Simple Setup)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: chatgenius
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Testing Different Features

### Message Persistence
```typescript
// Test message persistence with PostgreSQL
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const saveMessage = async (message: Message) => {
  return await prisma.message.create({
    data: message
  });
};
```

### File Upload Testing
```typescript
// Local file storage implementation
const uploadFile = async (file: File) => {
  const fileName = `${Date.now()}-${file.name}`;
  const path = `./uploads/${fileName}`;
  await fs.promises.writeFile(path, file.buffer);
  return `/uploads/${fileName}`;
};
```

### Search Testing
```typescript
// PostgreSQL full-text search
const searchMessages = async (query: string) => {
  return await prisma.$queryRaw`
    SELECT * FROM messages 
    WHERE to_tsvector('english', content) @@ to_tsquery('english', ${query})
  `;
};
```

### Real-time Features Testing
```typescript
// WebSocket testing
const socket = io('ws://localhost:3001');

// Test typing indicators
const simulateTyping = (channelId: string) => {
  socket.emit('typing:start', { channelId });
  setTimeout(() => socket.emit('typing:stop', { channelId }), 1000);
};
```

## Development Tools

### Recommended VSCode Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma

### Browser Extensions
- React Developer Tools

### API Testing
- Thunder Client VSCode Extension or Postman

## Troubleshooting

### Common Issues

1. **Database Connection**
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
npm run prisma:migrate
```

2. **File Upload Issues**
```bash
# Check uploads directory permissions
chmod 777 uploads
# Ensure directory exists
mkdir -p uploads
```

## Future Scaling Notes

When the application needs to scale, consider:

1. **File Storage**
   - Move from local storage to AWS S3
   - Update file handling logic in `services/storage.ts`

2. **Search**
   - If full-text search becomes slow, migrate to Elasticsearch
   - Keep search queries in separate service for easy replacement

3. **Caching**
   - Add Redis when user count grows
   - Implement in `services/cache.ts`

4. **Message Queue**
   - Add message queue for reliability
   - Consider Redis pub/sub or RabbitMQ 