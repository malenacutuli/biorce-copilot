CREATE TABLE `agent_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`decisionRoomId` int NOT NULL,
	`agentId` varchar(64) NOT NULL,
	`agentName` varchar(128) NOT NULL,
	`claimText` text NOT NULL,
	`claimType` enum('finding','challenge','rebuttal','synthesis','minority') NOT NULL DEFAULT 'finding',
	`confidence` int DEFAULT 50,
	`round` int DEFAULT 1,
	`knowledgeItemIds` json DEFAULT ('[]'),
	`citations` json DEFAULT ('[]'),
	`excerpts` json DEFAULT ('[]'),
	`voteSupport` int DEFAULT 0,
	`voteOppose` int DEFAULT 0,
	`voteAbstain` int DEFAULT 0,
	`voteInsufficientEvidence` int DEFAULT 0,
	`adjudicationStatus` enum('pending','supported','contested','rejected','insufficient_evidence') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `claim_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`claimId` int NOT NULL,
	`decisionRoomId` int NOT NULL,
	`votingAgentId` varchar(64) NOT NULL,
	`vote` enum('support','oppose','abstain','insufficient_evidence') NOT NULL,
	`rationale` text,
	`confidence` int DEFAULT 50,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `claim_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `decision_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`question` text NOT NULL,
	`context` text,
	`partnerId` int,
	`status` enum('open','deliberating','consensus_reached','approved','modified','rejected','more_evidence') NOT NULL DEFAULT 'open',
	`consensusScore` int,
	`recommendedAction` text,
	`minorityReport` text,
	`conflictingAgents` json DEFAULT ('[]'),
	`resolvedConflicts` json DEFAULT ('[]'),
	`agentsInvoked` json DEFAULT ('[]'),
	`debateRounds` int DEFAULT 0,
	`executiveDecision` enum('approved','modified','rejected','more_evidence'),
	`executiveNotes` text,
	`decisionOwner` varchar(256),
	`decisionDeadline` timestamp,
	`decisionMadeAt` timestamp,
	`decisionMadeBy` int,
	`predictedOutcome` text,
	`actualOutcome` text,
	`outcomeRecordedAt` timestamp,
	`outcomeAccuracy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decision_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`decisionRoomId` int,
	`claimId` int,
	`agentId` varchar(64),
	`knowledgeItemId` int,
	`sourceUrl` text,
	`sourceName` varchar(512),
	`sourceType` enum('primary','secondary','regulatory','internal','press','signal') DEFAULT 'secondary',
	`publishedAt` timestamp,
	`excerpt` text NOT NULL,
	`relationship` enum('supports','contradicts','contextualizes','insufficient') NOT NULL DEFAULT 'supports',
	`verificationStatus` enum('verified','unverified','disputed','retracted') DEFAULT 'unverified',
	`retrievedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outcome_learning` (
	`id` int AUTO_INCREMENT NOT NULL,
	`decisionRoomId` int,
	`partnerId` int,
	`agentId` varchar(64),
	`predictedOutcome` text NOT NULL,
	`predictedConfidence` int,
	`predictedAt` timestamp NOT NULL DEFAULT (now()),
	`actualOutcome` text,
	`actualRecordedAt` timestamp,
	`accuracyScore` int,
	`wrongAssumptions` json DEFAULT ('[]'),
	`correctAssumptions` json DEFAULT ('[]'),
	`learningNote` text,
	`calibrationAdjustment` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `outcome_learning_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnership_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetType` enum('lighthouse_sponsor','workflow_distribution','standards_position','execution_data_loop','independent_evidence') NOT NULL,
	`title` varchar(256) NOT NULL,
	`strategicObjective` text,
	`accountableOwner` varchar(256),
	`candidatePartnerIds` json DEFAULT ('[]'),
	`primaryPartnerId` int,
	`currentConfidence` int DEFAULT 0,
	`targetConfidence` int DEFAULT 80,
	`status` enum('not_started','in_progress','at_risk','on_track','achieved') DEFAULT 'not_started',
	`nextMilestone` varchar(512),
	`nextMilestoneDate` timestamp,
	`decisionRequired` text,
	`currentBlocker` text,
	`evidenceProduced` json DEFAULT ('[]'),
	`commercialImpact` text,
	`strategicImpact` text,
	`killCriteria` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partnership_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `media_items` MODIFY COLUMN `transcriptText` mediumtext;