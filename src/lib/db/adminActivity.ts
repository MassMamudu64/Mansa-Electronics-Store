/**
 * Admin activity audit log. Every write performed by an admin should result
 * in one row here so we can answer "who changed what, when, from where."
 *
 * Failures are swallowed (logged to console) to avoid breaking the user
 * action — the audit log going down should never block a legitimate edit.
 */
import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { clientIp } from '@/lib/auth/rateLimit';

export interface LogAdminActivityInput {
  adminSub: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
  req?: Request;
}

export async function logAdminActivity(input: LogAdminActivityInput): Promise<void> {
  try {
    await prisma.adminActivity.create({
      data: {
        adminSub: input.adminSub,
        action: input.action,
        resource: input.resource ?? null,
        resourceId: input.resourceId ?? null,
        metadata: input.metadata ?? Prisma.JsonNull,
        ipAddress: input.req ? clientIp(input.req) : null,
      },
    });
  } catch (err) {
    console.error('[adminActivity] failed to write audit row:', err);
  }
}
