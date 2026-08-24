import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from '@/lib/db';
import { dashboards } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { AddWidgetClient } from "./client-page";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{

    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: "Add Widget",
    description: "Add a widget to your dashboard",
  };
}


export default async function AddWidgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  const { id } = await params;
  const dashboardId = parseInt(id);
  if (isNaN(dashboardId)) {
    redirect('/dashboard');
  }

  // Verify dashboard exists and belongs to user
  const dashboard = await db.query.dashboards.findFirst({
    where: eq(dashboards.id, dashboardId),
  });

  if (!dashboard) {
    redirect('/dashboard');
  }

  return <AddWidgetClient dashboardId={dashboardId} />;
}