import type { Metadata } from "next";
import { EditQueryClient } from "./client-page";
import { AppLayout } from "@/components/layout/app-layout";

export const metadata: Metadata = {
  title: "Edit Database Quality Check",
  description: "Edit an existing database quality check",
};

interface EditQueryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditQueryPage({ params }: EditQueryPageProps) {
  const { id } = await params;

  
  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit Quality Check</h1>
          <p className="text-muted-foreground mt-1">
            Modify your database quality check settings and query
          </p>
        </div>
        
        <EditQueryClient id={id} />
      </div>
    </AppLayout>
  );
}