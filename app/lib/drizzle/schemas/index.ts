import { 
  pgTable, integer, varchar, 
  jsonb, timestamp,   boolean,
  text,primaryKey,
  foreignKey
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

export const conntypes = ['csv', 'sql', 'nosql', 'rest'] as const;
export const connectionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  type: z.enum(conntypes),
  config: z.record(z.any()).optional(),
  userId: z.string().min(1),
  createdAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  updatedAt: z.string().datetime().transform((str) => new Date(str)).optional()
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
  createdAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  updatedAt: z.string().datetime().transform((str) => new Date(str)).optional()
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

// First define the base schema type
interface PageSchemaType {
  id?: string;
  label: string;
  route?: string;
  icon: string;
  active?: boolean;
  parentId?: string;
  subpages?: PageSchemaType[];
  userId: string;
}

// Then create the schema with proper typing
export const pageSchema: z.ZodType<PageSchemaType> = z.lazy(() => z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1),
  icon: z.string(),
  active: z.boolean().default(false),
  parentId: z.string().uuid().optional(),
  subpages: z.array(pageSchema).optional(),
  userId: z.string().uuid(),
  createdAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  updatedAt: z.string().datetime().transform((str) => new Date(str)).optional()
}).strict());

// Export the inferred type
export type IPage = z.infer<typeof pageSchema>;

export const pagesTable = pgTable("pages", {
    id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    label: varchar("label", { length: 255 }).notNull(),
    route: varchar("route", { length: 255 }),
    icon: varchar("icon", { length: 100 }),
    active: boolean("active").default(true),
    parentId: varchar("parent_id"),
    userId: varchar("user_id").references(() => usersTable.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      parentReference: foreignKey({
        columns: [table.parentId],
        foreignColumns: [table.id],
        name: "subpage_parent_id_fkey",
      }),
    };
  }
);

export type SelectPage = typeof pagesTable.$inferSelect;
export type InsertPage = typeof pagesTable.$inferInsert;

export const wtypes = ['count', 'line', 'pie', 'bar'] as const;
export const widgetSchema = z.object({
  id: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(wtypes),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  layout: z.object({
    i: z.string().optional(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  datasetId: z.string().uuid(),
  query: z.string().optional(),
  transformConfig: z.record(z.any()),
  createdAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  updatedAt: z.string().datetime().transform((str) => new Date(str)).optional()
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
  userId: varchar("user_id").notNull(),
  query: text("query"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type SelectWidget = typeof widgetsTable.$inferSelect;
export type InsertWidget = typeof widgetsTable.$inferInsert;
