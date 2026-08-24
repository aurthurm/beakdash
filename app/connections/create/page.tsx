import React from 'react';
import { Metadata } from 'next';
import { AppLayout } from '@/components/layout/app-layout';
import { ConnectionCreateClient } from './client-page';

export const metadata: Metadata = {
  title: 'Create Connection - BeakDash',
  description: 'Create a new data connection',
};

export default async function CreateConnectionPage({ 
  searchParams,
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const defaultTab = (typeof params?.type === 'string' ? params.type : undefined) || 'sql';

  
  return (
    <AppLayout>
      <ConnectionCreateClient defaultTab={defaultTab} />
    </AppLayout>
  );
}