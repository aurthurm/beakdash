import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

/**
 * Get or create the OpenAI client instance
 */
export function getAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || undefined,
    });
  }

  return openaiClient;
}

/**
 * Check if a valid AI API key is configured
 */
export function isAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.AI_API_KEY);
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL || process.env.AI_MODEL || 'gpt-4o-mini';

/**
 * Generate a chat completion using the configured LLM provider
 */
export async function generateCompletion(
  messages: ChatMessage[],
  options: AIOptions = {}
): Promise<string> {
  const client = getAIClient();
  if (!client) {
    throw new Error('AI API key is not configured. Please set OPENAI_API_KEY in your environment.');
  }

  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.3;
  const maxTokens = options.maxTokens ?? 1500;

  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    response_format: options.responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
  });

  return completion.choices[0]?.message?.content?.trim() || '';
}

/**
 * Generate and parse structured JSON from the model
 */
export async function generateStructuredJson<T>(
  messages: ChatMessage[],
  options: AIOptions = {}
): Promise<T> {
  const rawResponse = await generateCompletion(messages, {
    ...options,
    responseFormat: 'json_object',
    temperature: options.temperature ?? 0.1,
  });

  try {
    return JSON.parse(rawResponse) as T;
  } catch (error) {
    // If strict JSON parsing failed, try extracting JSON substring
    const match = rawResponse.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error(`Failed to parse AI response as JSON: ${rawResponse}`);
  }
}
