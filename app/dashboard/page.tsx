import React from 'react';
import { Metadata } from 'next';
import { AppLayout } from '@/components/layout/app-layout';
import { db } from '@/lib/db';
import { dashboards, spaces, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { Header } from '@/components/layout/header';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'BeakDash - Dashboards',
  description: 'View and manage your dashboards',
};


// This is a server component that can fetch data
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {

  // Get the current space ID from the search parameters
  let currentSpaceId = null;
  
  // In Next.js 15, we need to await searchParams before accessing its properties
  const params = await searchParams;
  const spaceIdStr = typeof params?.spaceId === 'string' ? params.spaceId : null;
  if (spaceIdStr) {
    const spaceIdParam = parseInt(spaceIdStr, 10);

    if (!isNaN(spaceIdParam)) {
      currentSpaceId = spaceIdParam;
    }
  }
  
  // Build the query based on the current space selection
  let dashboardsQuery = db.query.dashboards;
  
  // If a specific space is selected, filter dashboards by space
  const allDashboards = currentSpaceId 
    ? await dashboardsQuery.findMany({
        where: eq(dashboards.spaceId, currentSpaceId),
        with: { space: true },
        limit: 6
      })
    : await dashboardsQuery.findMany({
        with: { space: true },
        limit: 6
      });

  const hasDashboards = allDashboards.length > 0;

  return (
    <AppLayout>
      <div className="mb-6">

        <Header title="Dashboards" description="">
          <Link
            href="/dashboard/create"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Dashboard
          </Link>
        </Header>

        {/* Dashboard grid */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hasDashboards ? (
            // Show available dashboards
            <>
              {allDashboards.map((dashboard) => (
                <div 
                  key={dashboard.id}
                  className="bg-card text-card-foreground rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-medium mb-2">{dashboard.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{dashboard.description || "No description"}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{dashboard.space?.name || "Unknown Space"}</span>
                    <Link 
                      href={`/dashboard/${dashboard.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
              
              {/* Add dashboard card */}
              <Link 
                href="/dashboard/create"
                className="bg-card text-card-foreground rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow border-dashed border-muted-foreground/50 flex flex-col items-center justify-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-1">Create New Dashboard</h3>
                <p className="text-muted-foreground text-sm">Start building a custom analytics view</p>
              </Link>
            </>
          ) : (
            // Empty state
            <div className="col-span-full flex flex-col items-center justify-center border border-dashed rounded-lg p-8 bg-muted/50">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <path d="M5 3a2 2 0 0 0-2 2" />
                  <path d="M19 3a2 2 0 0 1 2 2" />
                  <path d="M21 19a2 2 0 0 1-2 2" />
                  <path d="M5 21a2 2 0 0 1-2-2" />
                  <path d="M9 3h1" />
                  <path d="M9 21h1" />
                  <path d="M14 3h1" />
                  <path d="M14 21h1" />
                  <path d="M3 9v1" />
                  <path d="M21 9v1" />
                  <path d="M3 14v1" />
                  <path d="M21 14v1" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-1">No dashboards yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                Create your first dashboard to start visualizing your data.
              </p>
              <Link
                href="/dashboard/create"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium inline-flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                Create Dashboard
              </Link>
            </div>
          )}
        </div>
        
        {hasDashboards && (
          <div className="p-4">
            <h2 className="text-xl font-bold mt-10 mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link 
                href="/datasets"
                className="bg-card text-card-foreground rounded-lg shadow-sm border p-4 hover:bg-muted/25 transition-colors"
              >
                <h3 className="text-md font-medium mb-1">Datasets</h3>
                <p className="text-muted-foreground text-xs">Manage your data</p>
              </Link>
              
              <Link 
                href="/connections"
                className="bg-card text-card-foreground rounded-lg shadow-sm border p-4 hover:bg-muted/25 transition-colors"
              >
                <h3 className="text-md font-medium mb-1">Connections</h3>
                <p className="text-muted-foreground text-xs">Configure data sources</p>
              </Link>
              
              <Link 
                href="/widgets"
                className="bg-card text-card-foreground rounded-lg shadow-sm border p-4 hover:bg-muted/25 transition-colors"
              >
                <h3 className="text-md font-medium mb-1">Widgets</h3>
                <p className="text-muted-foreground text-xs">Customize your views</p>
              </Link>
              
              <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-4 hover:bg-muted/25 transition-colors">
                <h3 className="text-md font-medium mb-1">Spaces</h3>
                <p className="text-muted-foreground text-xs">Organize your work</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}