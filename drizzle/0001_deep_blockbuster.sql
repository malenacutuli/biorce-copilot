CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('regulatory','competitive','partnership','discrepancy','digest') NOT NULL,
	`title` varchar(512) NOT NULL,
	`body` text NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`isRead` boolean NOT NULL DEFAULT false,
	`sourceId` int,
	`sourceTable` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ci_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitorId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`type` enum('press_release','product_launch','partnership','funding','regulatory','personnel','other') NOT NULL,
	`summary` text,
	`sourceUrl` text,
	`publishedAt` timestamp,
	`alertSent` boolean NOT NULL DEFAULT false,
	`biorceImplication` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ci_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`category` enum('direct','adjacent','platform','acquirer') NOT NULL DEFAULT 'direct',
	`website` varchar(256),
	`description` text,
	`fundingTotal` varchar(64),
	`lastFundingRound` varchar(64),
	`threatLevel` enum('critical','high','medium','low') DEFAULT 'medium',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competitors_id` PRIMARY KEY(`id`),
	CONSTRAINT `competitors_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `discrepancies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text NOT NULL,
	`type` enum('internal_vs_public','competitor_claim','regulatory_conflict','strategy_drift','data_inconsistency') NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`status` enum('open','investigating','resolved','dismissed') NOT NULL DEFAULT 'open',
	`sourceA` text,
	`sourceB` text,
	`resolution` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discrepancies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `graph_edges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`targetId` int NOT NULL,
	`relationship` varchar(256) NOT NULL,
	`verificationStatus` enum('verified','inferred') NOT NULL DEFAULT 'verified',
	`weight` float DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `graph_edges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `graph_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(256) NOT NULL,
	`type` enum('company','person','regulator','standard','product','event') NOT NULL,
	`metadata` json DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `graph_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`content` text NOT NULL,
	`summary` text,
	`category` enum('podcast','press_release','regulatory','competitor','internal','investor','public_statement','research') NOT NULL,
	`sourceType` enum('primary','secondary','inferred') NOT NULL DEFAULT 'primary',
	`verificationStatus` enum('verified','inferred','unverified') NOT NULL DEFAULT 'verified',
	`sourceUrl` text,
	`sourceName` varchar(256),
	`author` varchar(256),
	`publishedAt` timestamp,
	`tags` json DEFAULT ('[]'),
	`entities` json DEFAULT ('[]'),
	`isConfidential` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_executives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`title` varchar(256),
	`email` varchar(320),
	`linkedinUrl` text,
	`isPrimaryContact` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_executives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`type` enum('pharma','cro','tech','hospital','regulator','investor','standards_body','lobby') NOT NULL,
	`tier` enum('P0','P1','P2','P3') NOT NULL DEFAULT 'P2',
	`stage` enum('identified','researching','outreach','intro_meeting','negotiating','loi_signed','active','closed_won','closed_lost','on_hold') NOT NULL DEFAULT 'identified',
	`region` enum('US','EU','GLOBAL') NOT NULL DEFAULT 'US',
	`website` varchar(256),
	`description` text,
	`mutualValue` text,
	`dealEconomics` text,
	`killCriteria` text,
	`nextAction` text,
	`nextActionDate` timestamp,
	`estimatedArrImpact` varchar(64),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regulatory_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`body` enum('FDA_DHCOE','EMA_ITF','EU_AI_ACT','ICH_M11','CDISC_USDM','MHRA','OTHER') NOT NULL,
	`type` enum('guidance','deadline','draft','final_rule','public_comment','enforcement') NOT NULL,
	`status` enum('active','upcoming','expired','draft') NOT NULL DEFAULT 'active',
	`description` text,
	`impactLevel` enum('critical','high','medium','low') DEFAULT 'medium',
	`deadline` timestamp,
	`effectiveDate` timestamp,
	`sourceUrl` text,
	`alertSent` boolean NOT NULL DEFAULT false,
	`biorceRelevance` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `regulatory_items_id` PRIMARY KEY(`id`)
);
