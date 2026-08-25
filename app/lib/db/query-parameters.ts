export type ParameterType = 'text' | 'number' | 'date' | 'boolean' | 'enum' | 'date_range';

export interface QueryParameterDef {
  name: string;
  type: ParameterType;
  defaultValue?: any;
  options?: string[]; // for enum/dropdown
  title?: string;
}

export interface ParameterSubstitutionResult {
  sql: string;
  appliedParameters: Record<string, any>;
  errors?: string[];
}

/**
 * Extracts {{ param_name }} or {{ param_name:type }} or {{ param_name:type:default }} from SQL
 */
export function extractQueryParameters(sql: string): QueryParameterDef[] {
  if (!sql) return [];

  const paramRegex = /\{\{\s*([a-zA-Z0-9_]+)(?::([a-zA-Z0-9_]+))?(?::([^}]+))?\s*\}\}/g;
  const paramMap = new Map<string, QueryParameterDef>();
  let match: RegExpExecArray | null;

  while ((match = paramRegex.exec(sql)) !== null) {
    const rawName = match[1].trim();
    const rawType = (match[2] || 'text').toLowerCase() as ParameterType;
    const rawDefault = match[3]?.trim();

    const validTypes: ParameterType[] = ['text', 'number', 'date', 'boolean', 'enum', 'date_range'];
    const type: ParameterType = validTypes.includes(rawType) ? rawType : 'text';

    let defaultValue: any = rawDefault;
    if (type === 'number' && rawDefault !== undefined) {
      defaultValue = Number(rawDefault);
    } else if (type === 'boolean' && rawDefault !== undefined) {
      defaultValue = rawDefault === 'true' || rawDefault === '1';
    }

    if (!paramMap.has(rawName)) {
      paramMap.set(rawName, {
        name: rawName,
        type,
        defaultValue,
        title: rawName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      });
    }
  }

  return Array.from(paramMap.values());
}

/**
 * Safely escape a SQL string literal across dialects
 */
function escapeSqlString(val: string): string {
  // Prevent escaping attacks by doubling single quotes
  return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Substitutes parameters into SQL with strict type-checking and sanitization
 */
export function substituteQueryParameters(
  sql: string,
  parameters: Record<string, any> = {},
  dialect: string = 'postgresql'
): ParameterSubstitutionResult {
  const definitions = extractQueryParameters(sql);
  const applied: Record<string, any> = {};
  const errors: string[] = [];

  let substitutedSql = sql;

  for (const def of definitions) {
    const provided = parameters[def.name];
    const val = provided !== undefined && provided !== null && provided !== '' ? provided : def.defaultValue;

    if (val === undefined || val === null) {
      errors.push(`Missing required parameter: "${def.name}"`);
      continue;
    }

    applied[def.name] = val;

    let sanitizedReplacement = '';

    switch (def.type) {
      case 'number': {
        const num = Number(val);
        if (isNaN(num)) {
          errors.push(`Parameter "${def.name}" must be a valid number`);
          sanitizedReplacement = '0';
        } else {
          sanitizedReplacement = String(num);
        }
        break;
      }
      case 'boolean': {
        const bool = val === true || val === 'true' || val === 1 || val === '1';
        sanitizedReplacement = dialect === 'sqlite' ? (bool ? '1' : '0') : bool ? 'TRUE' : 'FALSE';
        break;
      }
      case 'date': {
        const dateStr = String(val).trim();
        // Strict ISO / standard date validation YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(dateStr)) {
          errors.push(`Parameter "${def.name}" has invalid date format: ${dateStr}`);
        }
        sanitizedReplacement = escapeSqlString(dateStr);
        break;
      }
      case 'text':
      case 'enum':
      default: {
        sanitizedReplacement = escapeSqlString(String(val));
        break;
      }
    }

    // Match all variants of {{ name }}, {{ name:type }}, etc.
    const replacePattern = new RegExp(`\\{\\{\\s*${def.name}(?::[a-zA-Z0-9_]+)?(?::[^}]+)?\\s*\\}\\}`, 'g');
    substitutedSql = substitutedSql.replace(replacePattern, sanitizedReplacement);
  }

  return {
    sql: substitutedSql,
    appliedParameters: applied,
    errors: errors.length > 0 ? errors : undefined,
  };
}
