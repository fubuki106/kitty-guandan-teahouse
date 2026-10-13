CREATE TABLE `profiles` (
	`token` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`avatar` text DEFAULT '' NOT NULL,
	`updated` integer NOT NULL
);
