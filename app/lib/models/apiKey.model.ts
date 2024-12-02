import { ApiKeyGenerator } from '@/app/lib/apiKey/apiKey';
import { prisma } from '@/app/lib/prisma/prisma';

export class ApiKeyModel {
  static async create(data: {
    name: string;
    userId: string;
    permissions: string[];
    rateLimit?: { requests: number; duration: number };
    expiresAt?: Date;
  }) {
    const { prefix, key, hashedKey } = ApiKeyGenerator.generate();

    const apiKey = await prisma.apiKey.create({
      data: {
        key: hashedKey,
        name: data.name,
        userId: data.userId,
        permissions: data.permissions,
        rateLimit: data.rateLimit || { requests: 1000, duration: 3600 },
        expiresAt: data.expiresAt,
      },
    });

    // Return the unhashed key only during creation
    return {
      ...apiKey,
      key: key,
    };
  }

  static async validate(key: string) {
    const hashedKey = ApiKeyGenerator.hashKey(key);
    return prisma.apiKey.findUnique({
      where: { key: hashedKey },
    });
  }

  static async delete(id: string) {
    return prisma.apiKey.delete({
      where: { id },
    });
  }
}