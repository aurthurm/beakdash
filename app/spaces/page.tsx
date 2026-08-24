import React from 'react';
import { Metadata } from 'next';
import { AppLayout } from '@/components/layout/app-layout';
import { db } from '@/lib/db';
import { spaces } from '@/lib/db/schema';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'BeakDash - Spaces',
  description: 'Manage your spaces',
};


export default async function SpacesPage() {
  // Fetch spaces from the database
  const allSpaces = await db.query.spaces.findMany({
    orderBy: (spaces, { asc }) => [asc(spaces.name)],
  });

  const hasSpaces = allSpaces.length > 0;

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Spaces</h1>
          <Link
            href="/spaces/create"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Space
          </Link>
        </div>

        {/* Spaces grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hasSpaces ? (
            // Show available spaces
            <>
              {allSpaces.map((space) => (
                <div 
                  key={space.id}
                  className="bg-card text-card-foreground rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-medium mb-2">{space.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{space.description || "No description"}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {space.isDefault ? "Default Space" : ""}
                    </span>
                    <div className="flex gap-2">
                      <Link 
                        href={`/spaces/${space.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/spaces/${space.id}/edit`}
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add space card */}
              <Link 
                href="/spaces/create"
                className="bg-card text-card-foreground rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow border-dashed border-muted-foreground/50 flex flex-col items-center justify-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-1">Create New Space</h3>
                <p className="text-muted-foreground text-sm">Organize your dashboards</p>
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
                  <path d="M3 3h7v7H3z" />
                  <path d="M14 3h7v7h-7z" />
                  <path d="M14 14h7v7h-7z" />
                  <path d="M3 14h7v7H3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-1">No spaces yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                Create your first space to organize your dashboards.
              </p>
              <Link
                href="/spaces/create"
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
                Create Space
              </Link>
            </div>
          )}
        </div>
        
        {hasSpaces && (
          <div className="mt-8">
            <h2 className="text-lg font-medium mb-4">Space Management</h2>
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-md font-medium mb-3">Set Default Space</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The default space is used when creating new dashboards if no space is specified.
              </p>
              <form className="space-y-4">
                <div className="space-y-2">
                  <label 
                    htmlFor="defaultSpace" 
                    className="text-sm font-medium leading-none"
                  >
                    Default Space
                  </label>
                  <select
                    id="defaultSpace"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                    defaultValue={allSpaces.find(s => s.isDefault)?.id}
                  >
                    {allSpaces.map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Save Default Space
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}