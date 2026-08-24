import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";

// Define the GET function with explicit typing
export async function GET(request: NextRequest) {
  try {
    // Get the session using NextAuth's getServerSession
    const session = await getServerSession(authOptions);
    
    // If no session, return 401 Unauthorized
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Return the user data from the session
    // This includes id, name, email, and other profile data added via JWT callbacks
    return NextResponse.json({
      id: session.user.id || '',
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      role: session.user.role || 'user',
    });
  } catch (error) {
    console.error('Auth check error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}