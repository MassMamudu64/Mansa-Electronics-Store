/**
 * Prisma client singleton. Server-only — `import 'server-only'` ensures the
 * Next.js bundler errors out if a client component imports this module,
 * preventing the DB driver (and DATABASE_URL) from leaking into the client
 * bundle.
 *
 * The global cache prevents Next.js dev hot-reload from spawning a new
 * PrismaClient on every file change, which would exhaust the MySQL
 * connection pool within minutes.
 */
import 'server-only';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
