import { IWidget } from "@/app/lib/drizzle/schemas";
import { Filters, FiltersOps } from "@/app/types/data";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select";

const FILTER_OPERATORS: Array<{ value: FiltersOps; label: string }> = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'notContains', label: 'Not Contains' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
    { value: 'gt', label: 'Greater Than' },
    { value: 'gte', label: 'Greater Than or Equal' },
    { value: 'lt', label: 'Less Than' },
    { value: 'lte', label: 'Less Than or Equal' },
    { value: 'between', label: 'Between' },
    { value: 'in', label: 'In List' },
    { value: 'notIn', label: 'Not In List' },
    { value: 'isNull', label: 'Is Null' },
    { value: 'isNotNull', label: 'Is Not Null' },
    { value: 'regex', label: 'Regex Match' }
  ];
  
interface ChartConfigPanelProps {
    form: IWidget;
    columns: {
      all: string[];
      numeric: string[];
      nonNumeric: string[];
    };
    setForm: (update: IWidget) => void;
  }
  
export const FilterRow: React.FC<{
    filter: Filters;
    index: number;
    columns: ChartConfigPanelProps['columns'];
    updateFilter: (index: number, updates: Partial<Filters>) => void;
    removeFilter: (index: number) => void;
  }> = ({ filter, index, columns, updateFilter, removeFilter }) => (
    <div className="flex items-center gap-4">
      <Select
        value={filter.column}
        onValueChange={(value) => updateFilter(index, { column: value })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select column" />
        </SelectTrigger>
        <SelectContent>
          {columns.all.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
  
      <Select
        value={filter.operator}
        onValueChange={(value) => updateFilter(index, { operator: value as FiltersOps })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select operator" />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPERATORS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
  
      <input
        type="text"
        value={filter.value}
        onChange={(e) => updateFilter(index, { value: e.target.value })}
        className="flex-1 p-2 border rounded"
        placeholder="Value"
      />
  
      <button
        onClick={() => removeFilter(index)}
        className="p-2 text-destructive hover:text-destructive/90"
      >
        Remove
      </button>
    </div>
  );