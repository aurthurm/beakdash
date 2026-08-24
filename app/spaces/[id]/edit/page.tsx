import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { spaces } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Props = {

  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const space = await db.query.spaces.findFirst({
    where: eq(spaces.id, parseInt(id, 10)),
  });

  if (!space) {
    return {
      title: 'Space Not Found',
    };
  }

  return {
    title: `Edit - ${space.name}`,
    description: `Edit space: ${space.name}`,
  };
}

export default async function EditSpacePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return notFound();
  }
  
  const { id } = await params;
  const spaceId = parseInt(id, 10);
  
  // Fetch the space details
  const space = await db.query.spaces.findFirst({
    where: eq(spaces.id, spaceId),
  });
  
  if (!space) {
    notFound();
  }
  
  // Fetch all spaces to check for defaults
  const allSpaces = await db.query.spaces.findMany({
    orderBy: (spaces, { asc }) => [asc(spaces.name)],
  });
  
  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Edit Space</h1>
          <Link
            href={`/spaces/${space.id}`}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-medium"
          >
            Cancel
          </Link>
        </div>
        
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <form className="space-y-6" action={`/api/spaces/${space.id}`} method="POST">
            <input type="hidden" name="_method" value="PUT" />
            
            <div className="space-y-2">
              <label 
                htmlFor="name" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Space Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Enter space name"
                defaultValue={space.name}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label 
                htmlFor="description" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Enter space description (optional)"
                defaultValue={space.description || ''}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  className="rounded border-gray-300 text-primary focus:ring-primary/20"
                  defaultChecked={space.isDefault ?? false}
                />

                <label htmlFor="isDefault" className="text-sm font-medium leading-none">
                  Make this the default space
                </label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                The default space is used when creating new dashboards.
              </p>
            </div>
            
            <div className="flex justify-end space-x-4">
              <Link
                href={`/spaces/${space.id}`}
                className="px-4 py-2 rounded-md text-sm font-medium border hover:bg-muted/50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
              >
                Update Space
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}