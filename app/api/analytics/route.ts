import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const rangeType = searchParams.get('range_type') || 'monthly'; // weekly, monthly, yearly, custom
    const customStart = searchParams.get('start_date');
    const customEnd = searchParams.get('end_date');
    const apartmentId = searchParams.get('apartment_id');

    // Calculate start and end date
    const now = new Date();
    let startDate = '';
    let endDate = '';

    if (rangeType === 'weekly') {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(now.setDate(diffToMonday));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    } else if (rangeType === 'monthly') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    } else if (rangeType === 'yearly') {
      const year = now.getFullYear();
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else if (rangeType === 'custom') {
      startDate = customStart || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = customEnd || new Date().toISOString().split('T')[0];
    }

    // Apartment filter conditions
    let aptFilter = '';
    const params: any[] = [startDate, endDate];
    let paramIndex = 3;

    if (user.role === 'manager') {
      aptFilter += ` AND b.apartment_id IN (SELECT apartment_id FROM altamira_manager_apartments WHERE user_id = $${paramIndex})`;
      params.push(user.id);
      paramIndex++;
    }

    if (apartmentId && apartmentId !== 'all') {
      aptFilter += ` AND b.apartment_id = $${paramIndex}`;
      params.push(parseInt(apartmentId));
      paramIndex++;
    }

    // 1. Fetch individual bookings in range
    const bookingsRes = await query(`
      SELECT b.id, b.apartment_id, a.name AS apartment_name, b.client_name, b.client_phone,
        b.dates, b.start_date, b.end_date, b.total_amount, b.rate_per_night, b.nights_count,
        b.notes, u.name AS booked_by_name
      FROM altamira_bookings b
      JOIN altamira_apartments a ON b.apartment_id = a.id
      LEFT JOIN altamira_users u ON b.booked_by = u.id
      WHERE a.is_archived = FALSE
        AND (
          (b.start_date >= $1 AND b.start_date <= $2)
          OR (b.end_date >= $1 AND b.end_date <= $2)
          OR (b.start_date <= $1 AND b.end_date >= $2)
        )
        ${aptFilter}
      ORDER BY b.start_date DESC;
    `, params);

    // 2. Fetch expenses in range
    let expFilter = '';
    const expParams: any[] = [startDate, endDate];
    let expParamIndex = 3;

    if (user.role === 'manager') {
      expFilter += ` AND e.apartment_id IN (SELECT apartment_id FROM altamira_manager_apartments WHERE user_id = $${expParamIndex})`;
      expParams.push(user.id);
      expParamIndex++;
    }

    if (apartmentId && apartmentId !== 'all') {
      expFilter += ` AND e.apartment_id = $${expParamIndex}`;
      expParams.push(parseInt(apartmentId));
      expParamIndex++;
    }

    const expensesRes = await query(`
      SELECT e.id, e.apartment_id, a.name AS apartment_name, e.amount,
        e.category, e.description, e.expense_date, u.name AS logged_by_name
      FROM altamira_expenses e
      JOIN altamira_apartments a ON e.apartment_id = a.id
      LEFT JOIN altamira_users u ON e.logged_by = u.id
      WHERE a.is_archived = FALSE
        AND e.expense_date >= $1 AND e.expense_date <= $2
        ${expFilter}
      ORDER BY e.expense_date DESC;
    `, expParams);

    // Build Individual Bookings list
    let totalIncome = 0;
    let totalNightsBooked = 0;

    const individualBookings = bookingsRes.rows.map(b => {
      const datesArr: string[] = Array.isArray(b.dates) ? b.dates : [];
      const totalAmt = parseFloat(b.total_amount) || 0;
      const ratePerNight = parseFloat(b.rate_per_night) || (datesArr.length > 0 ? totalAmt / datesArr.length : totalAmt);
      const nights = b.nights_count || (datesArr.length > 0 ? datesArr.length : 1);

      totalIncome += totalAmt;
      totalNightsBooked += nights;

      return {
        id: b.id,
        apartment_id: b.apartment_id,
        apartment_name: b.apartment_name,
        client_name: b.client_name,
        client_phone: b.client_phone || '',
        start_date: b.start_date instanceof Date ? b.start_date.toISOString().split('T')[0] : String(b.start_date),
        end_date: b.end_date instanceof Date ? b.end_date.toISOString().split('T')[0] : String(b.end_date),
        dates: datesArr,
        nights_count: nights,
        rate_per_night: Math.round(ratePerNight * 100) / 100,
        total_amount: Math.round(totalAmt * 100) / 100,
        booked_by_name: b.booked_by_name || 'Manager',
        notes: b.notes || '',
      };
    });

    // Build Individual Expenses list
    let totalExpenses = 0;
    const individualExpenses = expensesRes.rows.map(e => {
      const amt = parseFloat(e.amount) || 0;
      totalExpenses += amt;
      const expDate = e.expense_date instanceof Date ? e.expense_date.toISOString().split('T')[0] : String(e.expense_date);

      return {
        id: e.id,
        apartment_id: e.apartment_id,
        apartment_name: e.apartment_name,
        category: e.category,
        description: e.description || '',
        amount: Math.round(amt * 100) / 100,
        expense_date: expDate,
        logged_by_name: e.logged_by_name || 'Manager',
      };
    });

    // Combined Itemized Transactions (Bookings & Expenses)
    const itemizedLedger = [
      ...individualBookings.map(b => ({
        id: `book-${b.id}`,
        type: 'booking' as const,
        date: b.start_date,
        apartment_id: b.apartment_id,
        apartment_name: b.apartment_name,
        title: `${b.client_name} (${b.nights_count} night${b.nights_count > 1 ? 's' : ''})`,
        subtitle: `${b.start_date} → ${b.end_date}`,
        amount: b.total_amount,
        raw_amount: b.total_amount,
      })),
      ...individualExpenses.map(e => ({
        id: `exp-${e.id}`,
        type: 'expense' as const,
        date: e.expense_date,
        apartment_id: e.apartment_id,
        apartment_name: e.apartment_name,
        title: `${e.category}${e.description ? ': ' + e.description : ''}`,
        subtitle: `Operational cost`,
        amount: -e.amount,
        raw_amount: e.amount,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    // Daily Ledger for backward compatibility
    const ledgerMap: Record<string, any> = {};
    individualBookings.forEach(b => {
      const d = b.start_date;
      if (!ledgerMap[d]) {
        ledgerMap[d] = {
          date: d,
          income: 0,
          expenses: 0,
          net: 0,
          nights_booked: 0,
          bookings_count: 0,
          details: { bookings: [], expenses: [] },
        };
      }
      ledgerMap[d].income += b.total_amount;
      ledgerMap[d].nights_booked += b.nights_count;
      ledgerMap[d].bookings_count += 1;
      ledgerMap[d].details.bookings.push({
        client_name: b.client_name,
        amount: b.total_amount,
        apartment_name: b.apartment_name,
      });
    });

    individualExpenses.forEach(e => {
      const d = e.expense_date;
      if (!ledgerMap[d]) {
        ledgerMap[d] = {
          date: d,
          income: 0,
          expenses: 0,
          net: 0,
          nights_booked: 0,
          bookings_count: 0,
          details: { bookings: [], expenses: [] },
        };
      }
      ledgerMap[d].expenses += e.amount;
      ledgerMap[d].details.expenses.push({
        description: e.description || e.category,
        category: e.category,
        amount: e.amount,
        apartment_name: e.apartment_name,
      });
    });

    const dailyLedger = Object.values(ledgerMap).map((item: any) => ({
      ...item,
      income: Math.round(item.income * 100) / 100,
      expenses: Math.round(item.expenses * 100) / 100,
      net: Math.round((item.income - item.expenses) * 100) / 100,
    })).sort((a: any, b: any) => b.date.localeCompare(a.date));

    // Calculate total days in range for occupancy
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    const totalDaysInRange = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let totalApartmentsCount = 1;
    if (user.role === 'admin') {
      const aptCountRes = await query('SELECT COUNT(*) FROM altamira_apartments WHERE is_archived = FALSE');
      totalApartmentsCount = Math.max(1, parseInt(aptCountRes.rows[0].count));
    } else {
      const aptCountRes = await query(
        'SELECT COUNT(*) FROM altamira_manager_apartments ma JOIN altamira_apartments a ON ma.apartment_id = a.id WHERE ma.user_id = $1 AND a.is_archived = FALSE',
        [user.id]
      );
      totalApartmentsCount = Math.max(1, parseInt(aptCountRes.rows[0].count));
    }

    const maxPossibleNights = totalDaysInRange * totalApartmentsCount;
    const occupancyRate = maxPossibleNights > 0 ? Math.min(100, Math.round((totalNightsBooked / maxPossibleNights) * 100)) : 0;

    return NextResponse.json({
      success: true,
      range: {
        type: rangeType,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDaysInRange,
      },
      summary: {
        total_income: Math.round(totalIncome * 100) / 100,
        total_expenses: Math.round(totalExpenses * 100) / 100,
        net_profit: Math.round((totalIncome - totalExpenses) * 100) / 100,
        total_nights_booked: totalNightsBooked,
        total_bookings_count: individualBookings.length,
        occupancy_rate: occupancyRate,
      },
      individual_bookings: individualBookings,
      individual_expenses: individualExpenses,
      itemized_ledger: itemizedLedger,
      daily_ledger: dailyLedger,
    });
  } catch (error: any) {
    console.error('Error in analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
