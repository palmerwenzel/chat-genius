# ChatGenius

A modern chat application built with Next.js, Supabase, and TypeScript. Features real-time messaging, group organization, and rich media support.

## Overview

ChatGenius is a Discord-inspired chat platform that enables:
- Group-based communication
- Public and private channels
- Real-time messaging with thread support
- File sharing and search capabilities
- User presence and status
- Emoji reactions

For a complete feature list, see [`docs/features.md`](docs/features.md).

## Quick Start

1. **Prerequisites**
   - Node.js v18+
   - Docker Desktop
   - Git
   - VS Code (recommended)

2. **Installation**
   ```bash
   git clone https://github.com/agenticpalmer/chat-genius.git
   cd chat-genius
   npm install
   ```

3. **Setup**
   ```bash
   cp .env.example .env.local
   # Configure environment variables
   ```

For detailed setup instructions, see [`docs/setup.md`](docs/setup.md).

## Development

```bash
# Start local services
docker-compose up -d

# Start development server
npm run dev
```

Visit `http://localhost:3000` to view the application.

## Documentation

- [`project-overview.md`](docs/project-overview.md) - Project vision and goals
- [`features.md`](docs/features.md) - Detailed feature specifications
- [`tech-stack.md`](docs/tech-stack.md) - Technology choices and rationale
- [`setup.md`](docs/setup.md) - Complete setup guide
- [`implementation.md`](docs/implementation.md) - Development guidelines
- [`project-structure.md`](docs/project-structure.md) - Codebase organization
- [`api-spec.md`](docs/api-spec.md) - API documentation
- [`database-schema.md`](docs/database-schema.md) - Database structure
- [`workflows.md`](docs/workflows.md) - Development workflows
- [`project-checklist.md`](docs/project-checklist.md) - Implementation progress

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State**: Zustand
- **Backend**: Supabase
- **API**: tRPC
- **Testing**: Vitest, Testing Library, Storybook

See [`docs/tech-stack.md`](docs/tech-stack.md) for details.

## Contributing

1. Follow the setup guide in [`docs/setup.md`](docs/setup.md)
2. Review development workflows in [`docs/workflows.md`](docs/workflows.md)
3. Check implementation guidelines in [`docs/implementation.md`](docs/implementation.md)
4. Track progress using [`docs/project-checklist.md`](docs/project-checklist.md)

## License

[MIT License](LICENSE)