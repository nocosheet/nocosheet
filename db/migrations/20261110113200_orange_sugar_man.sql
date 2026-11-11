CREATE TABLE `default__column` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_id` integer NOT NULL,
	`column_name` text NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`type` text NOT NULL,
	`format` text NOT NULL,
	`is_required` integer DEFAULT false NOT NULL,
	`is_filterable` integer DEFAULT false NOT NULL,
	`is_sortable` integer DEFAULT false NOT NULL,
	`is_searchable` integer DEFAULT false NOT NULL,
	`is_unique` integer DEFAULT false NOT NULL,
	`is_hidden` integer DEFAULT false NOT NULL,
	`check_expression` text,
	`generated_expression` text,
	`default_value` text,
	`position` integer DEFAULT 0 NOT NULL,
	`description` text,
	`options` text DEFAULT '{}' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`deleted_by` text,
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deleted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__column_name` ON `default__column` (`table_id`,lower("name")) WHERE "default__column"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `default__column_column_name` ON `default__column` (`table_id`,`column_name`);--> statement-breakpoint
CREATE INDEX `default__column_position` ON `default__column` (`table_id`,`position`) WHERE "default__column"."deleted_at" is null;--> statement-breakpoint
CREATE TABLE `default__favorite` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`table_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__favorite_user_table` ON `default__favorite` (`user_id`,`table_id`);--> statement-breakpoint
CREATE TABLE `default__trash` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_id` integer NOT NULL,
	`record_id` text NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`deleted_by` text,
	`deleted_at` integer NOT NULL,
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deleted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `default__trash_table_deleted` ON `default__trash` (`table_id`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `default__resource` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	CONSTRAINT "default__resource_kind_check" CHECK("default__resource"."kind" in ('table', 'view', 'widget'))
);
--> statement-breakpoint
CREATE TABLE `default__table` (
	`id` integer PRIMARY KEY NOT NULL,
	`table_name` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`group_name` text,
	`title_column_id` integer,
	`is_singleton` integer DEFAULT false NOT NULL,
	`id_type` text DEFAULT 'increment' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`deleted_by` text,
	FOREIGN KEY (`id`) REFERENCES `default__resource`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`title_column_id`) REFERENCES `default__column`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deleted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__table_name` ON `default__table` (lower("name")) WHERE "default__table"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `default__table_table_name` ON `default__table` (`table_name`);--> statement-breakpoint
CREATE INDEX `default__table_position` ON `default__table` (`position`) WHERE "default__table"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX `default__table_group` ON `default__table` (`group_name`,`position`) WHERE "default__table"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX `default__table_deleted` ON `default__table` (`deleted_at`) WHERE "default__table"."deleted_at" is not null;--> statement-breakpoint
CREATE TABLE `default__view` (
	`id` integer PRIMARY KEY NOT NULL,
	`table_id` integer NOT NULL,
	`view_name` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`type` text,
	`position` integer DEFAULT 0 NOT NULL,
	`select_columns` text DEFAULT '[]' NOT NULL,
	`where_expression` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`deleted_by` text,
	FOREIGN KEY (`id`) REFERENCES `default__resource`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deleted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__view_name` ON `default__view` (`table_id`,lower("name")) WHERE "default__view"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `default__view_view_name` ON `default__view` (`view_name`);--> statement-breakpoint
CREATE INDEX `default__view_table_position` ON `default__view` (`table_id`,`position`) WHERE "default__view"."deleted_at" is null;--> statement-breakpoint
CREATE TABLE `default__widget` (
	`id` integer PRIMARY KEY NOT NULL,
	`table_id` integer NOT NULL,
	`view_name` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`variant` text NOT NULL,
	`definition` text DEFAULT '{}' NOT NULL,
	`layout` text DEFAULT '{}' NOT NULL,
	`options` text DEFAULT '{}' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`deleted_by` text,
	FOREIGN KEY (`id`) REFERENCES `default__resource`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`table_id`) REFERENCES `default__table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deleted_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `default__widget_view_name` ON `default__widget` (`view_name`);--> statement-breakpoint
CREATE INDEX `default__widget_table_position` ON `default__widget` (`table_id`,`position`) WHERE "default__widget"."deleted_at" is null;