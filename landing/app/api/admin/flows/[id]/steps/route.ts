/**
 * GET /api/admin/flows/[id]/steps  — list steps for a flow ordered by step_order ASC
 * PUT /api/admin/flows/[id]/steps  — bulk replace all steps for a flow
 *
 * Requires a valid admin session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from('notification_flow_steps')
      .select('*')
      .eq('flow_id', id)
      .order('step_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('[GET /api/admin/flows/[id]/steps]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const { steps } = body as {
      steps: Array<{
        step_order: number;
        delay_hours: number;
        title_nl: string;
        title_en: string;
        body_nl: string;
        body_en: string;
        screen_path?: string | null;
      }>;
    };

    if (!Array.isArray(steps)) {
      return NextResponse.json({ error: 'steps must be an array' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('notification_flow_steps')
      .delete()
      .eq('flow_id', id);

    if (deleteError) throw deleteError;

    if (steps.length === 0) {
      return NextResponse.json([]);
    }

    const rows = steps.map((step) => ({
      flow_id:     id,
      step_order:  step.step_order,
      delay_hours: step.delay_hours,
      title_nl:    step.title_nl,
      title_en:    step.title_en,
      body_nl:     step.body_nl,
      body_en:     step.body_en,
      screen_path: step.screen_path ?? null,
    }));

    const { data, error: insertError } = await supabase
      .from('notification_flow_steps')
      .insert(rows)
      .select()
      .order('step_order', { ascending: true });

    if (insertError) throw insertError;

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('[PUT /api/admin/flows/[id]/steps]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
