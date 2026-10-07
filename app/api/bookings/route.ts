import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const apartmentId = searchParams.get('apartment_id');
    const month = searchParams.get('month'); // 1 - 12
    const year = searchParams.get('year');   // 2026

    let sql = `
      SELECT b.id, b.apartment_id, a.name AS apartment_name, a.price_mode,
        b.client_name, b.client_phone, b.dates, b.start_date, b.end_date,
        b.total_amount, b.rate_per_night, b.nights_count, b.notes,
        b.booked_by, u.name AS booked_by_name, b.created_at
      FROM altamira_bookings b
      JOIN altamira_apartments a ON b.apartment_id = a.id
      LEFT JOIN altamira_users u ON b.booked_by = u.id
      WHERE a.is_archived = FALSE
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // Permissions filter
    if (user.role === 'manager') {
      sql += ` AND b.apartment_id IN (
        SELECT apartment_id FROM altamira_manager_apartments WHERE user_id = $${paramIndex}
      )`;
      params.push(user.id);
      paramIndex++;
    }

    if (apartmentId) {
      sql += ` AND b.apartment_id = $${paramIndex}`;
      params.push(parseInt(apartmentId));
      paramIndex++;
    }

    if (month && year) {
      sql += ` AND (
        (EXTRACT(MONTH FROM b.start_date) = $${paramIndex} AND EXTRACT(YEAR FROM b.start_date) = $${paramIndex + 1})
        OR
        (EXTRACT(MONTH FROM b.end_date) = $${paramIndex} AND EXTRACT(YEAR FROM b.end_date) = $${paramIndex + 1})
      )`;
      params.push(parseInt(month), parseInt(year));
      paramIndex += 2;
    }

    sql += ' ORDER BY b.start_date ASC;';

    const res = await query(sql, params);
    return NextResponse.json({ success: true, bookings: res.rows });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Strict rule: Admin just observes, only assigned managers can log bookings
    if (user.role === 'admin') {
      return NextResponse.json({
        error: 'Administrators have observer status on bookings and cannot log bookings. Only assigned active managers can log bookings.'
      }, { status: 403 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Your account is deactivated. Contact an administrator.' }, { status: 403 });
    }

    const { apartment_id, client_name, client_phone, dates, total_amount, notes } = await request.json();

    if (!apartment_id || !client_name || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json({ error: 'Apartment, client name, and at least one date are required' }, { status: 400 });
    }

    const aptId = parseInt(apartment_id);

    // Verify manager is assigned to this apartment
    const isAssigned = await query(
      'SELECT id FROM altamira_manager_apartments WHERE user_id = $1 AND apartment_id = $2',
      [user.id, aptId]
    );

    if (isAssigned.rows.length === 0) {
      return NextResponse.json({ error: 'You are not assigned to manage this apartment' }, { status: 403 });
    }

    // Fetch apartment pricing details
    const aptRes = await query('SELECT id, price_mode, default_price FROM altamira_apartments WHERE id = $1', [aptId]);
    if (aptRes.rows.length === 0) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }
    const apt = aptRes.rows[0];

    // Sort dates
    const sortedDates = [...dates].sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];
    const nightsCount = sortedDates.length;

    let finalTotalAmount = 0;
    let ratePerNight = 0;

    if (apt.price_mode === 'fixed') {
      ratePerNight = parseFloat(apt.default_price);
      finalTotalAmount = ratePerNight * nightsCount;
    } else {
      // Manual input mode
      finalTotalAmount = parseFloat(total_amount) || 0;
      ratePerNight = nightsCount > 0 ? finalTotalAmount / nightsCount : 0;
    }

    const res = await query(
      `INSERT INTO altamira_bookings 
        (apartment_id, client_name, client_phone, dates, start_date, end_date, total_amount, rate_per_night, nights_count, notes, booked_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        aptId,
        client_name.trim(),
        (client_phone || '').trim(),
        JSON.stringify(sortedDates),
        startDate,
        endDate,
        finalTotalAmount,
        ratePerNight,
        nightsCount,
        (notes || '').trim(),
        user.id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Booking logged successfully',
      booking: res.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role === 'admin') {
      return NextResponse.json({
        error: 'Administrators have observer status and cannot edit bookings. Only assigned managers can edit bookings.'
      }, { status: 403 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Your account is deactivated' }, { status: 403 });
    }

    const { id, client_name, client_phone, dates, total_amount, notes } = await request.json();
    const bookingId = parseInt(id);
    if (!bookingId) return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });

    // Verify booking belongs to an assigned apartment
    const existing = await query(`
      SELECT b.id, b.apartment_id, a.price_mode, a.default_price
      FROM altamira_bookings b
      JOIN altamira_apartments a ON b.apartment_id = a.id
      JOIN altamira_manager_apartments ma ON b.apartment_id = ma.apartment_id
      WHERE b.id = $1 AND ma.user_id = $2
    `, [bookingId, user.id]);

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found or you are not authorized to edit it' }, { status: 403 });
    }

    const apt = existing.rows[0];
    const sortedDates = [...dates].sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];
    const nightsCount = sortedDates.length;

    let finalTotalAmount = 0;
    let ratePerNight = 0;

    if (apt.price_mode === 'fixed') {
      ratePerNight = parseFloat(apt.default_price);
      finalTotalAmount = ratePerNight * nightsCount;
    } else {
      finalTotalAmount = parseFloat(total_amount) || 0;
      ratePerNight = nightsCount > 0 ? finalTotalAmount / nightsCount : 0;
    }

    const res = await query(
      `UPDATE altamira_bookings
       SET client_name = $1, client_phone = $2, dates = $3, start_date = $4, end_date = $5,
           total_amount = $6, rate_per_night = $7, nights_count = $8, notes = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        client_name.trim(),
        (client_phone || '').trim(),
        JSON.stringify(sortedDates),
        startDate,
        endDate,
        finalTotalAmount,
        ratePerNight,
        nightsCount,
        (notes || '').trim(),
        bookingId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      booking: res.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role === 'admin') {
      return NextResponse.json({
        error: 'Administrators have observer status and cannot delete bookings.'
      }, { status: 403 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Your account is deactivated' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const bookingId = parseInt(id || '');
    if (!bookingId) return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });

    // Verify manager is assigned to apartment
    const check = await query(`
      SELECT b.id FROM altamira_bookings b
      JOIN altamira_manager_apartments ma ON b.apartment_id = ma.apartment_id
      WHERE b.id = $1 AND ma.user_id = $2
    `, [bookingId, user.id]);

    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found or not authorized' }, { status: 403 });
    }

    await query('DELETE FROM altamira_bookings WHERE id = $1', [bookingId]);
    return NextResponse.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
