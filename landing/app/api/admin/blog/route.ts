/**
 * GET  /api/admin/blog        — list all posts, ordered by date DESC
 * POST /api/admin/blog        — create a new post
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
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('[GET /api/admin/blog]', err);
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
    const { title, slug, excerpt, author, content, published, date } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: 'title and slug are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug,
        excerpt:   excerpt   ?? '',
        author:    author    ?? 'Deco Team',
        content:   content   ?? '',
        published: published ?? false,
        date:      date      ?? new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/blog]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
