import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/app-layout";
import { EditAlertClient } from "./client-page";

export const metadata: Metadata = {
  title: "Edit DB Quality Alert",
  description: "Edit and update database quality alert settings",
};

interface EditAlertPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAlertPage({ params }: EditAlertPageProps) {
  const { id } = await params;

  
  return (
    <AppLayout>
      <div className="flex flex-col p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Alert</h1>
            <p className="text-muted-foreground mt-1">
              Modify settings for this database quality alert
            </p>
          </div>
        </div>
        
        <EditAlertClient id={id} />
      </div>
    </AppLayout>
  );
}