import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSchemaInfo } from "@/lib/db/schema-info";
import { BaseConnectionConfig } from "@/lib/db/connection-pool";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const { id } = await params;
    const connectionId = parseInt(id, 10);

    if (isNaN(connectionId)) {
      return new NextResponse("Invalid connection ID", { status: 400 });
    }

    const connection = await db.query.connections.findFirst({
      where: and(eq(connections.id, connectionId), eq(connections.userId, userId)),
    });

    if (!connection) {
      return new NextResponse("Connection not found", { status: 404 });
    }

    const config = (connection.config as unknown as BaseConnectionConfig) || {};
    const normalizedConfig: BaseConnectionConfig = {
      ...config,
      user: config.user || config.username,
      type: config.type || connection.type,
    };

    const schemaInfo = await getSchemaInfo(normalizedConfig);
    return NextResponse.json(schemaInfo);
  } catch (error) {
    console.error("[SCHEMAS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}