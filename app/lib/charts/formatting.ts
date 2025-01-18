import { Formatting } from "@/app/types/data";

/**
 * Applies formatting to values
 */
export function applyFormatting(data: any, formatting: Formatting) {
    if (!formatting?.enabled) return data;

    const formatValue = (value: any) => {
        if (typeof value === 'number') {
            return new Intl.NumberFormat(formatting.numberFormat?.locale, {
                minimumFractionDigits: formatting.numberFormat?.minimumFractionDigits,
                maximumFractionDigits: formatting.numberFormat?.maximumFractionDigits,
                style: formatting.numberFormat?.style,
            }).format(value);
        }
        return value;
    };

    const formatDataPoint = (point: any): any => {
        if (Array.isArray(point)) {
            return point.map(formatDataPoint);
        }
        if (point && typeof point === 'object') {
            const formatted: any = {};
            for (const [key, value] of Object.entries(point)) {
                formatted[key] = formatDataPoint(value);
            }
            return formatted;
        }
        return formatValue(point);
    };

    return formatDataPoint(data);
  }
