import { Suspense } from "react";
import type { Metadata } from "next";
import { DbQaQueriesClient } from "./client-page";
import { AppLayout } from "@/components/layout/app-layout";

export const metadata: Metadata = {
  title: "Database Quality Checks",
  description: "Manage and monitor the quality of your database with custom quality checks",
};

export default function DbQaQueriesPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-6">Loading quality checks...</div>}>
        <DbQaQueriesClient />
      </Suspense>
    </AppLayout>
  );
}