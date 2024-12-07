import { NextRequest } from 'next/server';
import { Client, ClientConfig } from 'pg';

interface DataBaseRequest {
  config: ClientConfig;
  query: string;
}

export async function POST(request: NextRequest) {
  try {
    const { config, query } = await request.json() as DataBaseRequest;

    // Validate connection parameters
    if (!config || !query) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create a new pool for this specific request
    const client = new Client({
      ...config,
      statement_timeout: 5000,
      connectionTimeoutMillis: 5000,
    });
     
    try {
      // Execute query
      await client.connect();
      const result = await client.query(query);
      
      // Important: Close the pool after use
      await client.end();
      
      return Response.json(result.rows);
    } catch (dbError) {
      // Make sure to close the pool even if query fails
      await client.end();
      throw dbError;
    }
  } catch (error) {
    return Response.json(
      { 
        error: 'Failed to execute query', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}