'use client';

import { useRouter } from 'next/navigation';
import { Connection } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useSpaces } from '@/lib/hooks/use-spaces';
import { QueryForm } from '@/components/db-qa/query-form';

interface CreateDbQaQueryClientProps {
  connections: Connection[];
}

export function CreateDbQaQueryClient({ connections }: CreateDbQaQueryClientProps) {
  const router = useRouter();
  const { spaces = [], currentSpaceId } = useSpaces();

  const formattedConnections = connections.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
  }));

  const formattedSpaces = spaces.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        size="sm"
        className="mb-6"
        onClick={() => router.push('/db-qa/queries')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Quality Checks
      </Button>

      <Card>
        <CardContent className="pt-6">
          <QueryForm
            connections={formattedConnections}
            spaces={formattedSpaces}
            mode="create"
            initialData={currentSpaceId ? { spaceId: currentSpaceId } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}