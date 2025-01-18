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
    w: number
    h: number
  }
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ type, config, style, layout }) => {
  const ChartComponent = ChartComponents[type];
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setContainerSize({
          width: offsetWidth,
          height: offsetHeight,
        });
      }
    };

    // Initial size update
    updateSize();

    // Attach resize observer to handle parent size changes
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);
   
  console.log('layout', layout)
  return (
    <div
      ref={containerRef}
      style={{
        ...style,
        height: layout?.h ? `${(layout?.h ?? 1) * 80}px` || '100%' : style?.height, 
        width: style?.width,
      }}
    >
      {React.createElement(ChartComponent, {
        ...config,
        autoFit: true,
        width: containerSize.width || undefined,
        height: containerSize.height || undefined,
      })}
    </div>
  );
};

export default ChartWrapper;
