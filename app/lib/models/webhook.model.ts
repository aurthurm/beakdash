// import { prisma } from '@/app/lib/prisma/prisma';
// import { Webhook, WebhookEvent } from '@/app/types/webhook';
// import crypto from 'crypto';

// export class WebhookModel {
//   static async create(data: {
//     userId: string;
//     url: string;
//     events: WebhookEvent[];
//   }) {
//     const secret = crypto.randomBytes(32).toString('hex');

//     return prisma.webhook.create({
//       data: {
//         ...data,
//         secret,
//         isEnabled: true,
//         failureCount: 0,
//       },
//     });
//   }

//   static async getByUserId(userId: string) {
//     return prisma.webhook.findMany({
//       where: { userId },
//     });
//   }

//   static async update(id: string, data: Partial<Webhook>) {
//     return prisma.webhook.update({
//       where: { id },
//       data,
//     });
//   }

//   static async delete(id: string) {
//     return prisma.webhook.delete({
//       where: { id },
//     });
//   }
// }