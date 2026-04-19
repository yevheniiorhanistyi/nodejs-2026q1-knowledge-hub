/*
  Warnings:
  - The values [ADMIN,EDITOR,VIEWER] on the enum `Role` will be removed.
*/

BEGIN;
CREATE TYPE "Role_new" AS ENUM ('admin', 'editor', 'viewer');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING (LOWER("role"::text)::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'viewer';
COMMIT;