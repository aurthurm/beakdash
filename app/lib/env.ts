import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  POSTGRES_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().default('beakdash-default-development-secret-2026'),
  NEXTAUTH_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  EMBED_TOKEN_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Validate and retrieve validated environment variables
 */
export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment configuration');
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export const env = getEnv();
