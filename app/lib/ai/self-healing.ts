import { getAIClient, isAIConfigured, ChatMessage } from './client';
import { SchemaInfo } from '../db/schema-info';
import { executeQuery, validateQuerySafety, QueryExecutionResult } from '../db/query-engine';
import { BaseConnectionConfig } from '../db/connection-pool';

export interface HealingResult {
  healed: boolean;
  healedSql: string;
  originalSql: string;
  originalError: string;
  errorCategory: 'MISSING_COLUMN' | 'MISSING_TABLE' | 'SYNTAX_ERROR' | 'ZERO_DIVISION' | 'AGGREGATION_ERROR' | 'TYPE_MISMATCH' | 'ZERO_ROWS' | 'UNKNOWN';
  attempts: number;
  explanation: string;
  executionResult?: QueryExecutionResult;
}

/**
 * Classify database execution error category based on PostgreSQL / MySQL error patterns
 */
export function classifySqlError(errorMessage: string): HealingResult['errorCategory'] {
  const msg = errorMessage.toLowerCase();
  if (msg.includes('does not exist') && (msg.includes('column') || msg.includes('attribute'))) {
    return 'MISSING_COLUMN';
  }
  if (msg.includes('does not exist') && (msg.includes('relation') || msg.includes('table') || msg.includes('schema'))) {
    return 'MISSING_TABLE';
  }
  if (msg.includes('division by zero') || msg.includes('22012')) {
    return 'ZERO_DIVISION';
  }
  if (msg.includes('syntax error') || msg.includes('42601')) {
    return 'SYNTAX_ERROR';
  }
  if (msg.includes('must appear in the group by clause') || msg.includes('42803') || msg.includes('aggregate')) {
    return 'AGGREGATION_ERROR';
  }
  if (msg.includes('type') && (msg.includes('mismatch') || msg.includes('cannot be cast') || msg.includes('42804'))) {
    return 'TYPE_MISMATCH';
  }
  if (msg.includes('zero rows') || msg.includes('empty result')) {
    return 'ZERO_ROWS';
  }
  return 'UNKNOWN';
}

/**
 * Self-heal a failed SQL query using LLM reasoning and schema context
 */
export async function selfHealQuery(
  originalSql: string,
  errorMessage: string,
  schemaInfo: SchemaInfo,
  connectionType: string,
  config: BaseConnectionConfig,
  maxRetries: number = 2
): Promise<HealingResult> {
  const errorCategory = classifySqlError(errorMessage);

  if (!isAIConfigured()) {
    // Basic heuristic healing for division by zero and simple typos
    let healedSql = originalSql;
    if (errorCategory === 'ZERO_DIVISION') {
      healedSql = originalSql.replace(/\/(\s*[a-zA-Z0-9_]+)/g, '/ NULLIF($1, 0)');
    }

    try {
      const res = await executeQuery(connectionType, config, healedSql);
      return {
        healed: true,
        healedSql,
        originalSql,
        originalError: errorMessage,
        errorCategory,
        attempts: 1,
        explanation: 'Applied heuristic NULLIF zero-division guard.',
        executionResult: res,
      };
    } catch {
      return {
        healed: false,
        healedSql: originalSql,
        originalSql,
        originalError: errorMessage,
        errorCategory,
        attempts: 1,
        explanation: 'Failed to heuristically self-heal without AI provider.',
      };
    }
  }

  const client = getAIClient()!;
  let currentAttempt = 0;
  let currentSql = originalSql;
  let currentError = errorMessage;

  // Format schema for prompt
  const schemaLines: string[] = [];
  for (const [sch, tbls] of Object.entries(schemaInfo)) {
    for (const [tbl, cols] of Object.entries(tbls)) {
      const colDefs = cols.map(c => `${c.column} (${c.type})`).join(', ');
      schemaLines.push(`${sch}.${tbl} [${colDefs}]`);
    }
  }
  const formattedSchema = schemaLines.slice(0, 50).join('\n');

  while (currentAttempt < maxRetries) {
    currentAttempt++;

    const systemPrompt = `You are the BeakDash SQL Self-Healing Engine.
A SQL query failed during execution on a ${connectionType.toUpperCase()} database.
Your mission is to analyze the exact error traceback, inspect the schema, fix the SQL syntax/column/table issues, and output working read-only SQL.

DATABASE SCHEMA:
${formattedSchema}

RULES:
1. Return a JSON object with:
{
  "healedSql": "Fixed SQL query string",
  "explanation": "Brief explanation of what caused the error and how it was fixed"
}
2. Only generate SELECT queries.
3. Protect against division by zero using NULLIF(denominator, 0).
4. Ensure all columns and table names match the exact schema.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `FAILED SQL:
${currentSql}

ERROR MESSAGE:
${currentError}

ERROR CATEGORY:
${errorCategory}

Please self-heal and return the corrected SQL.`,
      },
    ];

    try {
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: messages as any,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
      const fixedSql = parsed.healedSql?.trim();
      const explanation = parsed.explanation || 'Fixed SQL syntax and column references.';

      if (!fixedSql) {
        throw new Error('LLM did not return healedSql');
      }

      // Safety check
      const safety = validateQuerySafety(fixedSql, true);
      if (!safety.safe) {
        throw new Error(`Healed SQL violated safety rules: ${safety.reason}`);
      }

      // Try running the healed SQL against the real database
      const execResult = await executeQuery(connectionType, config, fixedSql);

      return {
        healed: true,
        healedSql: fixedSql,
        originalSql,
        originalError: errorMessage,
        errorCategory,
        attempts: currentAttempt,
        explanation,
        executionResult: execResult,
      };
    } catch (retryErr: any) {
      currentError = retryErr.message;
      // Loop again if retries left
    }
  }

  return {
    healed: false,
    healedSql: currentSql,
    originalSql,
    originalError: errorMessage,
    errorCategory,
    attempts: currentAttempt,
    explanation: `Could not automatically heal after ${currentAttempt} attempts. Last error: ${currentError}`,
  };
}
