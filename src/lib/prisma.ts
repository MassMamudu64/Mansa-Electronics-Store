/**
 * MIGRATION NOTE:
 * Hostinger MySQL implementation preserved below as comments.
 * Supabase PostgreSQL implementation now active.
 *
 * No code change is required — Prisma abstracts the underlying provider, so
 * the singleton works against PostgreSQL once `provider = "postgresql"` is
 * set in schema.prisma and `DATABASE_URL` points at Supabase's pooled
 * connection (port 6543, `pgbouncer=true&connection_limit=1`).
 *
 * Prisma client singleton. Server-only — `import 'server-only'` ensures the
 * Next.js bundler errors out if a client component imports this module,
 * preventing the DB driver (and DATABASE_URL) from leaking into the client
 * bundle.
 *
 * The global cache prevents Next.js dev hot-reload from spawning a new
 * PrismaClient on every file change. Under PgBouncer transaction pooling
 * each new client is cheap, but a leak would still exhaust the pool's
 * upstream connections to Postgres within minutes.
 *
 * DEPRECATED reference (Hostinger MySQL):
 *   The same singleton previously talked to Hostinger MySQL. The pool was
 *   capped server-side by the Remote-MySQL whitelist; an HMR leak would
 *   exhaust it in under a minute. The singleton pattern below also fixed
 *   that case.
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
