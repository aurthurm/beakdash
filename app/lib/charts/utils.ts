import { cloneDeep } from "lodash";

/**
 * Deeply merges multiple objects, properly handling arrays and nested structures
 */
export function deepMerge(target: any, ...sources: any[]): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (!source) return target;

  if (Array.isArray(source)) {
    return cloneDeep(source);
  }

  if (typeof source !== 'object') return source;

  for (const key in source) {
    if (Array.isArray(source[key])) {
      target[key] = cloneDeep(source[key]);
    } else if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key] || Array.isArray(target[key])) {
        target[key] = {};
      }
      target[key] = deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }

  return deepMerge(target, ...sources);
}
