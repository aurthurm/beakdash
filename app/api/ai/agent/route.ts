import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runAgenticBIEngine } from '@/lib/ai/agentic-bi';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate limiting: 20 agent executions per minute per user
    const rateLimit = checkRateLimit(`ai-agent:${userId}:${ip}`, 20, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
          },
        }
      );
    }

    const body = await request.json();
    const { goal, connectionId, dashboardId, spaceId, maxLoops = 6, conversationHistory = [] } = body;

    if (!goal || typeof goal !== 'string') {
      return NextResponse.json({ error: 'A clear goal or instruction is required.' }, { status: 400 });
    }

    const result = await runAgenticBIEngine({
      goal,
      userId,
      connectionId: connectionId ? parseInt(String(connectionId), 10) : undefined,
      dashboardId: dashboardId ? parseInt(String(dashboardId), 10) : undefined,
      spaceId: spaceId ? parseInt(String(spaceId), 10) : null,
      maxLoops,
      conversationHistory,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Agentic BI API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute agentic task.' },
      { status: 500 }
    );
  }
}
