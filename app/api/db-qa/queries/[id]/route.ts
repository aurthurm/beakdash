import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db/postgres";
import pg from 'pg';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const queryId = parseInt(id, 10);
    
    if (isNaN(queryId)) {
      return NextResponse.json(
        { error: "Invalid query ID" },
        { status: 400 }
      );
    }
    
    // Get user ID from session
    const userId = parseInt(session.user.id, 10);
    
    // Fetch query with additional info
    const result = await sql`
      SELECT 
        q.*,
        c.name as connection_name,
        c.type as connection_type,
        s.name as space_name
      FROM 
        db_qa_queries q
      LEFT JOIN 
        connections c ON q.connection_id = c.id
      LEFT JOIN 
        spaces s ON q.space_id = s.id
      WHERE 
        q.id = ${queryId}
        AND q.user_id = ${userId}
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: "Query not found" },
        { status: 404 }
      );
    }
    
    // Format the response
    const query = result[0] as Record<string, any>;
    
    // Add formatted connection and space data
    const formattedQuery = {
      ...query,
      connection: query.connection_name ? {
        name: query.connection_name,
        type: query.connection_type
      } : null,
      space: query.space_name ? {
        name: query.space_name
      } : null
    };
    
    return NextResponse.json(formattedQuery);
  } catch (error: any) {
    console.error("Error fetching query:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to fetch query" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const queryId = parseInt(id, 10);
    
    if (isNaN(queryId)) {
      return NextResponse.json(
        { error: "Invalid query ID" },
        { status: 400 }
      );
    }
    
    // Get user ID from session
    const userId = parseInt(session.user.id, 10);
    
    // Check if query exists and belongs to the user
    const queryCheck = await sql`
      SELECT * FROM db_qa_queries
      WHERE id = ${queryId}
      AND user_id = ${userId}
    `;
    
    if (queryCheck.length === 0) {
      return NextResponse.json(
        { error: "Query not found or you don't have permission to edit it" },
        { status: 404 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.category || !body.query || !body.connectionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate query if requested
    if (body.validateQuery) {
      // Get connection details
      const connectionResult = await sql`
        SELECT * FROM connections 
        WHERE id = ${body.connectionId}
        AND user_id = ${userId}
      `;
      
      if (connectionResult.length === 0) {
        return NextResponse.json(
          { error: "Connection not found or not accessible" },
          { status: 404 }
        );
      }
      
      const connection = connectionResult[0] as Record<string, any>;
      const config = (connection.config || {}) as Record<string, any>;
      
      // Create a connection to run the test query if it's a SQL connection
      if (connection.type === 'sql' || connection.type === 'postgresql') {
        try {
          const pool = new pg.Pool({
            host: config.hostname,
            port: parseInt(config.port || '5432', 10),
            database: config.database,
            user: config.username,
            password: config.password,
            ssl: config.sslMode === 'disable' ? false : {
              rejectUnauthorized: config.sslMode === 'verify-full' || config.sslMode === 'verify-ca'
            },
            connectionTimeoutMillis: 10000,
          });
          
          const client = await pool.connect();
          try {
            // Set a timeout to prevent long-running queries
            await client.query('SET statement_timeout TO 5000'); // 5 seconds
            
            // Execute the query to validate it
            await client.query(body.query);
          } finally {
            client.release();
          }
          
          await pool.end();
        } catch (error: any) {
          return NextResponse.json(
            { 
              success: false,
              error: `Query validation failed: ${error.message}` 
            },
            { status: 400 }
          );
        }
      }
    }
    
    // Update the query
    await sql`
      UPDATE db_qa_queries SET
        name = ${body.name},
        description = ${body.description || null},
        category = ${body.category},
        query = ${body.query},
        connection_id = ${body.connectionId},
        space_id = ${body.spaceId || null},
        execution_frequency = ${body.executionFrequency || 'manual'},
        enabled = ${body.enabled === undefined ? true : body.enabled},
        thresholds = ${JSON.stringify(body.thresholds || {})},
        expected_result = ${JSON.stringify(body.expectedResult || {})},
        updated_at = NOW()
      WHERE id = ${queryId}
    `;
    
    return NextResponse.json({
      success: true,
      message: "Query updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating query:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to update query" },
      { status: 500 }
    );
  }
}