import { db } from '@/lib/db';
import { dashboards, dashboardWidgets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyEmbedToken } from '@/lib/embed/token';
import { EmbedDashboardClient } from './embed-client';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

interface EmbedPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; theme?: string; showHeader?: string }>;
}

export default async function EmbedDashboardPage({ params, searchParams }: EmbedPageProps) {
  const { id } = await params;
  const { token, theme: urlTheme, showHeader: urlShowHeader } = await searchParams;
  const headerList = await headers();
  const origin = headerList.get('origin') || headerList.get('referer');

  const dashboardId = parseInt(id, 10);

  if (isNaN(dashboardId)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground p-4">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">Invalid Dashboard ID</h2>
          <p className="text-sm text-muted-foreground">The requested dashboard identifier is not valid.</p>
        </div>
      </div>
    );
  }

  // Verify embed token
  if (!token) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground p-4">
        <div className="text-center space-y-2 max-w-md p-6 rounded-xl border bg-card shadow-sm">
          <div className="text-3xl">🔒</div>
          <h2 className="text-base font-semibold">Authentication Required</h2>
          <p className="text-xs text-muted-foreground">A valid signed embed token is required to view this dashboard.</p>
        </div>
      </div>
    );
  }

  const tokenVerification = verifyEmbedToken(token, origin);

  if (!tokenVerification.valid || !tokenVerification.payload) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground p-4">
        <div className="text-center space-y-2 max-w-md p-6 rounded-xl border border-destructive/30 bg-destructive/5 shadow-sm">
          <div className="text-3xl">⚠️</div>
          <h2 className="text-base font-semibold text-destructive">Embed Access Denied</h2>
          <p className="text-xs text-muted-foreground">{tokenVerification.error || 'Invalid or expired embed token.'}</p>
        </div>
      </div>
    );
  }

  const payload = tokenVerification.payload;

  // Fetch dashboard
  const dashboard = await db.query.dashboards.findFirst({
    where: eq(dashboards.id, dashboardId),
  });

  if (!dashboard) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground p-4">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">Dashboard Not Found</h2>
          <p className="text-sm text-muted-foreground">The requested dashboard no longer exists.</p>
        </div>
      </div>
    );
  }

  // Fetch widgets linked to this dashboard via dashboardWidgets join table
  const links = await db.query.dashboardWidgets.findMany({
    where: eq(dashboardWidgets.dashboardId, dashboardId),
    with: {
      widget: true,
    },
  });

  const widgetList = links.map((l) => (l as any).widget).filter(Boolean);

  const effectiveTheme = urlTheme || payload.theme || 'system';
  const showHeader = urlShowHeader !== undefined ? urlShowHeader === 'true' : payload.showHeader !== false;

  return (
    <EmbedDashboardClient
      dashboard={dashboard}
      widgets={widgetList}
      theme={effectiveTheme as 'light' | 'dark' | 'system'}
      showHeader={showHeader}
      refreshInterval={payload.refreshInterval}
      customStyles={payload.customStyles}
    />
  );
}
