CREATE TABLE `connector_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectorType` enum('slack','google_docs','notion','webhook','email') NOT NULL,
	`name` varchar(256) NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`configJson` json DEFAULT ('{}'),
	`targetId` varchar(512),
	`targetName` varchar(256),
	`syncKnowledge` boolean NOT NULL DEFAULT true,
	`syncAlerts` boolean NOT NULL DEFAULT true,
	`syncPress` boolean NOT NULL DEFAULT false,
	`syncDiscrepancies` boolean NOT NULL DEFAULT false,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connector_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`mediaType` enum('video','audio','document','image','transcript') NOT NULL,
	`fileKey` varchar(512),
	`fileUrl` text,
	`externalUrl` text,
	`thumbnailUrl` text,
	`fileSizeBytes` int,
	`durationSeconds` int,
	`mimeType` varchar(128),
	`source` varchar(256),
	`speakers` json DEFAULT ('[]'),
	`language` varchar(16) DEFAULT 'en',
	`publishedAt` timestamp,
	`tags` json DEFAULT ('[]'),
	`verificationStatus` enum('verified','inferred','unverified') NOT NULL DEFAULT 'verified',
	`sourceOfTruth` enum('primary','secondary','inferred') NOT NULL DEFAULT 'primary',
	`linkedKnowledgeItemId` int,
	`transcriptText` text,
	`isPublic` boolean NOT NULL DEFAULT true,
	`uploadedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`activityType` enum('email','call','meeting','linkedin','conference','intro','follow_up','proposal_sent','loi_signed','contract_signed','demo','note') NOT NULL,
	`title` varchar(512) NOT NULL,
	`body` text,
	`outcome` enum('pending','positive','negative','no_response','meeting_booked','referred') DEFAULT 'pending',
	`nextStep` text,
	`nextStepDate` timestamp,
	`linkedKnowledgeItemId` int,
	`linkedPressItemId` int,
	`linkedSignalId` int,
	`attachmentUrl` text,
	`loggedByUserId` int,
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`flagType` enum('risk','opportunity','blocker','champion','urgent','stalled','watch','custom') NOT NULL,
	`title` varchar(512) NOT NULL,
	`body` text,
	`severity` enum('critical','high','medium','low') DEFAULT 'medium',
	`status` enum('open','resolved','dismissed') NOT NULL DEFAULT 'open',
	`resolvedAt` timestamp,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `press_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`outlet` varchar(256),
	`author` varchar(256),
	`summary` text,
	`fullContent` text,
	`sourceUrl` text NOT NULL,
	`publishedAt` timestamp,
	`pressType` enum('press_release','news_mention','interview','feature','op_ed','podcast_mention') NOT NULL DEFAULT 'news_mention',
	`sentiment` enum('positive','neutral','negative','mixed') DEFAULT 'neutral',
	`verificationStatus` enum('verified','inferred','unverified') NOT NULL DEFAULT 'verified',
	`sourceOfTruth` enum('primary','secondary','inferred') NOT NULL DEFAULT 'secondary',
	`tags` json DEFAULT ('[]'),
	`entities` json DEFAULT ('[]'),
	`hasDiscrepancy` boolean NOT NULL DEFAULT false,
	`discrepancyNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `press_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `source_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetTable` varchar(64) NOT NULL,
	`targetId` int NOT NULL,
	`commentType` enum('correction','addition','question','note','verified_by') NOT NULL DEFAULT 'note',
	`body` text NOT NULL,
	`newFactClaim` text,
	`sourceUrl` text,
	`status` enum('open','accepted','rejected','pending_review') NOT NULL DEFAULT 'open',
	`resolvedAt` timestamp,
	`resolvedByUserId` int,
	`authorUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `source_comments_id` PRIMARY KEY(`id`)
);
