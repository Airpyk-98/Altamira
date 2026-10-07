import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can edit apartments' }, { status: 403 });
    }

    const { id } = await params;
    const aptId = parseInt(id);
    if (!aptId) return NextResponse.json({ error: 'Invalid apartment ID' }, { status: 400 });

    const { name, address, price_mode, default_price, description, manager_ids } = await request.json();

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const priceMode = price_mode === 'manual_input' ? 'manual_input' : 'fixed';
    const basePrice = parseFloat(default_price) || 0;

    const res = await query(
      `UPDATE altamira_apartments 
       SET name = $1, address = $2, price_mode = $3, default_price = $4, description = $5, updated_at = NOW()
       WHERE id = $6 AND is_archived = FALSE
       RETURNING id, name, address, price_mode, default_price, description`,
      [name.trim(), (address || '').trim(), priceMode, basePrice, (description || '').trim(), aptId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    // Update manager assignments if provided
    if (Array.isArray(manager_ids)) {
      await query('DELETE FROM altamira_manager_apartments WHERE apartment_id = $1', [aptId]);
      for (const mId of manager_ids) {
        await query(
          'INSERT INTO altamira_manager_apartments (user_id, apartment_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [mId, aptId]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Apartment updated successfully',
      apartment: res.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating apartment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can delete apartments' }, { status: 403 });
    }

    const { id } = await params;
    const aptId = parseInt(id);
    if (!aptId) return NextResponse.json({ error: 'Invalid apartment ID' }, { status: 400 });

    // Soft delete
    await query('UPDATE altamira_apartments SET is_archived = TRUE, updated_at = NOW() WHERE id = $1', [aptId]);

    return NextResponse.json({ success: true, message: 'Apartment archived successfully' });
  } catch (error: any) {
    console.error('Error deleting apartment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
