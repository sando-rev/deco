/**
 * /api/admin/brand-key
 *
 * GET  — Returns the singleton brand_key row (id = 1).
 * PUT  — Upserts the row with the request body fields.
 *
 * Both endpoints require an authenticated admin session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('brand_key')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? {});
}

export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Whitelist the columns that are allowed to be updated
  const allowed = [
    'markt',
    'situatie',
    'concurrentie',
    'consumer_insight',
    'brand_values',
    'personality',
    'reason_to_believe',
    'discriminator',
    'merkessentie',
  ] as const;

  const payload: Record<string, unknown> = { id: 1 };
  for (const key of allowed) {
    if (key in body) {
      payload[key] = body[key];
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('brand_key')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
