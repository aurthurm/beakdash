import { DataPoint, SortingOrder } from "@/app/types/data";

/**
 * Applies sorting to data
 */
export function sort(
    data: DataPoint[],
    key: keyof DataPoint | 'none',
    order: SortingOrder
  ): DataPoint[] {
    if (order === 'none' || key === 'none') return data;

    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      // Handle undefined or null values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return order === 'asc' ? -1 : 1;
      if (bVal == null) return order === 'asc' ? 1 : -1;

      // Handle strings (case-insensitive sorting)
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
        return order === 'asc' ? comparison : -comparison;
      }

      // Handle numbers and other comparable types
      return order === 'asc'
        ? aVal > bVal
          ? 1
          : -1
        : aVal < bVal
        ? 1
        : -1;
    });
  }