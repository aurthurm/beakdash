import { Client } from 'pg';

export async function POST(request: Request) {
    const payload = await request.json();
    return Response.json(await testConnection(payload));
}

async function testConnection(config: {
    driver: string;
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
}) {
    switch (config.driver) {
        case 'postgresql':
            return await testPgCon(config);
        default:
            return { success: false, message: 'Invalid driver' };
    }
}

//postgres test
async function testPgCon(config: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}) {
  const client = new Client({
    ...config,
    statement_timeout: 5000,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : String(error)
    };
  } finally {
    await client.end();
  }
}
