import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeChartImprovements } from '@/lib/ai/chart-improver';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { widgetContext, data = [] } = body;

    if (!widgetContext || !widgetContext.type) {
      return NextResponse.json(
        { error: 'widgetContext with type is required' },
        { status: 400 }
      );
    }

    const result = await analyzeChartImprovements(
      widgetContext.type,
      widgetContext.config || {},
      data
    );

    return NextResponse.json({
      success: true,
      widgetId: widgetContext.id,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in AI chart improvement route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
