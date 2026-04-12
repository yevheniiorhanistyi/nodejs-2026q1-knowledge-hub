# Knowledge Hub API

A RESTful API for managing articles, categories, tags, comments, and users. Built with NestJS, PostgreSQL, and Prisma ORM. Fully containerized with Docker.

## Tech Stack

- **Runtime**: Node.js 24
- **Framework**: NestJS
- **Database**: PostgreSQL 16
- **ORM**: Prisma 7
- **Containerization**: Docker + Docker Compose

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

Edit `.env` and fill in your values.

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

| Variable            | Description                  | Example                                                             |
| ------------------- | ---------------------------- | ------------------------------------------------------------------- |
| `PORT`              | Application port             | `4000`                                                              |
| `DATABASE_URL`      | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/knowledge_hub?schema=public` |
| `POSTGRES_USER`     | PostgreSQL user              | `postgres`                                                          |
| `POSTGRES_PASSWORD` | PostgreSQL password          | `postgres`                                                          |
| `POSTGRES_DB`       | PostgreSQL database name     | `knowledge_hub`                                                     |
| `POSTGRES_HOST`     | PostgreSQL host (Docker)     | `db`                                                                |
| `POSTGRES_PORT`     | PostgreSQL port              | `5432`                                                              |

## API Endpoints

| Method | Endpoint           | Description        |
| ------ | ------------------ | ------------------ |
| GET    | /user              | Get all users      |
| POST   | /user              | Create user        |
| GET    | /user/:id          | Get user by ID     |
| PUT    | /user/:id/password | Update password    |
| DELETE | /user/:id          | Delete user        |
| GET    | /article           | Get all articles   |
| POST   | /article           | Create article     |
| GET    | /article/:id       | Get article by ID  |
| PUT    | /article/:id       | Update article     |
| DELETE | /article/:id       | Delete article     |
| GET    | /category          | Get all categories |
| POST   | /category          | Create category    |
| GET    | /category/:id      | Get category by ID |
| PUT    | /category/:id      | Update category    |
| DELETE | /category/:id      | Delete category    |
| GET    | /comment/:id       | Get comment by ID  |
| POST   | /comment           | Create comment     |
| DELETE | /comment/:id       | Delete comment     |

Full interactive documentation available at `/doc` (Swagger UI).

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

