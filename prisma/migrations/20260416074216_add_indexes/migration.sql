-- CreateIndex
CREATE INDEX "Article_status_categoryId_idx" ON "Article"("status", "categoryId");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");
