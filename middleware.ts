import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

// // API Keys middleware
// const redis = new Redis(process.env.REDIS_URL);

// export async function apiKeyAuth(
//   req: NextApiRequest,
//   res: NextApiResponse,
//   next: () => void
// ) {
//   const apiKey = req.headers['x-api-key'] || req.query.api_key;

//   if (!apiKey) {
//     return res.status(401).json({ error: 'API key required' });
//   }

//   try {
//     // Validate API key
//     const keyData = await ApiKeyModel.validate(apiKey as string);
//     if (!keyData) {
//       return res.status(401).json({ error: 'Invalid API key' });
//     }

//     // Check expiration
//     if (keyData.expiresAt && keyData.expiresAt < new Date()) {
//       return res.status(401).json({ error: 'API key expired' });
//     }

//     // Check rate limit
//     const rateKey = `rate_limit:${keyData.id}`;
//     const currentRequests = await redis.incr(rateKey);
    
//     if (currentRequests === 1) {
//       await redis.expire(rateKey, keyData.rateLimit.duration);
//     }

//     if (currentRequests > keyData.rateLimit.requests) {
//       return res.status(429).json({ 
//         error: 'Rate limit exceeded',
//         resetIn: await redis.ttl(rateKey)
//       });
//     }

//     // Add API key data to request
//     req.apiKey = keyData;
//     next();
//   } catch (error) {
//     console.error('API key validation error:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// }