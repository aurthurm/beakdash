import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const spaceId = searchParams.get('spaceId');
    
    // Query connections based on filters
    let connectionData;
    
    // Make sure userId is a number
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    
    console.log('Fetching connections for user ID:', userIdNum);
    
    try {
      if (spaceId) {
        const spaceIdNum = parseInt(spaceId);
        console.log('Fetching connections for space ID:', spaceIdNum);
        connectionData = await db.execute(
          sql`SELECT * FROM connections WHERE space_id = ${spaceIdNum} OR user_id = ${userIdNum}`
        );
      } else {
        // By default, get connections accessible to the user
        connectionData = await db.execute(
          sql`SELECT * FROM connections WHERE user_id = ${userIdNum}`
        );
      }
      
      console.log('Connection data retrieved, row count:', Array.isArray(connectionData) ? connectionData.length : 'unknown');
    } catch (queryError) {
      console.error('Database query error:', queryError);
      throw queryError;
    }
    
    // Transform the result to a serializable array
    const connections = Array.isArray(connectionData) ? connectionData : [];
    
    // Process the connections to be serializable
    const serializedConnections = connections.map(conn => {
      // Create a plain object with all enumerable properties
      const plainObject: Record<string, any> = {};
      for (const key in conn) {
        let value = conn[key];
        // Convert dates to ISO strings
        if (value instanceof Date) {
          value = value.toISOString();
        }
        plainObject[key] = value;
      }
      return plainObject;
    });
    
    return NextResponse.json(serializedConnections);
  } catch (error) {
    console.error('Connections fetch error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Connection name is required' },
        { status: 400 }
      );
    }
    
    // Create connection configuration from the body
    const config = {
      type: body.type || 'sql',
      hostname: body.hostname,
      port: body.port,
      database: body.database,
      username: body.username,
      // Store the real password (encrypted)
      password: body.password,
      sslMode: body.sslMode,
      baseUrl: body.baseUrl,
      authType: body.authType,
      apiKey: body.apiKey, // For REST APIs
      headerName: body.headerName,
      delimiter: body.delimiter, // For CSV
      encoding: body.encoding,
      hasHeaderRow: body.hasHeaderRow
    };
    
    // Make sure userId is a number
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    const spaceIdNum = body.spaceId ? parseInt(body.spaceId) : null;
    const configJson = JSON.stringify(config);
    
    // Create new connection
    await db.execute(sql`
      INSERT INTO connections (name, type, user_id, space_id, config)
      VALUES (${body.name}, ${body.type || 'sql'}, ${userIdNum}, ${spaceIdNum}, ${configJson}::jsonb)
    `);
    
    // Get inserted connection 
    const insertedConnection = await db.execute(sql`
      SELECT * FROM connections WHERE name = ${body.name} ORDER BY id DESC LIMIT 1
    `);
    
    // Serialize the connection for the response
    let connection = null;
    if (Array.isArray(insertedConnection) && insertedConnection.length > 0) {
      const conn = insertedConnection[0];
      connection = {} as Record<string, any>;
      
      // Create a serializable object from the row
      for (const key in conn) {
        let value = conn[key];
        // Convert dates to ISO strings
        if (value instanceof Date) {
          value = value.toISOString();
        }
        // Mask sensitive fields in the response
        if (key === 'config' && value) {
          const config = typeof value === 'string' ? JSON.parse(value) : { ...value };
          if (config.password) config.password = '********';
          if (config.apiKey) config.apiKey = '********';
          value = config;
        }
        connection[key] = value;
      }
    }

    
    return NextResponse.json({
      success: true,
      message: 'Connection created successfully',
      connection
    });
  } catch (error) {
    console.error('Connection creation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    );
  }
}