export { auth as middleware } from "@/app/auth"
// import { NextApiRequest, NextApiResponse } from 'next';
// import { Redis } from 'ioredis';
// import { ApiKeyModel } from '@/app/models/apiKey.model';

// Or like this if you need to do something here.
// export default auth((req) => {
//   console.log(req.auth) //  { session: { user: { ... } } }
// })

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

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