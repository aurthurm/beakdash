import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, DollarSign, Percent } from 'lucide-react';
import { ChartConfig } from '@/types';

interface CounterWidgetProps {
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

const CounterWidget: React.FC<CounterWidgetProps> = ({ data, config, className = '' }) => {
  if (!data || data.length === 0) {
    return (
      <Card className={`h-full ${className}`}>
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Get the value to display
  const valueField = config.valueField || Object.keys(data[0]).find(key => typeof data[0][key] === 'number') || '';
  const value = valueField ? data[0][valueField] : 0;
  
  // Get configuration options with defaults
  const {
    format = 'number',
    prefix = '',
    suffix = '',
    decimals = 0,
    showIcon = true,
    icon = 'trending-up',
    colorCode = true,
    chartTitle = ''
  } = config;
  
  // Determine color and icon based on value (positive, negative, or neutral)
  let colorClass = '';
  let IconComponent: React.ElementType = TrendingUp;
  
  if (typeof value === 'number') {
    if (value > 0 && colorCode) {
      colorClass = 'text-green-500';
      IconComponent = TrendingUp;
    } else if (value < 0 && colorCode) {
      colorClass = 'text-red-500';
      IconComponent = TrendingDown;
    } else {
      colorClass = 'text-gray-500';
      IconComponent = Minus;
    }
  }
  
  // Custom icon based on config
  if (icon === 'dollar') {
    IconComponent = DollarSign;
  } else if (icon === 'percent') {
    IconComponent = Percent;
  }

  // Get display value
  let displayValue = typeof value === 'number' 
    ? formatValue(value, format, decimals, prefix, suffix)
    : String(value);
    
  return (
    <Card className={`h-full ${className}`}>
      {chartTitle && (
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-md">{chartTitle}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="flex flex-col items-center justify-center h-full p-6 pt-4">
        <div className="flex items-center mb-2">
          {showIcon && (
            <div className={`p-2 rounded-full mr-2 ${colorClass} bg-muted`}>
              <IconComponent className="h-5 w-5" />
            </div>
          )}
          <span className="text-muted-foreground text-sm">{valueField}</span>
        </div>
        <div className={`text-4xl font-bold ${colorCode ? colorClass : ''}`}>
          {displayValue}
        </div>
      </CardContent>
    </Card>
  );
};

export default CounterWidget;