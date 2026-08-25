export interface DeltaMetricResult {
  currentValue: number;
  previousValue?: number;
  delta: number;
  percentChange: number; // e.g. +14.2%
  direction: 'up' | 'down' | 'flat';
  isPositive: boolean; // whether the direction is good (e.g. revenue up = good, churn up = bad)
  formattedCurrent: string;
  formattedDelta: string;
  formattedPercent: string;
  sparkline: number[];
}

export interface DeltaCalculationOptions {
  inverted?: boolean; // if true, decreases are considered positive (e.g. churn, latency, errors)
  format?: {
    type?: 'currency' | 'percent' | 'compact' | 'number';
    currencySymbol?: string;
    decimals?: number;
  };
}

/**
 * Computes Evidence-style period-over-period KPI deltas and sparklines
 */
export function calculateKpiDelta(
  history: number[],
  options: DeltaCalculationOptions = {}
): DeltaMetricResult {
  if (!history || history.length === 0) {
    return {
      currentValue: 0,
      delta: 0,
      percentChange: 0,
      direction: 'flat',
      isPositive: true,
      formattedCurrent: '0',
      formattedDelta: '0',
      formattedPercent: '0%',
      sparkline: [],
    };
  }

  const current = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : undefined;

  const delta = previous !== undefined ? current - previous : 0;
  const percentChange = previous && previous !== 0 ? (delta / Math.abs(previous)) * 100 : 0;

  let direction: 'up' | 'down' | 'flat' = 'flat';
  if (delta > 0.0001) direction = 'up';
  else if (delta < -0.0001) direction = 'down';

  const isPositive = options.inverted ? direction === 'down' : direction === 'up';

  const decimals = options.format?.decimals !== undefined ? options.format.decimals : 1;
  const symbol = options.format?.currencySymbol || '$';

  const formattedDelta = delta >= 0 ? `+${delta.toFixed(decimals)}` : delta.toFixed(decimals);
  const formattedPercent = percentChange >= 0 ? `+${percentChange.toFixed(decimals)}%` : `${percentChange.toFixed(decimals)}%`;

  let formattedCurrent = String(current);
  if (options.format?.type === 'currency') {
    formattedCurrent = `${symbol}${current.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  } else if (options.format?.type === 'percent') {
    formattedCurrent = `${current.toFixed(decimals)}%`;
  } else if (options.format?.type === 'compact') {
    const abs = Math.abs(current);
    if (abs >= 1e6) formattedCurrent = `${(current / 1e6).toFixed(1)}M`;
    else if (abs >= 1e3) formattedCurrent = `${(current / 1e3).toFixed(1)}K`;
    else formattedCurrent = current.toLocaleString();
  } else {
    formattedCurrent = current.toLocaleString();
  }

  return {
    currentValue: current,
    previousValue: previous,
    delta,
    percentChange,
    direction,
    isPositive,
    formattedCurrent,
    formattedDelta,
    formattedPercent,
    sparkline: history,
  };
}
