CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- DropIndex
DROP INDEX "books_title_idx";

-- CreateIndex
CREATE INDEX "authors_name_idx" ON "authors" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "books_title_idx" ON "books" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "books_original_title_idx" ON "books" USING GIN ("original_title" gin_trgm_ops);
