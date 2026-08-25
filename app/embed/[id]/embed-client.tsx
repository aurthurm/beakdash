'use client';

import { useEffect, useRef } from 'react';
import { Dashboard, Widget } from '@/lib/db/schema';
import { WidgetVisual } from '@/components/widgets/widget-visual';

interface EmbedDashboardClientProps {
  dashboard: Dashboard;
  widgets: Widget[];
  theme?: 'light' | 'dark' | 'system';
  showHeader?: boolean;
  refreshInterval?: number;
  customStyles?: Record<string, string>;
}

export function EmbedDashboardClient({
  dashboard,
  widgets,
  theme = 'system',
  showHeader = true,
  refreshInterval,
  customStyles,
}: EmbedDashboardClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Apply theme class to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme detection
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  // Emit postMessage resize events to parent window
  useEffect(() => {
    const emitHeight = () => {
      if (containerRef.current && window.parent && window.parent !== window) {
        const height = containerRef.current.scrollHeight;
        window.parent.postMessage(
          {
            type: 'beakdash:resize',
            dashboardId: dashboard.id,
            height,
          },
          '*'
        );
      }
    };

    emitHeight();

    // Resize observer for dynamic content updates
    const observer = new ResizeObserver(emitHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', emitHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', emitHeight);
    };
  }, [dashboard.id]);

  // Optional auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      window.location.reload();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full bg-background text-foreground p-4 md:p-6 transition-colors duration-200"
      style={customStyles}
    >
      {showHeader && (
        <header className="mb-6 pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{dashboard.name}</h1>
            {dashboard.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{dashboard.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Data</span>
          </div>
        </header>
      )}

      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border">
          <p className="text-sm font-medium text-muted-foreground">No widgets on this dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow overflow-hidden min-h-[22rem] flex flex-col"
            >
              <WidgetVisual widget={widget} dimensions={{ width: 400, height: 300 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
