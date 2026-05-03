# Knowledge Hub API

A RESTful API for managing articles, categories, tags, comments, and users. Built with NestJS, PostgreSQL, and Prisma ORM. Fully containerized with Docker. Includes AI-powered endpoints and RAG (Retrieval-Augmented Generation) via Google Gemini and Qdrant.

## Tech Stack

- **Runtime**: Node.js 24
- **Framework**: NestJS
- **Database**: PostgreSQL 16
- **ORM**: Prisma 7
- **Containerization**: Docker + Docker Compose
- **AI**: Google Gemini API (gemini-2.5-flash)
- **Vector DB**: Qdrant (for RAG)

## Docker Hub

https://hub.docker.com/r/eugeneorhanistyi/knowledge-hub-api

## Prerequisites

- [Docker](https://docs.docker.com/engine/install/)
- [Node.js 24+](https://nodejs.org/) (for local development)

## Getting Started

### 1. Clone the repository

```bash
git clone git@github.com:yevheniiorhanistyi/nodejs-2026q1-knowledge-hub.git
cd knowledge-hub
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values (see Environment Variables section below).

### 3. Start with Docker

```bash
docker-compose up --build
```

After startup:

- API is available at: http://localhost:4000
- Swagger docs: http://localhost:4000/doc
- Qdrant dashboard: http://localhost:6333/dashboard

### 4. Apply migrations (first run)

```bash
npx prisma migrate deploy
```

### 5. Seed the database (optional)

```bash
npx prisma db seed
```

### 6. Build the RAG index (after seeding)

```bash
curl -X POST http://localhost:4000/ai/rag/index \
  -H "Content-Type: application/json" \
  -d '{"onlyPublished": false}'
```

### 7. Start Adminer (database UI)

```bash
docker-compose --profile debug up
```

Adminer is available at: http://localhost:8080

## Environment Variables

| Variable                        | Description                       | Example                                                      |
| ------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| `PORT`                          | Application port                  | `4000`                                                       |
| `DATABASE_URL`                  | PostgreSQL connection string      | `postgresql://user:pass@db:5432/knowledge_hub?schema=public` |
| `POSTGRES_USER`                 | PostgreSQL user                   | `postgres`                                                   |
| `POSTGRES_PASSWORD`             | PostgreSQL password               | `postgres`                                                   |
| `POSTGRES_DB`                   | PostgreSQL database name          | `knowledge_hub`                                              |
| `POSTGRES_HOST`                 | PostgreSQL host (Docker)          | `db`                                                         |
| `POSTGRES_PORT`                 | PostgreSQL port                   | `5432`                                                       |
| `GEMINI_API_KEY`                | Google Gemini API key             | `AIzaSy...`                                                  |
| `GEMINI_API_BASE_URL`           | Gemini API base URL               | `https://generativelanguage.googleapis.com`                  |
| `GEMINI_MODEL`                  | Gemini generation model           | `gemini-2.5-flash`                                           |
| `GEMINI_EMBEDDING_MODEL`        | Gemini embedding model            | `gemini-embedding-001`                                       |
| `AI_RATE_LIMIT_RPM`             | Max AI requests per minute        | `20`                                                         |
| `AI_CACHE_TTL_SEC`              | AI response cache TTL in seconds  | `300`                                                        |
| `RAG_VECTOR_DB_PROVIDER`        | Vector DB provider                | `qdrant`                                                     |
| `RAG_VECTOR_DB_URL`             | Qdrant URL (internal Docker)      | `http://vectordb:6333`                                       |
| `RAG_VECTOR_COLLECTION`         | Qdrant collection name            | `knowledge_hub_articles`                                     |
| `RAG_CHUNK_SIZE`                | Text chunk size in characters     | `800`                                                        |
| `RAG_CHUNK_OVERLAP`             | Chunk overlap in characters       | `200`                                                        |
| `RAG_CONVERSATION_MAX_MESSAGES` | Max messages per RAG conversation | `20`                                                         |

## API Endpoints

| Method | Endpoint                   | Description                   |
| ------ | -------------------------- | ----------------------------- |
| GET    | /user                      | Get all users                 |
| POST   | /user                      | Create user                   |
| GET    | /user/:id                  | Get user by ID                |
| PUT    | /user/:id/password         | Update password               |
| DELETE | /user/:id                  | Delete user                   |
| GET    | /article                   | Get all articles              |
| POST   | /article                   | Create article                |
| GET    | /article/:id               | Get article by ID             |
| PUT    | /article/:id               | Update article                |
| DELETE | /article/:id               | Delete article                |
| GET    | /category                  | Get all categories            |
| POST   | /category                  | Create category               |
| GET    | /category/:id              | Get category by ID            |
| PUT    | /category/:id              | Update category               |
| DELETE | /category/:id              | Delete category               |
| GET    | /comment/:id               | Get comment by ID             |
| POST   | /comment                   | Create comment                |
| DELETE | /comment/:id               | Delete comment                |
| POST   | /ai/articles/:id/summarize | Summarize article with AI     |
| POST   | /ai/articles/:id/translate | Translate article with AI     |
| POST   | /ai/articles/:id/analyze   | Analyze article with AI       |
| POST   | /ai/generate               | Free-form AI generation       |
| GET    | /ai/usage                  | AI usage statistics           |
| POST   | /ai/rag/index              | Index articles into vector DB |
| POST   | /ai/rag/search             | Semantic search in articles   |
| POST   | /ai/rag/chat               | RAG-powered chat              |
| DELETE | /ai/rag/index/articles/:id | Remove article from index     |
| GET    | /ai/rag/chat/:id/history   | Conversation history          |

Full interactive documentation available at `/doc` (Swagger UI).

---

## AI Integration (Google Gemini)

### How to obtain a Gemini API key

1. Go to [https://aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **"Get API key"** in the left sidebar
4. Click **"Create API key"** and select or create a Google Cloud project
5. Copy the generated key — it looks like `AIzaSy...`
6. Open your `.env` file and paste the key:

```dotenv
GEMINI_API_KEY=AIzaSy...your-key-here
```

> No credit card required. The free tier is sufficient for development and testing.

### Models used

| Purpose                                               | Model                  |
| ----------------------------------------------------- | ---------------------- |
| Text generation (summarize, translate, analyze, chat) | `gemini-2.5-flash`     |
| Embeddings (RAG indexing and search)                  | `gemini-embedding-001` |

Both are configurable via environment variables `GEMINI_MODEL` and `GEMINI_EMBEDDING_MODEL`.

### Setup after cloning

1. Copy the example env file:

```bash
cp .env.example .env
```

2. Fill in required variables in `.env`:

```dotenv
GEMINI_API_KEY=AIzaSy...your-key-here
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
AI_RATE_LIMIT_RPM=20
AI_CACHE_TTL_SEC=300

RAG_VECTOR_DB_PROVIDER=qdrant
RAG_VECTOR_DB_URL=http://vectordb:6333
RAG_VECTOR_COLLECTION=knowledge_hub_articles
RAG_CHUNK_SIZE=800
RAG_CHUNK_OVERLAP=200
RAG_CONVERSATION_MAX_MESSAGES=20
```

3. Start the app:

```bash
docker-compose up --build
```

### Testing AI endpoints

First get an article ID:

```bash
curl http://localhost:4000/article
```

**Summarize:**

```bash
curl -X POST http://localhost:4000/ai/articles/<articleId>/summarize \
  -H "Content-Type: application/json" \
  -d '{"maxLength": "short"}'
```

**Translate:**

```bash
curl -X POST http://localhost:4000/ai/articles/<articleId>/translate \
  -H "Content-Type: application/json" \
  -d '{"targetLanguage": "Ukrainian"}'
```

**Analyze:**

```bash
curl -X POST http://localhost:4000/ai/articles/<articleId>/analyze \
  -H "Content-Type: application/json" \
  -d '{"task": "review"}'
```

**Free-form generation:**

```bash
curl -X POST http://localhost:4000/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is NestJS?", "sessionId": "my-session"}'
```

**Usage statistics:**

```bash
curl http://localhost:4000/ai/usage
```

---

## RAG (Retrieval-Augmented Generation)

RAG allows you to ask questions about content stored in the Knowledge Hub database. Articles are chunked, embedded into vectors, stored in Qdrant, and retrieved semantically at query time.

### Vector DB: Qdrant

Qdrant runs as a dedicated Docker service alongside the API and PostgreSQL. It stores article embeddings with metadata (articleId, title, status, tags) for filtered retrieval.

Qdrant dashboard: **http://localhost:6333/dashboard**

### Full RAG startup flow

```bash
# 1. Start all services
docker-compose up --build

# 2. Seed the database
npx prisma db seed

# 3. Index articles into Qdrant
curl -X POST http://localhost:4000/ai/rag/index \
  -H "Content-Type: application/json" \
  -d '{"onlyPublished": false}'

# Expected response:
# { "indexedArticles": 5, "indexedChunks": 12, "vectorCollection": "knowledge_hub_articles" }
```

### Sample RAG requests

**Semantic search:**

```bash
curl -X POST http://localhost:4000/ai/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "TypeScript types", "limit": 3}'
```

**RAG chat:**

```bash
curl -X POST http://localhost:4000/ai/rag/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What do you know about TypeScript?"}'
```

**Continue conversation:**

```bash
curl -X POST http://localhost:4000/ai/rag/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Tell me more", "conversationId": "<id from previous response>"}'
```

**Conversation history:**

```bash
curl http://localhost:4000/ai/rag/chat/<conversationId>/history
```

**Remove article from index:**

```bash
curl -X DELETE http://localhost:4000/ai/rag/index/articles/<articleId>
```

### Known limitations

- **Free tier quota**: Gemini free tier allows 15 RPM and 1,500 requests/day. Indexing many articles may hit this limit — the service will return `503` if exhausted.
- **Embedding model**: `gemini-embedding-001` produces 3072-dimensional vectors. Changing the model after indexing requires dropping and recreating the Qdrant collection.
- **Indexing time**: Each chunk requires one Gemini API call. Indexing 10 articles (~50 chunks) takes roughly 10–15 seconds on the free tier.
- **Model availability**: `gemini-2.5-flash` may experience demand spikes. The server retries up to 3 times with exponential backoff.
- **Cache is in-memory**: Both AI response cache and conversation memory reset on server restart.
- **Regional availability**: Gemini API may be restricted in some regions. A VPN may be required.

---

## Local Development

```bash
# Install dependencies
npm install

# Start database and vector DB
docker-compose up -d db vectordb

# Apply migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start in watch mode
npm run start:dev

# Open Prisma Studio
npx prisma studio
```

## Security Scan

Scanned with Docker Scout — no critical vulnerabilities found.

<img width="710" height="174" alt="image" src="https://github.com/user-attachments/assets/5f0d1255-47e1-4ca8-9c0c-58437c3412c6" />
