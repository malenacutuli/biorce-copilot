ALTER TABLE `decision_rooms` ADD `gateConfidence` int;--> statement-breakpoint
ALTER TABLE `decision_rooms` ADD `gateMateriality` enum('low','medium','high','critical');--> statement-breakpoint
ALTER TABLE `decision_rooms` ADD `gateRationale` text;--> statement-breakpoint
ALTER TABLE `decision_rooms` ADD `gateVersion` varchar(32) DEFAULT 'v1';--> statement-breakpoint
ALTER TABLE `decision_rooms` ADD `roomSource` enum('auto','user_confirmed','seeded','api') DEFAULT 'auto';--> statement-breakpoint
ALTER TABLE `decision_rooms` ADD `initiatedBy` varchar(256);