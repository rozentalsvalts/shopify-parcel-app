-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "maxDistance" INTEGER,
    "apiKey" TEXT,
    "dpdEnabled" BOOLEAN DEFAULT true,
    "dpdDefaultPrice" REAL DEFAULT 2.99,
    "dpdFreeFrom" REAL DEFAULT 100,
    "dpdMaxWeight" REAL DEFAULT 15,
    "dpdRadius" INTEGER DEFAULT 50000,
    "dpdMaxPoints" INTEGER DEFAULT 5
);
INSERT INTO "new_Settings" ("apiKey", "id", "maxDistance") SELECT "apiKey", "id", "maxDistance" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
