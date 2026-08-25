import React from 'react';
import { Metadata } from 'next';
import { AppLayout } from '@/components/layout/app-layout';
import { db } from '@/lib/db';
import { dashboards } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { DashboardViewClient } from './client-page';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Share2, Layers, Calendar, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const dashboardId = parseInt(id, 10);
  const dashboard = await db.query.dashboards.findFirst({
    where: eq(dashboards.id, dashboardId),
  });

  if (!dashboard) {
    return {
      title: 'Dashboard Not Found',
    };
  }

  return {
    title: `${dashboard.name} - BeakDash`,
    description: dashboard.description || 'Interactive analytics dashboard',
  };
}

export default async function DashboardViewPage({ params }: Props) {
  const { id } = await params;
  const dashboardId = parseInt(id, 10);

  const dashboard = await db.query.dashboards.findFirst({
    where: eq(dashboards.id, dashboardId),
    with: {
      space: true,
    },
  });

  if (!dashboard) {
    notFound();
  }

  return (
    <AppLayout>
      <div className="container max-w-7xl px-4 py-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link href="/dashboard" className="hover:text-foreground flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboards</span>
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-xs">{dashboard.name}</span>
        </div>

        {/* Dashboard Title & Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-6 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">{dashboard.name}</h1>
              {dashboard.isActive && (
                <Badge variant="secondary" className="text-[10px] text-emerald-600 bg-emerald-500/10">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              {dashboard.description || 'Interactive metrics, time-series trends, and operational charts.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5">
              <Link href={`/embed/${dashboardId}`} target="_blank">
                <Share2 className="h-3.5 w-3.5" />
                <span>Embed View</span>
              </Link>
            </Button>

            <Button asChild size="sm" className="h-8 text-xs gap-1.5 shadow-sm">
              <Link href={`/dashboard/${dashboardId}/add-widget`}>
                <Plus className="h-3.5 w-3.5" />
                <span>Add Widget</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Dashboard Widgets Grid */}
        <DashboardViewClient dashboard={dashboard as any} />
      </div>
    </AppLayout>
  );
}