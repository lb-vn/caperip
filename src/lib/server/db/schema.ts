import {
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const codes = pgTable(
  "codes",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 16 }).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    impressions: integer("impressions").notNull().default(0),
    claimedCount: integer("claimed_count").notNull().default(0),
    reportCount: integer("report_count").notNull().default(0),
    status: text("status").notNull().default("active"),
    submitterIpHash: text("submitter_ip_hash").notNull(),
  },
  (t) => ({
    codeUnique: uniqueIndex("codes_code_unique").on(t.code),
    statusIdx: index("codes_status_idx").on(t.status),
  }),
);

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    codeId: integer("code_id")
      .notNull()
      .references(() => codes.id, { onDelete: "cascade" }),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqPerIp: uniqueIndex("reports_code_ip_unique").on(t.codeId, t.ipHash),
  }),
);

// Rate limiting only. Rows older than 7 days are deleted by the cleanup loop.
export const rateEvents = pgTable(
  "rate_events",
  {
    id: serial("id").primaryKey(),
    ipHash: text("ip_hash").notNull(),
    action: text("action").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    lookupIdx: index("rate_events_lookup_idx").on(
      t.ipHash,
      t.action,
      t.createdAt,
    ),
  }),
);

export const speedReports = pgTable(
  "speed_reports",
  {
    id: serial("id").primaryKey(),
    zip: varchar("zip", { length: 10 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    downMbps: real("down_mbps").notNull(),
    upMbps: real("up_mbps").notNull(),
    pingMs: real("ping_ms").notNull(),
    timeBucket: text("time_bucket").notNull(),
    device: varchar("device", { length: 100 }),
    source: varchar("source", { length: 50 }).notNull().default("cape.rip"),
    lat: real("lat"), // Rounded to 2 decimal places
    lng: real("lng"), // Rounded to 2 decimal places
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    fingerprint: text("fingerprint").notNull(), // IP hash
    status: text("status").notNull().default("active"),
  },
  (t) => ({
    zipIdx: index("speed_reports_zip_idx").on(t.zip),
    cityStateIdx: index("speed_reports_city_state_idx").on(t.city, t.state),
    statusIdx: index("speed_reports_status_idx").on(t.status),
  }),
);

export type Code = typeof codes.$inferSelect;
