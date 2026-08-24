import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, DollarSign, Percent } from 'lucide-react';
import { ChartConfig } from '@/types';

interface StatCardWidgetProps {
  data: Record<string, any>[];
  config: ChartConfig;
  className?: string;
}

const formatValue = (value: number, format: string = 'number', decimals: number = 0, prefix: string = '', suffix: string = '') => {
  let formattedValue = '';
  
  switch (format) {
    case 'currency':
      formattedValue = value.toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      break;
    case 'percentage':
      formattedValue = `${value.toFixed(decimals)}%`;
      break;
    default:
      formattedValue = value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
  }
  
  // If custom prefix/suffix is provided, apply it after the built-in formatting
  if (format !== 'currency' && prefix) {
    formattedValue = `${prefix}${formattedValue}`;
  }
  
  if (format !== 'percentage' && suffix) {
    formattedValue = `${formattedValue}${suffix}`;
  }
  
  return formattedValue;
};

// Calculate the percentage change between two values
const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

const StatCardWidget: React.FC<StatCardWidgetProps> = ({ data, config, className = '' }) => {
  if (!data || data.length === 0) {
    return (
      <Card className={`h-full ${className}`}>
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Get the primary value field to display
  const primaryValueField = config.primaryValueField || 
    Object.keys(data[0]).find(key => typeof data[0][key] === 'number') || '';
  
  // Get the secondary value field for comparison
  const secondaryValueField = config.secondaryValueField || '';
  
  // Get the compare field for trend (e.g., date, category)
  const compareField = config.compareField || '';
  
  // Get configuration options with defaults
  const {
    format = 'number',
    prefix = '',
    suffix = '',
    decimals = 0,
    showIcon = true,
    showChange = true,
    colorCodeChange = true,
    chartTitle = ''
  } = config;
  
  // Get primary value (current)
  const primaryValue = primaryValueField ? data[0][primaryValueField] : 0;
  
  // Get secondary value or calculate trend from historical data
  let secondaryValue = 0;
  let percentChange = 0;
  
  if (secondaryValueField && data[0][secondaryValueField] !== undefined) {
    // Direct secondary value from a field
    secondaryValue = data[0][secondaryValueField];
  } else if (compareField && data.length > 1) {
    // Compare with a previous period based on compare field
    const sortedData = [...data].sort((a, b) => {
      if (a[compareField] < b[compareField]) return 1;
      if (a[compareField] > b[compareField]) return -1;
      return 0;
    });
    
    if (sortedData.length > 1 && primaryValueField) {
      const currentValue = sortedData[0][primaryValueField];
      const previousValue = sortedData[1][primaryValueField];
      
      secondaryValue = previousValue;
      percentChange = calculateChange(currentValue, previousValue);
    }
  }

  // Determine color and icon based on change (positive, negative, or neutral)
  let changeColorClass = '';
  let IconComponent: React.ElementType = Minus;
  
  if (percentChange > 0) {
    changeColorClass = 'text-green-500';
    IconComponent = TrendingUp;
  } else if (percentChange < 0) {
    changeColorClass = 'text-red-500';
    IconComponent = TrendingDown;
  } else {
    changeColorClass = 'text-gray-500';
    IconComponent = Minus;
  }
  
  // Format display values
  const primaryDisplayValue = typeof primaryValue === 'number' 
    ? formatValue(primaryValue, format, decimals, prefix, suffix)
    : String(primaryValue);
  
  const secondaryDisplayValue = typeof secondaryValue === 'number' && secondaryValueField
    ? formatValue(secondaryValue, format, decimals, prefix, suffix)
    : '';
  
  const formattedChangeValue = Math.abs(percentChange).toFixed(1) + '%';
  
  return (
    <Card className={`h-full ${className}`}>
      {chartTitle && (
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-md">{chartTitle}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="flex flex-col h-full p-6 pt-4">
        <div className="flex items-center mb-1">
          {showIcon && (
            <div className={`p-2 rounded-full mr-2 ${changeColorClass} bg-muted`}>
              <IconComponent className="h-5 w-5" />
            </div>
          )}
          <span className="text-muted-foreground text-sm capitalize">{primaryValueField.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
        </div>
        
        <div className="text-3xl font-bold">
          {primaryDisplayValue}
        </div>
        
        {showChange && percentChange !== 0 && (
          <div className="flex items-center mt-2">
            {percentChange > 0 ? (
              <ArrowUp className={`h-4 w-4 mr-1 ${colorCodeChange ? 'text-green-500' : ''}`} />
            ) : (
              <ArrowDown className={`h-4 w-4 mr-1 ${colorCodeChange ? 'text-red-500' : ''}`} />
            )}
            <span className={`text-sm ${colorCodeChange ? (percentChange > 0 ? 'text-green-500' : 'text-red-500') : ''}`}>
              {formattedChangeValue} {percentChange > 0 ? 'increase' : 'decrease'}
            </span>
          </div>
        )}
        
        {secondaryValueField && (
          <div className="mt-2">
            <span className="text-sm text-muted-foreground capitalize">
              {secondaryValueField.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:
            </span>
            <span className="text-sm ml-2">
              {secondaryDisplayValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCardWidget;