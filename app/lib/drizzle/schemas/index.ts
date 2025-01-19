import { 
  pgTable, integer, varchar, 
  jsonb, timestamp,   boolean,
  text,
  foreignKey
} from "drizzle-orm/pg-core";
import { z } from 'zod';

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
  name: varchar("name", { length: 255 }).notNull().unique(),
  type: varchar("type", { length: 10 }).notNull(),
  config: jsonb("config"),
  userId: varchar("user_id").notNull(),
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
  name: varchar("name", { length: 255 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(),
  connectionId: varchar("connection_id").references(() => connectionsTable.id).notNull(),
  userId: varchar("user_id").notNull(),
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
  route: z.string().min(1),
  icon: z.string(),
  active: z.boolean().default(false),
  parentId: z.string().uuid().optional(),
  subpages: z.array(pageSchema).optional(),
  userId: z.string().min(1),
  createdAt: z.string().datetime().transform((str) => new Date(str)).optional(),
  updatedAt: z.string().datetime().transform((str) => new Date(str)).optional()
}).strict());

// Export the inferred type
export type IPage = z.infer<typeof pageSchema>;

export const pagesTable = pgTable("pages", {
    id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    label: varchar("label", { length: 255 }).notNull().unique(),
    route: varchar("route", { length: 255 }),
    icon: varchar("icon", { length: 100 }),
    active: boolean("active").default(false),
    parentId: varchar("parent_id"),
    userId: varchar("user_id").notNull(),
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

// 'count', 'line', 'pie', 'bar', 'heatmap', 'scatter'
export const chartTypes = ['line', 'pie', 'bar', 'column', 'scatter', 'dual-axes'] as const;
export const  visualTypes = ['count', ...chartTypes] as const;
export type IChart = typeof chartTypes[number];
export type IVisual = typeof visualTypes[number];

export const widgetSchema = z.object({
  id: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  userId: z.string().min(1),
  type: z.enum(chartTypes),
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
  title: varchar("title", { length: 255 }).notNull().unique(),
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
