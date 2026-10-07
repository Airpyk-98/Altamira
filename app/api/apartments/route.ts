import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let aptsQuery = '';
    let params: any[] = [];

    if (user.role === 'admin') {
      // Admin sees all active apartments
      aptsQuery = `
        SELECT a.id, a.name, a.address, a.price_mode, a.default_price, a.description, a.created_at,
          COALESCE(json_agg(DISTINCT jsonb_build_object('id', u.id, 'name', u.name, 'email', u.email, 'is_active', u.is_active)) 
            FILTER (WHERE u.id IS NOT NULL), '[]') AS managers,
          COALESCE((
            SELECT COUNT(*) FROM altamira_bookings b 
            WHERE b.apartment_id = a.id AND b.end_date >= CURRENT_DATE
          ), 0) AS active_bookings_count,
          COALESCE((
            SELECT SUM(b.total_amount) FROM altamira_bookings b 
            WHERE b.apartment_id = a.id 
              AND EXTRACT(MONTH FROM b.start_date) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM b.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
          ), 0) AS this_month_income
        FROM altamira_apartments a
        LEFT JOIN altamira_manager_apartments ma ON a.id = ma.apartment_id
        LEFT JOIN altamira_users u ON ma.user_id = u.id
        WHERE a.is_archived = FALSE
        GROUP BY a.id
        ORDER BY a.name ASC;
      `;
    } else {
      // Manager sees ONLY their assigned apartments
      aptsQuery = `
        SELECT a.id, a.name, a.address, a.price_mode, a.default_price, a.description, a.created_at,
          '[]'::json AS managers,
          COALESCE((
            SELECT COUNT(*) FROM altamira_bookings b 
            WHERE b.apartment_id = a.id AND b.end_date >= CURRENT_DATE
          ), 0) AS active_bookings_count,
          COALESCE((
            SELECT SUM(b.total_amount) FROM altamira_bookings b 
            WHERE b.apartment_id = a.id 
              AND EXTRACT(MONTH FROM b.start_date) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM b.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
          ), 0) AS this_month_income
        FROM altamira_apartments a
        INNER JOIN altamira_manager_apartments ma ON a.id = ma.apartment_id
        WHERE a.is_archived = FALSE AND ma.user_id = $1
        ORDER BY a.name ASC;
      `;
      params = [user.id];
    }

    const result = await query(aptsQuery, params);
    return NextResponse.json({ success: true, apartments: result.rows });
  } catch (error: any) {
    console.error('Error fetching apartments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can add apartments' }, { status: 403 });
    }

    const { name, address, price_mode, default_price, description, manager_ids } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Apartment name is required' }, { status: 400 });
    }

    const priceMode = price_mode === 'manual_input' ? 'manual_input' : 'fixed';
    const basePrice = parseFloat(default_price) || 0;

    const res = await query(
      `INSERT INTO altamira_apartments (name, address, price_mode, default_price, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, address, price_mode, default_price, description, created_at`,
      [name.trim(), (address || '').trim(), priceMode, basePrice, (description || '').trim()]
    );

    const newApt = res.rows[0];

    // Assign managers if provided
    if (Array.isArray(manager_ids) && manager_ids.length > 0) {
      for (const mId of manager_ids) {
        await query(
          'INSERT INTO altamira_manager_apartments (user_id, apartment_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [mId, newApt.id]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Apartment created successfully',
      apartment: newApt,
    });
  } catch (error: any) {
    console.error('Error creating apartment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
