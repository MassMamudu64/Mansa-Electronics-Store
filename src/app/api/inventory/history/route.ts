import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'inventory_changes.json');

export async function GET() {
  try {
    const raw = await fs.readFile(HISTORY_FILE, 'utf-8');
    const changes = JSON.parse(raw);
    // Most recent first
    changes.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ changes });
  } catch {
    return NextResponse.json({ changes: [] });
  }
}
