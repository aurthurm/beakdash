import React from 'react';
import { Metadata } from 'next';
import { AppLayout } from '@/components/layout/app-layout';
import { ConnectionEditClient } from './client-page';

export const metadata: Metadata = {
  title: 'Edit Connection - BeakDash',
  description: 'Edit an existing data connection',
};

export default async function EditConnectionPage({ 
  params,
}: { 
  params: Promise<{ id: string }>;
}) {
  const { id: connectionId } = await params;

  
  return (
    <AppLayout>
      <ConnectionEditClient connectionId={connectionId} />
    </AppLayout>
  );
} 