import React from 'react';
import { Metadata } from 'next';
import { AppLayout } from '@/components/layout/app-layout';
import { db } from '@/lib/db';
import { dashboards, dashboardWidgets } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Layers, ExternalLink, Calendar, Database, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'BeakDash - Dashboards',
  description: 'View and manage your dashboards',
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const spaceIdStr = typeof params?.spaceId === 'string' ? params.spaceId : null;
  const currentSpaceId = spaceIdStr ? parseInt(spaceIdStr, 10) : null;

  const allDashboards = currentSpaceId && !isNaN(currentSpaceId)
    ? await db.query.dashboards.findMany({
        where: eq(dashboards.spaceId, currentSpaceId),
        with: { space: true },
        orderBy: [desc(dashboards.createdAt)],
      })
    : await db.query.dashboards.findMany({
        with: { space: true },
        orderBy: [desc(dashboards.createdAt)],
      });

  return (
    <AppLayout>
      <div className="container max-w-6xl px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboards</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Interactive analytics workspaces, charts, and executive reporting views
            </p>
          </div>
          <Button asChild size="sm" className="gap-1.5 shadow-sm">
            <Link href="/dashboard/create">
              <Plus className="h-4 w-4" />
              <span>Create Dashboard</span>
            </Link>
          </Button>
        </div>

        {allDashboards.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-xl bg-card">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">No dashboards yet</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
              Create your first dashboard to start visualizing your data with interactive charts.
            </p>
            <Button asChild size="sm">
              <Link href="/dashboard/create">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create Dashboard
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allDashboards.map((dashboard) => (
              <Card key={dashboard.id} className="hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden border-border/80">
                <CardHeader className="pb-3 bg-muted/20 border-b">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold leading-tight">{dashboard.name}</CardTitle>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">
                          {dashboard.space?.name || 'Default Space'}
                        </span>
                      </div>
                    </div>
                    {dashboard.isActive && (
                      <Badge variant="secondary" className="text-[10px] text-emerald-600 bg-emerald-500/10">
                        Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="py-3 flex-1 text-xs">
                  <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                    {dashboard.description || 'Custom interactive analytics dashboard.'}
                  </p>
                </CardContent>

                <CardFooter className="pt-2 pb-3 border-t bg-muted/10 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    ID: #{dashboard.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" asChild className="h-7 text-xs gap-1">
                      <Link href={`/dashboard/${dashboard.id}`}>
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}

            <Link
              href="/dashboard/create"
              className="rounded-xl border border-dashed border-border/80 bg-card/50 hover:bg-card p-6 flex flex-col items-center justify-center text-center hover:border-primary transition-all min-h-[12rem] group"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">Create New Dashboard</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Add a new analytics workspace</p>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}