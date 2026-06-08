/**
 * GET    /api/admin/flows/[id]  — get a single flow with its steps and enrollment stats
 * PUT    /api/admin/flows/[id]  — update a flow by id
 * DELETE /api/admin/flows/[id]  — delete a flow by id (cascades steps + enrollments)
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
    const { data: flow, error: flowError } = await supabase
      .from('notification_flows')
      .select('*')
      .eq('id', id)
      .single();

    if (flowError || !flow) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: steps, error: stepsError } = await supabase
      .from('notification_flow_steps')
      .select('*')
      .eq('flow_id', id)
      .order('step_order', { ascending: true });

    if (stepsError) throw stepsError;

    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('notification_flow_enrollments')
      .select('completed_at, exit_reason')
      .eq('flow_id', id);

    if (enrollmentsError) throw enrollmentsError;

    const stats = { enrolled: 0, completed: 0, exited_active: 0 };
    for (const row of enrollments ?? []) {
      if (row.completed_at === null) stats.enrolled += 1;
      if (row.exit_reason === 'completed') stats.completed += 1;
      if (row.exit_reason === 'active') stats.exited_active += 1;
    }

    return NextResponse.json({ ...flow, steps: steps ?? [], stats });
  } catch (err) {
    console.error('[GET /api/admin/flows/[id]]', err);
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
    const {
      name,
      description,
      is_active,
      trigger_type,
      trigger_config,
      target_role,
      exit_on_activity,
    } = body;

    const { data, error } = await supabase
      .from('notification_flows')
      .update({
        ...(name             !== undefined && { name }),
        ...(description      !== undefined && { description }),
        ...(is_active        !== undefined && { is_active }),
        ...(trigger_type     !== undefined && { trigger_type }),
        ...(trigger_config   !== undefined && { trigger_config }),
        ...(target_role      !== undefined && { target_role }),
        ...(exit_on_activity !== undefined && { exit_on_activity }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error('[PUT /api/admin/flows/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from('notification_flows')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/admin/flows/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
