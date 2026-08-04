-- Migration: replace decision_room_candidates with secure tokenHash + payloadJson design
-- Drop the old table (created in 0010) and recreate with the new schema
DROP TABLE IF EXISTS `decision_room_candidates`;

CREATE TABLE `decision_room_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`userOpenId` varchar(256) NOT NULL,
	`payloadJson` json NOT NULL,
	`consumedAt` timestamp,
	`consumedAction` varchar(32),
	`resultingRoomId` int,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `decision_room_candidates_id` PRIMARY KEY(`id`),
	CONSTRAINT `decision_room_candidates_tokenHash_unique` UNIQUE(`tokenHash`)
);
