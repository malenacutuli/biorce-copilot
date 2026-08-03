ALTER TABLE `job_executions` ADD `lockExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `job_executions` ADD `parentExecutionId` int;