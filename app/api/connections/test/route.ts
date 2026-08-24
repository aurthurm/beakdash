import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testConnection } from '@/lib/db/connection-pool';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { type, ...config } = body;

    // Normalize config fields
    const normalizedConfig = {
      ...config,
      host: config.host || config.hostname,
      user: config.user || config.username,
      port: config.port,
      database: config.database,
      password: config.password,
      sslMode: config.sslMode,
      filePath: config.filePath,
      baseUrl: config.baseUrl || config.url,
      apiKey: config.apiKey,
      authType: config.authType,
      headerName: config.headerName,
      file: config.file,
      csvData: config.csvData,
    };

    const result = await testConnection(type || 'postgresql', normalizedConfig);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message || 'Connection successful',
        latencyMs: result.latencyMs,
        dialect: result.dialect,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Connection failed',
        latencyMs: result.latencyMs,
        dialect: result.dialect,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Connection test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred during connection testing',
    }, { status: 500 });
  }
}