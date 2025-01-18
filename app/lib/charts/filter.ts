import { DataPoint, FilterGroup, Filters } from "@/app/types/data";

export function evaluateFilterGroup(item: DataPoint, filterGroup: FilterGroup): boolean {
    if (filterGroup.operator === 'AND') {
        return filterGroup.filters.every(filter => 
            evaluateFilter(
                getFilterValue(item[filter.column], filter),
                getFilterValue(filter.value, filter),
                filter
            )
        );
    } else {
        return filterGroup.filters.some(filter => 
            evaluateFilter(
                getFilterValue(item[filter.column], filter),
                getFilterValue(filter.value, filter),
                filter
            )
        );
    }
}

/**
 * Applies filters to data
 */
export function applyFilters(data: DataPoint[], filters: Filters[]): DataPoint[] {
    if (!filters?.length) return data;

    return data.filter(item => 
        filters.every(filter => {
            if (!filter.enabled) return true;
            
            const itemValue = getFilterValue(item[filter.column], filter);
            const filterValue = getFilterValue(filter.value, filter);

            return evaluateFilter(itemValue, filterValue, filter);
        })
    );
}

function getFilterValue(value: any, filter: Filters): any {
    if (value === null || value === undefined) {
        return filter.nullValue ?? null;
    }

    if (filter.customFormatter) {
        return filter.customFormatter(value);
    }

    if (filter.treatAsNumber) {
        return Number(value);
    }

    if (filter.treatAsDate) {
        return new Date(value);
    }

    if (typeof value === 'string' && !filter.caseSensitive) {
        return value.toLowerCase();
    }

    return value;
}

function evaluateFilter(itemValue: any, filterValue: any, filter: Filters): boolean {
    if (filter.operator === 'isNull') {
        return itemValue === null || itemValue === undefined;
    }

    if (filter.operator === 'isNotNull') {
        return itemValue !== null && itemValue !== undefined;
    }

    // Handle null values
    if (itemValue === null || itemValue === undefined) {
        return false;
    }

    switch (filter.operator) {
        case 'equals':
            return itemValue === filterValue;
            
        case 'notEquals':
            return itemValue !== filterValue;
            
        case 'contains':
            return String(itemValue).includes(String(filterValue));
            
        case 'notContains':
            return !String(itemValue).includes(String(filterValue));
            
        case 'startsWith':
            return String(itemValue).startsWith(String(filterValue));
            
        case 'endsWith':
            return String(itemValue).endsWith(String(filterValue));
            
        case 'gt':
            return itemValue > filterValue;
            
        case 'gte':
            return itemValue >= filterValue;
            
        case 'lt':
            return itemValue < filterValue;
            
        case 'lte':
            return itemValue <= filterValue;
            
        case 'between':
            if (!Array.isArray(filterValue) || filterValue.length !== 2) {
                return false;
            }
            return filter.inclusiveRange ? 
                (itemValue >= filterValue[0] && itemValue <= filterValue[1]) :
                (itemValue > filterValue[0] && itemValue < filterValue[1]);
            
        case 'in':
            return Array.isArray(filterValue) && filterValue.includes(itemValue);
            
        case 'notIn':
            return Array.isArray(filterValue) && !filterValue.includes(itemValue);
            
        case 'regex':
            try {
                const regex = new RegExp(String(filterValue), filter.regexFlags);
                return regex.test(String(itemValue));
            } catch (e) {
                console.error('Invalid regex pattern:', e);
                return false;
            }
            
        default:
            return true;
    }
}