import { pgTable, text, serial, integer, boolean, jsonb, timestamp, primaryKey, foreignKey, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Spaces schema
export const spaces = pgTable("spaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull(),
  logoUrl: text("logo_url"),
  settings: jsonb("settings").default({}),
  isPrivate: boolean("is_private").default(false),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSpaceSchema = createInsertSchema(spaces).pick({
  name: true,
  description: true,
  slug: true,
  logoUrl: true,
  settings: true,
  isPrivate: true,
  isDefault: true,
});

export const updateSpaceSchema = createInsertSchema(spaces).pick({
  name: true,
  description: true,
  slug: true,
  logoUrl: true,
  settings: true,
  isPrivate: true,
  isDefault: true,
});

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  theme: text("theme").default("light"),
  language: text("language").default("en"),
  timeZone: text("time_zone"),
  settings: jsonb("settings").default({}),
  role: text("role").default("user"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatarUrl: true,
  email: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  displayName: true,
  avatarUrl: true,
  email: true,
  theme: true,
  language: true,
  timeZone: true,
  settings: true,
});

// User-Spaces many-to-many relationship
export const userSpaces = pgTable("user_spaces", {
  userId: integer("user_id").notNull().references(() => users.id),
  spaceId: integer("space_id").notNull().references(() => spaces.id),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.spaceId] }),
  };
});

export const insertUserSpaceSchema = createInsertSchema(userSpaces).pick({
  userId: true,
  spaceId: true,
  role: true,
});

// Dashboards schema
export const dashboards = pgTable("dashboards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  spaceId: integer("space_id").references(() => spaces.id),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  layout: jsonb("layout").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDashboardSchema = createInsertSchema(dashboards).pick({
  userId: true,
  spaceId: true,
  name: true,
  description: true,
  layout: true,
});

// Connection types
export const connectionTypes = ["csv", "rest", "sql"] as const;
export const connectionTypeSchema = z.enum(connectionTypes);

// Connections schema
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  spaceId: integer("space_id").references(() => spaces.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConnectionSchema = createInsertSchema(connections).pick({
  userId: true,
  spaceId: true,
  name: true,
  type: true,
  config: true,
});

// Datasets schema
export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  connectionId: integer("connection_id").references(() => connections.id),
  name: text("name").notNull(),
  query: text("query"),
  refreshInterval: text("refresh_interval").default("manual"),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDatasetSchema = createInsertSchema(datasets).pick({
  userId: true,
  connectionId: true,
  name: true,
  query: true,
  refreshInterval: true,
  config: true,
});

// Widget types
export const widgetTypes = ["chart", "text", "table"] as const;
export const widgetSchemas = z.enum(widgetTypes);
export const xxx = [
  "bar", "column", "line", "pie", "area", "scatter", "dual-axes", "counter", "stat-card",
  "histogram", "word-cloud"
] as const;
export const chartTypes = [
  "bar", "column", 'line', 'pie', 'area', "scatter", "dual-axes", "counter", "stat-card", "box-plot", "word-cloud", "histogram"
] as const;
export const chartSchemas = z.enum(chartTypes);



// Widgets schema
// Define a forward reference for widgets table
const widgetsRef: any = {};

// Define base widget config type
type BaseWidgetConfig = {
  chartType?: z.infer<typeof chartSchemas>;
  autoFit?: boolean;
  height?: number;
  width?: number;
  textContent?: string;
  xField?: string;
  yField?: string;
  colorField?: string;
  shapeField?: string;
  sizeField?: string;
  seriesField?: string;
  angleField?: string;
  textField?: string;
  stack?: boolean | {
    groupBy?: string[];
    orderBy?: string;
    series?: boolean;
  };
  normalize?: boolean;
  binField?: string;
  channel?: string;
  binNumber?: number;
  binWidth?: number;
  innerRadius?: number;
  tooltip?: boolean | {
     channel?: string;
     valueFormatter?: string;
     shared?: boolean;
     marker?: boolean;
  } | any;
  sort?: boolean | {
    reverse?: boolean;
    by?: string;
  };
  group?: boolean | {
    reverse?: boolean;
    by?: string;
  };
  point?: {
    shapeField?: string;
    sizeField?: number;
  };
  boxType?: string;
  interaction?: {
    elementHighlight?: boolean;
    tooltip?: {
      marker?: boolean;
      shared?: boolean;
    };
  };
  style?: {
    inset?: number;
    lineWidth?: number;
    lineDash?: number[];
    fillOpacity?: number;
    stroke?: string;
  };
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingTop?: number;
  scale?: {
    x?: {
      paddingInner?: number;
      paddingOuter?: number;
      domainMin?: number;
      tickCount?: number;
    };
    y?: {
      zero?: boolean;
      domainMin?: number;
      tickCount?: number;
    };
  };
  percent?: boolean;
  label?: any;
  legend?: {
    size?: boolean;
    color?: {
      title?: boolean;
      position?: 'top' | 'right' | 'bottom' | 'left';
      rowPadding?: number;
      itemMarker?: (v: any) => string;
    };
  };
  layout?: {
    spiral?: string;
  };
  children?: WidgetConfig[];
  type?: string;
  axis?: {
    x?: {
      position?: string;
      title?: boolean | string;
      grid?: boolean;
      tick?: boolean;
      line?: boolean;
      label?: boolean | any;
      labelFormatter?: (v: any) => any;
      labelTransform?: string;
      labelSpacing?: number;
      labelFontSize?: number;
      style?: {
        titleFill?: string;
      };
    };
    y?: {
      position?: string;
      title?: boolean | string;
      grid?: boolean;
      tick?: boolean;
      line?: boolean;
      label?: boolean | any;
      labelFormatter?: (v: any) => any;
      labelTransform?: string;
      labelSpacing?: number;
      labelFontSize?: number;
      style?: {
        titleFill?: string;
      };
    };
  };
  [key: string]: any;
};

export type WidgetConfig = BaseWidgetConfig;

export const WidgetConfigSchema: z.ZodType<WidgetConfig> = z.object({
  chartType: chartSchemas.optional(),
  autoFit: z.boolean().optional(),
  height: z.number().optional(),
  width: z.number().optional(),
  textContent: z.string().optional(),
  xField: z.string().optional(),
  yField: z.string().optional(),
  colorField: z.string().optional(),
  shapeField: z.string().optional(),
  sizeField: z.string().optional(),
  seriesField: z.string().optional(),
  angleField: z.string().optional(),
  textField: z.string().optional(),
  stack: z.union([
    z.boolean().optional(), 
    z.object({
    groupBy: z.array(z.string()).optional(),
    orderBy: z.string().optional(),
    series: z.boolean().optional(),
  })]).optional(),
  normalize: z.boolean().optional(),
  tooltip: z.union([
    z.boolean().optional(),
    z.object({
      channel: z.string(),
      valueFormatter: z.string(),
    }).optional(),
  ]).optional(),
  binField: z.string().optional(),
  channel: z.string().optional(),
  binNumber: z.number().optional(),
  binWidth: z.number().optional(),
  innerRadius: z.number().optional(),
  sort: z.union([
    z.boolean().optional(), 
    z.object({
    reverse: z.boolean().optional(),
    by: z.string().optional(),
  })]).optional(),
  group: z.union([
    z.boolean().optional(), 
    z.object({
    reverse: z.boolean().optional(),
    by: z.string().optional(),
  })]).optional(),
  point: z.object({
    shapeField: z.string().optional(),
    sizeField: z.number().optional(),
  }).optional(),
  boxType: z.string().optional(),
  interaction: z.object({
    elementHighlight: z.boolean().optional(),
    tooltip: z.object({
      marker: z.boolean().optional(),
      shared: z.boolean().optional(),
    }).optional(),
  }).optional(),
  style: z.object({
    inset: z.number().optional(),
    lineWidth: z.number().optional(),
    lineDash: z.array(z.number()).optional(),
    fillOpacity: z.number().optional(),
    stroke: z.string().optional(),
  }).optional(),
  paddingRight: z.number().optional(),
  paddingBottom: z.number().optional(),
  paddingLeft: z.number().optional(),
  paddingTop: z.number().optional(),
  scale: z.object({
    x: z.object({
      paddingInner: z.number().optional(),
      paddingOuter: z.number().optional(),
      domainMin: z.number().optional(),
      tickCount: z.number().optional(),
    }).optional(),
    y: z.object({
      zero: z.boolean().optional(),
      domainMin: z.number().optional(),
      tickCount: z.number().optional(),
    }).optional(),
  }).optional(),
  percent: z.boolean().optional(),
  label: z.object({
    text: z.string().optional(),
    style: z.object({
      fontWeight: z.string().optional(),
    }).optional(),
  }).optional(),
  legend: z.object({
    size: z.boolean().optional(),
    color: z.object({
      title: z.boolean().optional(),
      position: z.enum(['top', 'right', 'bottom', 'left']).optional(),
      rowPadding: z.number().optional(),
    }).optional(),
  }).optional(),
  layout: z.object({
    spiral: z.string().optional(),
  }).optional(),
  children: z.array(z.lazy(() => WidgetConfigSchema)).optional(),
  // children schema in dual axes
  type: z.string().optional(),
  axis: z.object({
    x: z.object({
      position: z.string().optional(),
      title: z.boolean().optional(),
      grid: z.boolean().optional(),
      tick: z.boolean().optional(),
      label: z.boolean().optional(),
      style: z.object({
        titleFill: z.string().optional(),
      }).optional(),
    }).optional(),
    y: z.object({
      position: z.string().optional(),
      title: z.boolean().optional(),
      grid: z.boolean().optional(),
      tick: z.boolean().optional(),
      label: z.boolean().optional(),
      style: z.object({
        titleFill: z.string().optional(),
      }).optional(),
    }).optional(),
  }).optional(),
});

export const widgets = pgTable("widgets", {
  id: serial("id").primaryKey(),
  datasetId: integer("dataset_id").references(() => datasets.id),
  connectionId: integer("connection_id").references(() => connections.id),
  spaceId: integer("space_id").references(() => spaces.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  config: jsonb("config").default({}).$type<WidgetConfig>(),
  customQuery: text("custom_query"),
  data: jsonb("data").default([]).$type<Record<string, any>[]>(),
  position: jsonb("position").default({ x: 0, y: 0, w: 3, h: 2 }).$type<{ x: number; y: number; w: number; h: number; minW?: number; minH?: number }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dashboard Widgets join table for many-to-many relationship
export const dashboardWidgets = pgTable("dashboard_widgets", {
  dashboardId: integer("dashboard_id").notNull().references(() => dashboards.id),
  widgetId: integer("widget_id").notNull().references(() => widgets.id),
  position: jsonb("position").default({}).$type<{ x?: number; y?: number; w?: number; h?: number; minW?: number; minH?: number }>(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.dashboardId, table.widgetId] }),
  };
});

export const insertWidgetSchema = createInsertSchema(widgets).pick({
  datasetId: true,
  connectionId: true,
  spaceId: true,
  name: true,
  description: true,
  type: true,
  config: true,
  customQuery: true,
  position: true,
});

export const insertDashboardWidgetSchema = createInsertSchema(dashboardWidgets).pick({
  dashboardId: true,
  widgetId: true,
  position: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Space = typeof spaces.$inferSelect;
export type InsertSpace = z.infer<typeof insertSpaceSchema>;
export type UpdateSpace = z.infer<typeof updateSpaceSchema>;

export type UserSpace = typeof userSpaces.$inferSelect;
export type InsertUserSpace = z.infer<typeof insertUserSpaceSchema>;

export type Dashboard = typeof dashboards.$inferSelect;
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type ConnectionType = z.infer<typeof connectionTypeSchema>;

export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = z.infer<typeof insertDatasetSchema>;

export type Widget = typeof widgets.$inferSelect;
export type WidgetType = z.infer<typeof widgetSchemas>;
export type InsertWidget = z.infer<typeof insertWidgetSchema>;
export type ChartType = z.infer<typeof chartSchemas>;

export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type InsertDashboardWidget = z.infer<typeof insertDashboardWidgetSchema>;

// Schema for position data
export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

// User Settings Schema
export const userSettingsSchema = z.object({
  // Privacy & Security
  dataSharing: z.boolean().default(false),
  analytics: z.boolean().default(false),
  emailNotifications: z.boolean().default(true),
  twoFactorAuth: z.boolean().default(false),
  sessionTimeout: z.number().min(5).max(1440).default(30), // in minutes
  lastPasswordChange: z.string().nullable().default(null),

  // Appearance
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  language: z.string().default('en'),
  timeZone: z.string().default('UTC'),

  // Dashboard Settings
  autoRefresh: z.boolean().default(true),
  refreshInterval: z.number().min(1).max(60).default(5), // in minutes
  defaultDashboardId: z.number().nullable().default(null),

  // API Keys
  apiKeys: z.array(z.object({
    id: z.string(),
    name: z.string(),
    key: z.string(),
    createdAt: z.string(),
    lastUsed: z.string().nullable(),
    permissions: z.array(z.string())
  })).default([]),

  // Integrations
  integrations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    status: z.enum(['active', 'inactive', 'error']),
    config: z.record(z.any()),
    lastSync: z.string().nullable(),
    error: z.string().nullable()
  })).default([])
});

// Define relationships between tables
import { relations } from "drizzle-orm";

// Space relations
export const spacesRelations = relations(spaces, ({ many }) => ({
  dashboards: many(dashboards),
  connections: many(connections),
  userSpaces: many(userSpaces),
  widgets: many(widgets), // Add widgets relation
}));

// UserSpace relations
export const userSpacesRelations = relations(userSpaces, ({ one }) => ({
  user: one(users, {
    fields: [userSpaces.userId],
    references: [users.id],
  }),
  space: one(spaces, {
    fields: [userSpaces.spaceId],
    references: [spaces.id],
  }),
}));

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  dashboards: many(dashboards),
  connections: many(connections),
  datasets: many(datasets),
  userSpaces: many(userSpaces),
}));

// Dashboard relations
export const dashboardsRelations = relations(dashboards, ({ one, many }) => ({
  user: one(users, {
    fields: [dashboards.userId],
    references: [users.id],
  }),
  space: one(spaces, {
    fields: [dashboards.spaceId],
    references: [spaces.id],
  }),
  dashboardWidgets: many(dashboardWidgets),
}));

// Connection relations
export const connectionsRelations = relations(connections, ({ one, many }) => ({
  user: one(users, {
    fields: [connections.userId],
    references: [users.id],
  }),
  space: one(spaces, {
    fields: [connections.spaceId],
    references: [spaces.id],
  }),
  datasets: many(datasets),
  widgets: many(widgets),
}));

// Dataset relations
export const datasetsRelations = relations(datasets, ({ one, many }) => ({
  user: one(users, {
    fields: [datasets.userId],
    references: [users.id],
  }),
  connection: one(connections, {
    fields: [datasets.connectionId],
    references: [connections.id],
  }),
  widgets: many(widgets),
}));

// Widget relations
export const widgetsRelations = relations(widgets, ({ one, many }) => {
  return {
    dataset: one(datasets, {
      fields: [widgets.datasetId],
      references: [datasets.id],
    }),
    connection: one(connections, {
      fields: [widgets.connectionId],
      references: [connections.id],
    }),
    space: one(spaces, {
      fields: [widgets.spaceId],
      references: [spaces.id],
    }),
    dashboardWidgets: many(dashboardWidgets),
  };
});

// DashboardWidget relations
export const dashboardWidgetsRelations = relations(dashboardWidgets, ({ one }) => ({
  dashboard: one(dashboards, {
    fields: [dashboardWidgets.dashboardId],
    references: [dashboards.id],
  }),
  widget: one(widgets, {
    fields: [dashboardWidgets.widgetId],
    references: [widgets.id],
  }),
}));

// ============ DB QA Schemas ============ //

// DB QA category types
export const dbQaCategoryTypes = [
  "data_completeness", 
  "data_consistency", 
  "data_accuracy", 
  "data_integrity",
  "data_timeliness", 
  "data_uniqueness", 
  "data_relationship", 
  "sensitive_data_exposure"
] as const;

export const dbQaCategoryTypeSchema = z.enum(dbQaCategoryTypes);

// DB QA Execution Frequency types
export const dbQaFrequencyTypes = [
  "manual", 
  "hourly", 
  "daily", 
  "weekly", 
  "monthly"
] as const;

export const dbQaFrequencyTypeSchema = z.enum(dbQaFrequencyTypes);

// DB QA Queries schema
export const dbQaQueries = pgTable("db_qa_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  connectionId: integer("connection_id").notNull().references(() => connections.id),
  spaceId: integer("space_id").references(() => spaces.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  query: text("query").notNull(),
  expectedResult: jsonb("expected_result").default({}),
  thresholds: jsonb("thresholds").default({}),
  enabled: boolean("enabled").default(true),
  executionFrequency: text("execution_frequency").default("manual"),
  lastExecutionTime: timestamp("last_execution_time"),
  nextExecutionTime: timestamp("next_execution_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDbQaQuerySchema = createInsertSchema(dbQaQueries).pick({
  userId: true,
  connectionId: true,
  spaceId: true,
  name: true,
  description: true,
  category: true,
  query: true,
  expectedResult: true,
  thresholds: true,
  enabled: true,
  executionFrequency: true,
});

// DB QA Execution Results schema
export const dbQaExecutionResults = pgTable("db_qa_execution_results", {
  id: serial("id").primaryKey(),
  queryId: integer("query_id").notNull().references(() => dbQaQueries.id),
  executionTime: timestamp("execution_time").defaultNow(),
  status: text("status").notNull(), // success, failure, error
  result: jsonb("result").default({}),
  metrics: jsonb("metrics").default({}),
  executionDuration: integer("execution_duration"),
  errorMessage: text("error_message"),
});

export const insertDbQaExecutionResultSchema = createInsertSchema(dbQaExecutionResults).pick({
  queryId: true,
  status: true,
  result: true,
  metrics: true,
  executionDuration: true,
  errorMessage: true,
});

// DB QA Alerts schema
export const dbQaAlerts = pgTable("db_qa_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  queryId: integer("query_id").notNull().references(() => dbQaQueries.id),
  spaceId: integer("space_id").references(() => spaces.id),
  executionResultId: integer("execution_result_id").references(() => dbQaExecutionResults.id),
  name: text("name").notNull(),
  description: text("description"),
  severity: text("severity").notNull().default("medium"),
  condition: jsonb("condition").notNull(),
  status: text("status").notNull().default("active"), // active, resolved, snoozed
  enabled: boolean("enabled").default(true),
  notificationChannels: jsonb("notification_channels").default([]),
  emailRecipients: text("email_recipients"),
  slackWebhook: text("slack_webhook"),
  customWebhook: text("custom_webhook"),
  throttleMinutes: integer("throttle_minutes").default(60),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertDbQaAlertSchema = createInsertSchema(dbQaAlerts).pick({
  userId: true,
  queryId: true,
  spaceId: true,
  executionResultId: true,
  name: true,
  description: true,
  severity: true,
  condition: true,
  status: true,
  enabled: true,
  notificationChannels: true,
  emailRecipients: true,
  slackWebhook: true,
  customWebhook: true,
  throttleMinutes: true,
});

// DB QA Alert Notifications schema
export const dbQaAlertNotifications = pgTable("db_qa_alert_notifications", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").notNull().references(() => dbQaAlerts.id),
  channel: text("channel").notNull(), // email, slack, webhook
  sentAt: timestamp("sent_at").defaultNow(),
  status: text("status").notNull(), // sent, failed
  content: jsonb("content").default({}),
  errorMessage: text("error_message"),
});

export const insertDbQaAlertNotificationSchema = createInsertSchema(dbQaAlertNotifications).pick({
  alertId: true,
  channel: true,
  status: true,
  content: true,
  errorMessage: true,
});

// DB QA Dashboards schema - for custom DB QA dashboards
export const dbQaDashboards = pgTable("db_qa_dashboards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  spaceId: integer("space_id").references(() => spaces.id),
  name: text("name").notNull(),
  description: text("description"),
  layout: jsonb("layout").default({}),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDbQaDashboardSchema = createInsertSchema(dbQaDashboards).pick({
  userId: true,
  spaceId: true,
  name: true,
  description: true,
  layout: true,
  isDefault: true,
});

// DB QA Dashboard Widgets join table for many-to-many relationship
export const dbQaDashboardQueries = pgTable("db_qa_dashboard_queries", {
  dashboardId: integer("dashboard_id").notNull().references(() => dbQaDashboards.id),
  queryId: integer("query_id").notNull().references(() => dbQaQueries.id),
  position: jsonb("position").default({}),
  visualizationType: text("visualization_type").default("table"),
  visualizationConfig: jsonb("visualization_config").default({}),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.dashboardId, table.queryId] }),
  };
});

export const insertDbQaDashboardQuerySchema = createInsertSchema(dbQaDashboardQueries).pick({
  dashboardId: true,
  queryId: true,
  position: true,
  visualizationType: true,
  visualizationConfig: true,
});

// Type exports for DB QA
export type DbQaCategory = z.infer<typeof dbQaCategoryTypeSchema>;
export type DbQaFrequency = z.infer<typeof dbQaFrequencyTypeSchema>;

export type DbQaQuery = typeof dbQaQueries.$inferSelect;
export type InsertDbQaQuery = z.infer<typeof insertDbQaQuerySchema>;

export type DbQaExecutionResult = typeof dbQaExecutionResults.$inferSelect;
export type InsertDbQaExecutionResult = z.infer<typeof insertDbQaExecutionResultSchema>;

export type DbQaAlert = typeof dbQaAlerts.$inferSelect;
export type InsertDbQaAlert = z.infer<typeof insertDbQaAlertSchema>;

export type DbQaAlertNotification = typeof dbQaAlertNotifications.$inferSelect;
export type InsertDbQaAlertNotification = z.infer<typeof insertDbQaAlertNotificationSchema>;

export type DbQaDashboard = typeof dbQaDashboards.$inferSelect;
export type InsertDbQaDashboard = z.infer<typeof insertDbQaDashboardSchema>;

export type DbQaDashboardQuery = typeof dbQaDashboardQueries.$inferSelect;
export type InsertDbQaDashboardQuery = z.infer<typeof insertDbQaDashboardQuerySchema>;

// DB QA Relations
export const dbQaQueriesRelations = relations(dbQaQueries, ({ one, many }) => ({
  user: one(users, {
    fields: [dbQaQueries.userId],
    references: [users.id],
  }),
  connection: one(connections, {
    fields: [dbQaQueries.connectionId],
    references: [connections.id],
  }),
  space: one(spaces, {
    fields: [dbQaQueries.spaceId],
    references: [spaces.id],
  }),
  executionResults: many(dbQaExecutionResults),
  alerts: many(dbQaAlerts),
  dashboardQueries: many(dbQaDashboardQueries),
}));

export const dbQaExecutionResultsRelations = relations(dbQaExecutionResults, ({ one, many }) => ({
  query: one(dbQaQueries, {
    fields: [dbQaExecutionResults.queryId],
    references: [dbQaQueries.id],
  }),
  alerts: many(dbQaAlerts),
}));

export const dbQaAlertsRelations = relations(dbQaAlerts, ({ one, many }) => ({
  user: one(users, {
    fields: [dbQaAlerts.userId],
    references: [users.id],
  }),
  query: one(dbQaQueries, {
    fields: [dbQaAlerts.queryId],
    references: [dbQaQueries.id],
  }),
  executionResult: one(dbQaExecutionResults, {
    fields: [dbQaAlerts.executionResultId],
    references: [dbQaExecutionResults.id],
  }),
  notifications: many(dbQaAlertNotifications),
}));

export const dbQaAlertNotificationsRelations = relations(dbQaAlertNotifications, ({ one }) => ({
  alert: one(dbQaAlerts, {
    fields: [dbQaAlertNotifications.alertId],
    references: [dbQaAlerts.id],
  }),
}));

export const dbQaDashboardsRelations = relations(dbQaDashboards, ({ one, many }) => ({
  user: one(users, {
    fields: [dbQaDashboards.userId],
    references: [users.id],
  }),
  space: one(spaces, {
    fields: [dbQaDashboards.spaceId],
    references: [spaces.id],
  }),
  dashboardQueries: many(dbQaDashboardQueries),
}));

export const dbQaDashboardQueriesRelations = relations(dbQaDashboardQueries, ({ one }) => ({
  dashboard: one(dbQaDashboards, {
    fields: [dbQaDashboardQueries.dashboardId],
    references: [dbQaDashboards.id],
  }),
  query: one(dbQaQueries, {
    fields: [dbQaDashboardQueries.queryId],
    references: [dbQaQueries.id],
  }),
}));

// Update user relations to include DB QA entities
export const usersRelationsUpdated = relations(users, ({ many }) => ({
  dashboards: many(dashboards),
  connections: many(connections),
  datasets: many(datasets),
  userSpaces: many(userSpaces),
  dbQaQueries: many(dbQaQueries),
  dbQaAlerts: many(dbQaAlerts),
  dbQaDashboards: many(dbQaDashboards),
}));

// Update space relations to include DB QA entities
export const spacesRelationsUpdated = relations(spaces, ({ many }) => ({
  dashboards: many(dashboards),
  connections: many(connections),
  userSpaces: many(userSpaces),
  widgets: many(widgets),
  dbQaQueries: many(dbQaQueries),
  dbQaDashboards: many(dbQaDashboards),
}));

// Update connection relations to include DB QA queries
export const connectionsRelationsUpdated = relations(connections, ({ one, many }) => ({
  user: one(users, {
    fields: [connections.userId],
    references: [users.id],
  }),
  space: one(spaces, {
    fields: [connections.spaceId],
    references: [spaces.id],
  }),
  datasets: many(datasets),
  widgets: many(widgets),
  dbQaQueries: many(dbQaQueries),
}));
