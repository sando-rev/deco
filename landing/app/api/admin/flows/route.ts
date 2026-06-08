/**
 * GET  /api/admin/flows  — list all flows with enrollment stats
 * POST /api/admin/flows  — create a new flow
 *
 * Requires a valid admin session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const { data: flows, error: flowsError } = await supabase
      .from('notification_flows')
      .select('*')
      .order('created_at', { ascending: false });

    if (flowsError) throw flowsError;

    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('notification_flow_enrollments')
      .select('flow_id, completed_at, exit_reason');

    if (enrollmentsError) throw enrollmentsError;

    const statsMap: Record<string, { enrolled: number; completed: number; exited_active: number }> = {};

    for (const row of enrollments ?? []) {
      if (!statsMap[row.flow_id]) {
        statsMap[row.flow_id] = { enrolled: 0, completed: 0, exited_active: 0 };
      }
      if (row.completed_at === null) {
        statsMap[row.flow_id].enrolled += 1;
      }
      if (row.exit_reason === 'completed') {
        statsMap[row.flow_id].completed += 1;
      }
      if (row.exit_reason === 'active') {
        statsMap[row.flow_id].exited_active += 1;
      }
    }

    const result = (flows ?? []).map((flow) => ({
      ...flow,
      stats: statsMap[flow.id] ?? { enrolled: 0, completed: 0, exited_active: 0 },
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/admin/flows]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const {
      name,
      description,
      trigger_type,
      trigger_config,
      target_role,
      exit_on_activity,
      is_active,
    } = body;

    if (!name || !trigger_type) {
      return NextResponse.json({ error: 'name and trigger_type are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('notification_flows')
      .insert({
        name,
        description:      description      ?? '',
        trigger_type,
        trigger_config:   trigger_config   ?? {},
        target_role:      target_role      ?? null,
        exit_on_activity: exit_on_activity ?? false,
        is_active:        is_active        ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/flows]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
