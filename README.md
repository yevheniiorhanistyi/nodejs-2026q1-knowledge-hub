# Knowledge Hub API

A RESTful API for managing articles, categories, tags, comments, and users. Built with NestJS, PostgreSQL, and Prisma ORM. Fully containerized with Docker. Includes AI-powered endpoints via Google Gemini.

## Tech Stack

- **Runtime**: Node.js 24
- **Framework**: NestJS
- **Database**: PostgreSQL 16
- **ORM**: Prisma 7
- **Containerization**: Docker + Docker Compose
- **AI**: Google Gemini API (gemini-2.5-flash)

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

### 4. Apply migrations (first run)

```bash
npx prisma migrate deploy
```

### 5. Seed the database (optional)

```bash
npx prisma db seed
```

### 6. Start Adminer (database UI)

```bash
docker-compose --profile debug up
```

Adminer is available at: http://localhost:8080

## Environment Variables

| Variable              | Description                      | Example                                                             |
| --------------------- | -------------------------------- | ------------------------------------------------------------------- |
| `PORT`                | Application port                 | `4000`                                                              |
| `DATABASE_URL`        | PostgreSQL connection string     | `postgresql://user:pass@localhost:5432/knowledge_hub?schema=public` |
| `POSTGRES_USER`       | PostgreSQL user                  | `postgres`                                                          |
| `POSTGRES_PASSWORD`   | PostgreSQL password              | `postgres`                                                          |
| `POSTGRES_DB`         | PostgreSQL database name         | `knowledge_hub`                                                     |
| `POSTGRES_HOST`       | PostgreSQL host (Docker)         | `db`                                                                |
| `POSTGRES_PORT`       | PostgreSQL port                  | `5432`                                                              |
| `GEMINI_API_KEY`      | Google Gemini API key            | `AIzaSy...`                                                         |
| `GEMINI_API_BASE_URL` | Gemini API base URL              | `https://generativelanguage.googleapis.com`                         |
| `GEMINI_MODEL`        | Gemini model name                | `gemini-2.5-flash`                                                  |
| `AI_RATE_LIMIT_RPM`   | Max AI requests per minute       | `20`                                                                |
| `AI_CACHE_TTL_SEC`    | AI response cache TTL in seconds | `300`                                                               |

## API Endpoints

| Method | Endpoint                   | Description               |
| ------ | -------------------------- | ------------------------- |
| GET    | /user                      | Get all users             |
| POST   | /user                      | Create user               |
| GET    | /user/:id                  | Get user by ID            |
| PUT    | /user/:id/password         | Update password           |
| DELETE | /user/:id                  | Delete user               |
| GET    | /article                   | Get all articles          |
| POST   | /article                   | Create article            |
| GET    | /article/:id               | Get article by ID         |
| PUT    | /article/:id               | Update article            |
| DELETE | /article/:id               | Delete article            |
| GET    | /category                  | Get all categories        |
| POST   | /category                  | Create category           |
| GET    | /category/:id              | Get category by ID        |
| PUT    | /category/:id              | Update category           |
| DELETE | /category/:id              | Delete category           |
| GET    | /comment/:id               | Get comment by ID         |
| POST   | /comment                   | Create comment            |
| DELETE | /comment/:id               | Delete comment            |
| POST   | /ai/articles/:id/summarize | Summarize article with AI |
| POST   | /ai/articles/:id/translate | Translate article with AI |
| POST   | /ai/articles/:id/analyze   | Analyze article with AI   |
| POST   | /ai/generate               | Free-form AI generation   |
| GET    | /ai/usage                  | AI usage statistics       |

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

### Model used

**`gemini-2.5-flash`** — fast, cost-efficient model with large context window. Configurable via the `GEMINI_MODEL` environment variable.

### Setup after cloning

1. Copy the example env file and fill in required values:

```bash
cp .env.example .env
```

2. Required AI-related variables in `.env`:

```dotenv
GEMINI_API_KEY=AIzaSy...your-key-here
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com
GEMINI_MODEL=gemini-2.5-flash
AI_RATE_LIMIT_RPM=20
AI_CACHE_TTL_SEC=300
```

3. Install dependencies and start the app:

```bash
npm install
npm run start:dev
```

### Testing AI endpoints

First get an article ID:

```bash
curl http://localhost:4000/article
```

Then test each AI endpoint:

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

**Free-form generation (with optional conversation context):**

```bash
curl -X POST http://localhost:4000/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is NestJS?", "sessionId": "my-session"}'
```

**Usage statistics:**

```bash
curl http://localhost:4000/ai/usage
```

### Known limitations

- **Free tier quota**: Gemini free tier allows 15 requests/minute and 1,500 requests/day. If exceeded, the server retries up to 3 times with exponential backoff, then returns `503`.
- **Model availability**: `gemini-2.5-flash` may experience high demand spikes, especially during peak hours. The server handles this automatically via retry logic.
- **Latency**: First request may take 3–6 seconds depending on Gemini load. Subsequent identical requests are served from cache instantly.
- **Cache is in-memory**: Cache resets on server restart. For production use, Redis is recommended.
- **Regional availability**: Gemini API may be restricted in some regions. If you encounter connection issues, a VPN may be required.
- **Token tracking**: Token counts are available only when Gemini includes `usageMetadata` in the response, which is not guaranteed on all requests.

---

## Local Development

```bash
# Install dependencies
npm install

# Start database
docker-compose up -d db

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
