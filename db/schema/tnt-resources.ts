import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Members table - stores information about TNT members
export const members = pgTable("members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  stageName: text("stage_name").notNull(),
  groupRole: text("group_role"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  nameIdx: index("members_name_idx").on(table.name),
  stageNameIdx: index("members_stage_name_idx").on(table.stageName),
}));

// Events table - stores information about TNT events
export const events = pgTable("events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  eventDate: timestamp("event_date"),
  description: text("description"),
  venue: text("venue"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  titleIdx: index("events_title_idx").on(table.title),
  eventDateIdx: index("events_event_date_idx").on(table.eventDate),
}));

// Resource types enum
export const resourceTypeEnum = z.enum(["video", "audio", "film", "other"]);
export type ResourceTypeType = z.infer<typeof resourceTypeEnum>;

// Platforms enum
export const platformEnum = z.enum(["bilibili", "douyin", "youtube", "weibo", "other"]);
export type PlatformType = z.infer<typeof platformEnum>;

// Resources table - stores media resources related to members and events
export const resources = pgTable("resources", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  url: text("url").notNull(),
  downloadUrl: text("download_url"),
  resourceType: text("resource_type").notNull().$type<ResourceTypeType>(),
  platform: text("platform").notNull().$type<PlatformType>(),
  memberId: text("member_id").references(() => members.id, { onDelete: "set null" }),
  eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
  uploadDate: timestamp("upload_date"),
  duration: integer("duration"), // in seconds
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  scrapedAt: timestamp("scraped_at")
    .$defaultFn(() => new Date())
    .notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  titleIdx: index("resources_title_idx").on(table.title),
  resourceTypeIdx: index("resources_resource_type_idx").on(table.resourceType),
  platformIdx: index("resources_platform_idx").on(table.platform),
  memberIdIdx: index("resources_member_id_idx").on(table.memberId),
  eventIdIdx: index("resources_event_id_idx").on(table.eventId),
  scrapedAtIdx: index("resources_scraped_at_idx").on(table.scrapedAt),
  // Composite index for search performance
  searchIdx: index("resources_search_idx").on(table.resourceType, table.memberId, table.eventId),
}));

// Zod schemas for validation
export const insertMemberSchema = createInsertSchema(members, {
  name: z.string().min(1, "Name is required"),
  stageName: z.string().min(1, "Stage name is required"),
  groupRole: z.string().optional(),
});

export const selectMemberSchema = createSelectSchema(members);

export const insertEventSchema = createInsertSchema(events, {
  title: z.string().min(1, "Title is required"),
  eventDate: z.date().optional(),
  description: z.string().optional(),
  venue: z.string().optional(),
});

export const selectEventSchema = createSelectSchema(events);

export const insertResourceSchema = createInsertSchema(resources, {
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Valid URL is required"),
  downloadUrl: z.string().url().optional().or(z.literal("")),
  resourceType: resourceTypeEnum,
  platform: platformEnum,
  memberId: z.string().uuid().optional().or(z.literal("")),
  eventId: z.string().uuid().optional().or(z.literal("")),
  uploadDate: z.date().optional(),
  duration: z.number().int().positive().optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
});

export const selectResourceSchema = createSelectSchema(resources);

// Type exports
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;