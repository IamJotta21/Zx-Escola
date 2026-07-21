-- CreateTable
CREATE TABLE "import_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetEntity" TEXT NOT NULL,
    "mapping" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uploaded_files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "imports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT,
    "fileId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "imports_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "import_models" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "imports_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "uploaded_files" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "imports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "import_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "importId" TEXT NOT NULL,
    "rowNumber" INTEGER,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "import_logs_importId_fkey" FOREIGN KEY ("importId") REFERENCES "imports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "import_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "importId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "import_history_importId_fkey" FOREIGN KEY ("importId") REFERENCES "imports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "uploaded_files_userId_idx" ON "uploaded_files"("userId");

-- CreateIndex
CREATE INDEX "imports_modelId_idx" ON "imports"("modelId");

-- CreateIndex
CREATE INDEX "imports_fileId_idx" ON "imports"("fileId");

-- CreateIndex
CREATE INDEX "imports_userId_idx" ON "imports"("userId");

-- CreateIndex
CREATE INDEX "import_logs_importId_idx" ON "import_logs"("importId");

-- CreateIndex
CREATE INDEX "import_history_importId_idx" ON "import_history"("importId");
