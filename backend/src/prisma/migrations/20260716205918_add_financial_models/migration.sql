-- CreateTable
CREATE TABLE "tuitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0.0,
    "scholarshipPercent" REAL NOT NULL DEFAULT 0.0,
    "fine" REAL NOT NULL DEFAULT 0.0,
    "interest" REAL NOT NULL DEFAULT 0.0,
    "finalValue" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "paymentMethod" TEXT,
    "paymentDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tuitions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "date" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "tuitionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transactions_tuitionId_fkey" FOREIGN KEY ("tuitionId") REFERENCES "tuitions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
