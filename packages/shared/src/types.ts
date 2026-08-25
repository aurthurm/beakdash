import { z } from 'zod';

// Base types
export interface BeakDashConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  createdAt: string;
  updatedAt: string;
}

export interface Widget {
  id: string;
  type: string;
  title: string;
  config: Record<string, any>;
  data?: any;
}

// Connection & Query types
export interface QueryExecutionResult<T = Record<string, any>> {
  data: T[];
  columns: { name: string; type: string; originalType?: string }[];
  rowCount: number;
  totalCount?: number;
  truncated: boolean;
  executionTimeMs: number;
  dialect: string;
}

export interface ConnectionInfo {
  id: number;
  name: string;
  type: string;
  config: Record<string, any>;
  isActive?: boolean;
}

// Dataset types
export interface DatasetInfo {
  id: number;
  name: string;
  connectionId: number;
  query?: string;
  refreshInterval?: string;
  config?: Record<string, any>;
  createdAt?: string;
}

export interface DatasetPreviewResult {
  data: Record<string, any>[];
  columns: { name: string; type: string }[];
  rowCount: number;
  totalCount: number;
  executionTimeMs: number;
  dialect: string;
}

// DB-QA types
export interface DbQaQueryInfo {
  id: number;
  name: string;
  category: string;
  query: string;
  executionFrequency?: string;
  enabled?: boolean;
  lastExecutionTime?: string;
  nextExecutionTime?: string;
}

export interface DbQaAlertInfo {
  id: number;
  queryId: number;
  name: string;
  severity: string;
  status: string;
  enabled: boolean;
  condition: Record<string, any>;
  notificationChannels?: string[];
  lastTriggeredAt?: string;
}

export interface DbQaRunResult {
  queryId: number;
  queryName: string;
  status: 'success' | 'failure' | 'error';
  executionDurationMs: number;
  rowCount: number;
  data: Record<string, any>[];
  columns: any[];
  errorMessage?: string;
  evaluatedAlerts?: any[];
  nextExecutionTime?: string | null;
}

// Embed types
export interface EmbedConfig {
  dashboardId: string | number;
  theme?: 'light' | 'dark' | 'system';
  height?: string | number;
  width?: string | number;
  showHeader?: boolean;
  showControls?: boolean;
  refreshInterval?: number;
  allowedOrigins?: string[];
  expiresInSeconds?: number;
  customStyles?: Record<string, string>;
}

export interface EmbedToken {
  token: string;
  expiresAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Validation schemas
export const WidgetSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  config: z.record(z.any()),
  data: z.any().optional()
});

export const DashboardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  widgets: z.array(WidgetSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const QueryExecutionSchema = z.object({
  data: z.array(z.record(z.any())),
  columns: z.array(z.object({
    name: z.string(),
    type: z.string(),
    originalType: z.string().optional(),
  })),
  rowCount: z.number(),
  totalCount: z.number().optional(),
  truncated: z.boolean(),
  executionTimeMs: z.number(),
  dialect: z.string(),
});

export const EmbedConfigSchema = z.object({
  dashboardId: z.union([z.string(), z.number()]),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  height: z.union([z.string(), z.number()]).optional(),
  width: z.union([z.string(), z.number()]).optional(),
  showHeader: z.boolean().optional(),
  showControls: z.boolean().optional(),
  refreshInterval: z.number().optional(),
  allowedOrigins: z.array(z.string()).optional(),
  expiresInSeconds: z.number().optional(),
  customStyles: z.record(z.string()).optional()
});

export const EmbedTokenSchema = z.object({
  token: z.string(),
  expiresAt: z.string()
});

export const ApiResponseSchema = <T extends z.ZodType>(schema: T) =>
  z.object({
    data: schema,
    meta: z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
      total: z.number().optional()
    }).optional()
  });

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional()
});