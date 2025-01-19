import React, { useRef, useEffect, useState } from 'react';
import {
  Line,
  Column,
  Bar,
  Pie,
  Area,
  DualAxes,
  Scatter,
} from '@ant-design/charts';
import { IChart } from '@/app/lib/drizzle/schemas';

const ChartComponents = {
  line: Line,
  column: Column,
  bar: Bar,
  pie: Pie,
  area: Area,
  'dual-axes': DualAxes,
  scatter: Scatter,
} as const;

interface ChartWrapperProps {
  type: IChart;
  config: any;
  style?: React.CSSProperties;
  layout?: {
    w: number;
    h: number;
  };
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ type, config, style, layout }) => {
  const ChartComponent = ChartComponents[type];
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      const container = containerRef.current;
      if (!container) return;

      // Get the parent element's dimensions
      const parentElement = container.parentElement;
      if (!parentElement) return;

      // Calculate height based on layout or parent height
      const height = layout?.h 
        ? layout.h * 100 - 40 // Subtract padding/margins
        : parentElement.clientHeight - 40;

      setDimensions({
        width: parentElement.clientWidth - 32, // Subtract horizontal padding
        height: Math.max(height, 200), // Ensure minimum height
      });
    };

    // Initial update
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(updateDimensions);
    });

    // Observe both container and its parent
    resizeObserver.observe(containerRef.current);
    if (containerRef.current.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [layout]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full"
      style={{
        minHeight: '200px',
        ...style,
      }}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ChartComponent
          {...config}
          width={dimensions.width}
          height={dimensions.height}
          autoFit={true}
        />
      )}
    </div>
  );
};

export default ChartWrapper;