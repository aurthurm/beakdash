// import { Worker } from 'bullmq';
// import fetch from 'node-fetch';
// import { prisma } from '../lib/prisma';

// const worker = new Worker('webhooks', async (job) => {
//   const { url, payload, signature, webhookId } = job.data;

//   try {
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'X-Webhook-Signature': signature,
//       },
//       body: JSON.stringify(payload),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     // Update webhook status
//     await prisma.webhook.update({
//       where: { id: webhookId },
//       data: {
//         lastSuccess: new Date(),
//         failureCount: 0,
//       },
//     });

//   } catch (error) {
//     // Update failure status
//     await prisma.webhook.update({
//       where: { id: webhookId },
//       data: {
//         lastFailure: new Date(),
//         failureCount: {
//           increment: 1,
//         },
//       },
//     });

//     throw error; // Rethrow for retry mechanism
//   }
// });