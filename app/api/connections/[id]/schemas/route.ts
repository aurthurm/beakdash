import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSchemaInfo } from "@/lib/db/schema-info";
import { SQLConnectionConfig } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const connectionId = parseInt(id, 10);
    if (isNaN(connectionId)) {
      return new NextResponse("Invalid connection ID", { status: 400 });
    }

    const connection = await db.query.connections.findFirst({
      where: eq(connections.id, connectionId),
    });

    if (!connection) {
      return new NextResponse("Connection not found", { status: 404 });
    }

    const config = connection.config as unknown as any;
    if (connection.type === 'sql' || config?.type) {
      const schemaInfo = await getSchemaInfo({ ...config, user: config?.username } as SQLConnectionConfig);
      return NextResponse.json(schemaInfo);
    }

    return NextResponse.json({});
  } catch (error) {
    console.error("[SCHEMAS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
 