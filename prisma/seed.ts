import { PrismaClient, Role, ArticleStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const editorPassword = await bcrypt.hash('editor123', 10);

  const admin = await prisma.user.create({
    data: { login: 'admin', password: adminPassword, role: Role.admin },
  });

  const editor = await prisma.user.create({
    data: { login: 'editor', password: editorPassword, role: Role.editor },
  });

  // Categories
  const [tech, science, culture] = await Promise.all([
    prisma.category.create({
      data: { name: 'Technology', description: 'Tech articles' },
    }),
    prisma.category.create({
      data: { name: 'Science', description: 'Science articles' },
    }),
    prisma.category.create({
      data: { name: 'Culture', description: 'Culture articles' },
    }),
  ]);

  // Tags
  const tagNames = ['javascript', 'typescript', 'nodejs', 'prisma', 'docker'];
  const tags = await Promise.all(
    tagNames.map((name) => prisma.tag.create({ data: { name } })),
  );

  // Articles
  await prisma.article.create({
    data: {
      title: 'Getting Started with TypeScript',
      content: 'TypeScript is a typed superset of JavaScript...',
      status: ArticleStatus.PUBLISHED,
      authorId: editor.id,
      categoryId: tech.id,
      tags: { connect: [{ id: tags[0].id }, { id: tags[1].id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'Node.js Best Practices',
      content: 'Here are the best practices for Node.js...',
      status: ArticleStatus.PUBLISHED,
      authorId: editor.id,
      categoryId: tech.id,
      tags: { connect: [{ id: tags[2].id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'Introduction to Prisma ORM',
      content: 'Prisma makes database access easy...',
      status: ArticleStatus.DRAFT,
      authorId: admin.id,
      categoryId: tech.id,
      tags: { connect: [{ id: tags[3].id }, { id: tags[1].id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'Docker for Developers',
      content: 'Docker simplifies containerization...',
      status: ArticleStatus.PUBLISHED,
      authorId: admin.id,
      categoryId: tech.id,
      tags: { connect: [{ id: tags[4].id }] },
    },
  });

  const archivedArticle = await prisma.article.create({
    data: {
      title: 'The History of the Internet',
      content: 'The internet started as ARPANET...',
      status: ArticleStatus.ARCHIVED,
      authorId: editor.id,
      categoryId: science.id,
      tags: { connect: [{ id: tags[0].id }] },
    },
  });

  // Comments
  await prisma.comment.createMany({
    data: [
      {
        content: 'Great article!',
        authorId: admin.id,
        articleId: archivedArticle.id,
      },
      {
        content: 'Very informative.',
        authorId: editor.id,
        articleId: archivedArticle.id,
      },
      {
        content: 'Thanks for sharing!',
        authorId: admin.id,
        articleId: archivedArticle.id,
      },
    ],
  });

  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
