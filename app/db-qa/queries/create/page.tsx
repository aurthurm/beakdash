import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema";
import { authOptions } from "@/lib/auth";
import { CreateDbQaQueryClient } from "./client-page";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Create Quality Check",
  description: "Create a new database quality check",
};


export default async function CreateDbQaQueryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/auth?callbackUrl=/db-qa/queries/create");
  }
  
  // Fetch available connections for the user
  const userConnections = await db.query.connections.findMany({
    where: (connections, { eq }) => eq(connections.userId, Number(session.user.id)),
  });
  
  // If no connections are available, redirect to connections page
  if (userConnections.length === 0) {
    redirect("/connections?message=You need to create a database connection first");
  }
  
  return (
    <div className="flex flex-col p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Quality Check</h1>
          <p className="text-muted-foreground mt-1">
            Define a new database quality check to monitor data quality
          </p>
        </div>
      </div>
      
      <CreateDbQaQueryClient connections={userConnections} />
    </div>
  );
}