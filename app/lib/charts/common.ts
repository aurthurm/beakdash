import { IWidget } from "../drizzle/schemas";

// Common options shared across all chart types 
export const getCommonOptions = () => ({
  height: '100%',
  autoFit: true,
  animation: true,
});

// Base options specific for a given chart type
export const getBaseOptions = (widget: IWidget) => {
    switch (widget.type) {
      case 'line':
        return {};
  
      case 'bar':
        return {};
  
      case 'pie':
        return {};

      default:
        return {};
    }
  };