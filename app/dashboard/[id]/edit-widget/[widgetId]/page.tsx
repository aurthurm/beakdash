import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { widgets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { EditWidgetClient } from "./client-page";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{

    id: string;
    widgetId: string;
  }>;
}


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, widgetId } = await params;
  const widgetIdNum = parseInt(widgetId);
  
  const widget = await db.query.widgets.findFirst({
    where: eq(widgets.id, widgetIdNum),
  });

  return {
    title: widget ? `Edit Widget - ${widget.name}` : "Edit Widget",
    description: "Edit a dashboard widget",
  };
}

export default async function EditWidgetPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth");
  }

  const { id, widgetId } = await params;
  const dashboardId = parseInt(id);
  const widgetIdNum = parseInt(widgetId);

  if (isNaN(dashboardId) || isNaN(widgetIdNum)) {
    redirect(`/dashboard/${id}`);
  }

  // Fetch the widget to edit
  const widget = await db.query.widgets.findFirst({
    where: eq(widgets.id, widgetIdNum),
    with: {
      dataset: true,
      connection: true,
    },
  });

  if (!widget) {
    redirect(`/dashboard/${id}`);
  }

  return <EditWidgetClient dashboardId={dashboardId} widget={widget} />;
}