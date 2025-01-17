# Implementation Checklist: RAG and Chatbots (MVP)

## 1. App Repo (NextJS / TypeScript / React / Supabase)

1. **Chat Interface Updates**
   - [x] Add support for @bot commands in the message input
   - [x] Implement two command types:
     - [x] `@bot seed <prompt>` - Triggers conversation between two AI chatbots
     - [x] `@bot summary` - Generates channel summary using RAG

2. **API Integration Layer**
   - [x] Create `/api/ai/seed` endpoint
     - [x] Accepts a prompt
     - [x] Orchestrates conversation between two AI chatbots
     - [x] Stores generated messages in Supabase
   - [x] Create `/api/ai/summary` endpoint
     - [x] Collects channel messages
     - [x] Forwards to RAG service
     - [x] Returns and displays summary

3. **UI Components**
   - [x] Display bot responses within conversation flow
   - [x] Add visual treatment for AI-generated messages
   - [x] Implement summary display component

4. **Configuration**
   - [x] Add environment variables for:
     - [x] RAG service endpoint (AWS EC2)
     - [x] OpenAI API keys
     - [x] Other service credentials (RAG service API key)