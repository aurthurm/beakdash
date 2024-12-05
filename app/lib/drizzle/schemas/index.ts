import { 
  pgTable, integer, varchar, 
  jsonb, timestamp,   boolean,
  text,primaryKey
} from "drizzle-orm/pg-core";
import { z } from 'zod';
import type { AdapterAccountType } from "next-auth/adapters"
 
export const usersTable = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
})
 
export const accountsTable = pgTable("account",{
    userId: text("userId").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessionsTable = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokensTable = pgTable("verificationToken",{
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
)

export const authenticatorsTable = pgTable("authenticator", {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
)

export const connectionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  type: z.string().min(1),
  config: z.record(z.any()).optional(),
  userId: z.string().min(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}).strict();
export type IConnection = z.infer<typeof connectionSchema>;

export const connectionsTable = pgTable("connections", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  config: jsonb("config"),
  userId: varchar("user_id").references(() => usersTable.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type SelectConnection = typeof connectionsTable.$inferSelect;
export type InsertConnection = typeof connectionsTable.$inferInsert;

export const datasetsSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  type: z.string().min(1),
  connectionId: z.string().min(1),
  userId: z.string().min(1),
  schema: z.string().optional(),
  table: z.string().optional(),
  columns: z.array(z.object({
    column: z.string().min(1),
    type: z.string().min(1),
  })).optional(),
  query: z.string().optional(),
  refreshInterval: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}).strict();
export type IDataset = z.infer<typeof datasetsSchema>;

export const datasetsTable = pgTable("datasets", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  connectionId: varchar("connection_id").references(() => connectionsTable.id).notNull(),
  userId: varchar("user_id").references(() => usersTable.id).notNull(),
  schema: varchar("schema", { length: 100 }),
  table: varchar("table", { length: 100 }),
  columns: jsonb("columns"),
  query: varchar("query"),
  refreshInterval: integer("refresh_interval"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type SelectDataset = typeof datasetsTable.$inferSelect;
export type InsertDataset = typeof datasetsTable.$inferInsert;


export const pageSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1),
  route: z.string().optional(),
  icon: z.string().optional(),
  active: z.boolean().default(true),
  parentId: z.string().uuid().optional(),
  userId: z.string().uuid(),
}).strict();
export type IPage = z.infer<typeof pageSchema>;

export const pagesTable = pgTable("pages", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  label: varchar("label", { length: 255 }).notNull(),
  route: varchar("route", { length: 255 }),
  icon: varchar("icon", { length: 100 }),
  active: boolean("active").default(true),
  parentId: varchar("parent_id").references(() => pagesTable.id),
  userId: varchar("user_id").references(() => usersTable.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SelectPage = typeof pagesTable.$inferSelect;
export type InsertPage = typeof pagesTable.$inferInsert;

export const widgetSchema = z.object({
  id: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  subPageId: z.string().uuid().optional(),
  type: z.string().uuid(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  layout: z.string().min(1),
  datasetId: z.string().uuid(),
  transformConfig: z.record(z.any())
}).strict();
export type IWidget = z.infer<typeof widgetSchema>;

export const widgetsTable = pgTable("widgets", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 255 }),
  layout: jsonb("layout").notNull(),
  datasetId: varchar("dataset_id").references(() => datasetsTable.id).notNull(),
  transformConfig: jsonb("transform_config").notNull(),
  pageId: varchar("page_id").notNull(),
  subPageId: varchar("subpage_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type SelectWidget = typeof widgetsTable.$inferSelect;
export type InsertWidget = typeof widgetsTable.$inferInsert;
