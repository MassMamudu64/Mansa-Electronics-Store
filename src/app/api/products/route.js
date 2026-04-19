import { NextResponse } from 'next/server';
import { listProducts, createProduct } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await listProducts();
  return NextResponse.json(products);
}

export async function POST(req) {
  const body = await req.json();
  if (!body.model || body.price === undefined) {
    return NextResponse.json({ error: 'model and price are required' }, { status: 400 });
  }
  const product = await createProduct(body);
  return NextResponse.json(product, { status: 201 });
}
