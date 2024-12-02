import { NextRequest } from 'next/server';
import { Pool } from 'pg';

interface DataBaseRequest {
  connectionString: string;
  query: string;
}



export async function POST(request: NextRequest) {
  try {
    const { connectionString, query } = await request.json() as DataBaseRequest;

    // Validate connection parameters
    if (!connectionString || !query) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create a new pool for this specific request
    const pool = new Pool({ connectionString });
     
    try {
      // Execute query
      const result = await pool.query(query);
      
      // Important: Close the pool after use
      await pool.end();
      
      return Response.json(result.rows);
    } catch (dbError) {
      // Make sure to close the pool even if query fails
      await pool.end();
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