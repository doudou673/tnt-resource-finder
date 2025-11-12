CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"stage_name" text NOT NULL,
	"group_role" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"event_date" timestamp,
	"description" text,
	"venue" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"download_url" text,
	"resource_type" text NOT NULL,
	"platform" text NOT NULL,
	"member_id" text,
	"event_id" text,
	"upload_date" timestamp,
	"duration" integer,
	"description" text,
	"thumbnail_url" text,
	"scraped_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "members_name_idx" ON "members" ("name");
--> statement-breakpoint
CREATE INDEX "members_stage_name_idx" ON "members" ("stage_name");
--> statement-breakpoint
CREATE INDEX "events_title_idx" ON "events" ("title");
--> statement-breakpoint
CREATE INDEX "events_event_date_idx" ON "events" ("event_date");
--> statement-breakpoint
CREATE INDEX "resources_title_idx" ON "resources" ("title");
--> statement-breakpoint
CREATE INDEX "resources_resource_type_idx" ON "resources" ("resource_type");
--> statement-breakpoint
CREATE INDEX "resources_platform_idx" ON "resources" ("platform");
--> statement-breakpoint
CREATE INDEX "resources_member_id_idx" ON "resources" ("member_id");
--> statement-breakpoint
CREATE INDEX "resources_event_id_idx" ON "resources" ("event_id");
--> statement-breakpoint
CREATE INDEX "resources_scraped_at_idx" ON "resources" ("scraped_at");
--> statement-breakpoint
CREATE INDEX "resources_search_idx" ON "resources" ("resource_type", "member_id", "event_id");
--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;