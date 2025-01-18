import { Formatting } from "@/app/types/data";

/**
 * Applies formatting to values
 */
export function applyFormatting(data: any, formatting: Formatting) {
    if (!formatting?.enabled) return data;
    // apply formatting
    return data;
}
