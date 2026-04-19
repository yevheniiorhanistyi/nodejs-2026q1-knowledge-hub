/*
  Warnings:

  - The values [DRAFT,PUBLISHED,ARCHIVED] on the enum `ArticleStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ArticleStatus_new" AS ENUM ('draft', 'published', 'archived');
ALTER TABLE "public"."Article" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Article" ALTER COLUMN "status" TYPE "ArticleStatus_new" USING ("status"::text::"ArticleStatus_new");
ALTER TYPE "ArticleStatus" RENAME TO "ArticleStatus_old";
ALTER TYPE "ArticleStatus_new" RENAME TO "ArticleStatus";
DROP TYPE "public"."ArticleStatus_old";
ALTER TABLE "Article" ALTER COLUMN "status" SET DEFAULT 'draft';
COMMIT;

-- AlterTable
ALTER TABLE "Article" ALTER COLUMN "status" SET DEFAULT 'draft';

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "authorId" DROP NOT NULL;
