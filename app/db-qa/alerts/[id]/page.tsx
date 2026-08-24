import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/app-layout";
import { AlertDetailClient } from "./client-page";

export const metadata: Metadata = {
  title: "DB Quality Alert Details",
  description: "View database quality alert details and history",
};

interface AlertDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AlertDetailPage({ params }: AlertDetailPageProps) {
  const { id } = await params;

  
  return (
    <AppLayout>
      <div className="flex flex-col p-6 max-w-7xl mx-auto w-full">
        <AlertDetailClient id={id} />
      </div>
    </AppLayout>
  );
}