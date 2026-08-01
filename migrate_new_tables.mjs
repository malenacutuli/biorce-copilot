import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);

const tables = [
  {
    name: 'media_items',
    sql: `CREATE TABLE IF NOT EXISTS \`media_items\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`title\` varchar(512) NOT NULL,
      \`description\` text,
      \`mediaType\` enum('video','audio','document','image','transcript') NOT NULL,
      \`fileKey\` varchar(512),
      \`fileUrl\` text,
      \`externalUrl\` text,
      \`thumbnailUrl\` text,
      \`fileSizeBytes\` int,
      \`durationSeconds\` int,
      \`mimeType\` varchar(128),
      \`source\` varchar(256),
      \`speakers\` json DEFAULT ('[]'),
      \`language\` varchar(16) DEFAULT 'en',
      \`publishedAt\` timestamp NULL,
      \`tags\` json DEFAULT ('[]'),
      \`verificationStatus\` enum('verified','inferred','unverified') NOT NULL DEFAULT 'verified',
      \`sourceOfTruth\` enum('primary','secondary','inferred') NOT NULL DEFAULT 'primary',
      \`linkedKnowledgeItemId\` int,
      \`transcriptText\` mediumtext,
      \`isPublic\` boolean NOT NULL DEFAULT true,
      \`uploadedByUserId\` int,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`media_items_id\` PRIMARY KEY(\`id\`)
    )`
  },
  {
    name: 'press_items',
    sql: `CREATE TABLE IF NOT EXISTS \`press_items\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`title\` varchar(512) NOT NULL,
      \`outlet\` varchar(256),
      \`author\` varchar(256),
      \`summary\` text,
      \`fullContent\` mediumtext,
      \`sourceUrl\` text NOT NULL,
      \`publishedAt\` timestamp NULL,
      \`pressType\` enum('press_release','news_mention','interview','feature','op_ed','podcast_mention') NOT NULL DEFAULT 'news_mention',
      \`sentiment\` enum('positive','neutral','negative','mixed') DEFAULT 'neutral',
      \`verificationStatus\` enum('verified','inferred','unverified') NOT NULL DEFAULT 'verified',
      \`sourceOfTruth\` enum('primary','secondary','inferred') NOT NULL DEFAULT 'secondary',
      \`tags\` json DEFAULT ('[]'),
      \`entities\` json DEFAULT ('[]'),
      \`hasDiscrepancy\` boolean NOT NULL DEFAULT false,
      \`discrepancyNote\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`press_items_id\` PRIMARY KEY(\`id\`)
    )`
  },
  {
    name: 'connector_configs',
    sql: `CREATE TABLE IF NOT EXISTS \`connector_configs\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`connectorType\` enum('slack','google_docs','notion','webhook','email') NOT NULL,
      \`name\` varchar(256) NOT NULL,
      \`isEnabled\` boolean NOT NULL DEFAULT false,
      \`configJson\` json DEFAULT ('{}'),
      \`targetId\` varchar(512),
      \`targetName\` varchar(256),
      \`syncKnowledge\` boolean NOT NULL DEFAULT true,
      \`syncAlerts\` boolean NOT NULL DEFAULT true,
      \`syncPress\` boolean NOT NULL DEFAULT false,
      \`syncDiscrepancies\` boolean NOT NULL DEFAULT false,
      \`lastSyncAt\` timestamp NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`connector_configs_id\` PRIMARY KEY(\`id\`)
    )`
  }
];

for (const t of tables) {
  try {
    await conn.execute(t.sql);
    console.log('OK:', t.name);
  } catch(e) {
    console.error('FAIL:', t.name, '-', e.message.slice(0, 100));
  }
}
await conn.end();
console.log('Done.');
