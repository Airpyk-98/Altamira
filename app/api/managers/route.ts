import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can view manager management' }, { status: 403 });
    }

    const res = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', a.id, 'name', a.name))
          FILTER (WHERE a.id IS NOT NULL AND a.is_archived = FALSE), '[]'
        ) AS assigned_apartments
      FROM altamira_users u
      LEFT JOIN altamira_manager_apartments ma ON u.id = ma.user_id
      LEFT JOIN altamira_apartments a ON ma.apartment_id = a.id
      GROUP BY u.id
      ORDER BY u.role DESC, u.is_active ASC, u.created_at DESC;
    `);

    return NextResponse.json({ success: true, managers: res.rows });
  } catch (error: any) {
    console.error('Error listing managers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can manage users' }, { status: 403 });
    }

    const { managerId, action, is_active, apartment_ids } = await request.json();
    if (!managerId) return NextResponse.json({ error: 'Manager ID is required' }, { status: 400 });

    if (action === 'toggle_active') {
      const updated = await query(
        'UPDATE altamira_users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, is_active, role',
        [Boolean(is_active), managerId]
      );
      return NextResponse.json({
        success: true,
        message: `Account status updated to ${is_active ? 'Active' : 'Inactive'}`,
        user: updated.rows[0],
      });
    }

    if (action === 'upgrade_to_admin') {
      const updated = await query(
        "UPDATE altamira_users SET role = 'admin', is_active = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id, name, email, role, is_active",
        [managerId]
      );
      return NextResponse.json({
        success: true,
        message: 'Account successfully upgraded to Administrator with full privileges!',
        user: updated.rows[0],
      });
    }

    if (action === 'assign_apartments') {
      if (!Array.isArray(apartment_ids)) {
        return NextResponse.json({ error: 'apartment_ids must be an array' }, { status: 400 });
      }

      await query('DELETE FROM altamira_manager_apartments WHERE user_id = $1', [managerId]);
      for (const aptId of apartment_ids) {
        await query(
          'INSERT INTO altamira_manager_apartments (user_id, apartment_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [managerId, aptId]
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Apartment assignments updated successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error modifying manager:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
