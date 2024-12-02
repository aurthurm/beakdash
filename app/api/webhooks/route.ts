// app/api/webhooks/route.ts
import { NextRequest } from 'next/server';
import { WebhookModel } from '@/app/lib/models/webhook.model';

export async function POST(request: NextRequest) {
 try {
   const { url, events } = await request.json();
   const userId = request.user.id; // From auth middleware

   const webhook = await WebhookModel.create({
     userId,
     url, 
     events,
   });

   return Response.json(webhook, { status: 201 });
 } catch (error) {
   return Response.json(
     { error: 'Failed to create webhook' },
     { status: 500 }
   );
 }
}

export async function GET(request: NextRequest) {
 try {
   const userId = request.user.id;
   const webhooks = await WebhookModel.getByUserId(userId);
   
   return Response.json(webhooks);
 } catch (error) {
   return Response.json(
     { error: 'Failed to fetch webhooks' },
     { status: 500 }
   );
 }
}