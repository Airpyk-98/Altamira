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
      aptFilter += ` AND apartment_id IN (SELECT apartment_id FROM altamira_manager_apartments WHERE user_id = $${paramIndex})`;
      params.push(user.id);
      paramIndex++;
    }

    if (apartmentId) {
      aptFilter += ` AND apartment_id = $${paramIndex}`;
      params.push(parseInt(apartmentId));
      paramIndex++;
    }

    // 1. Fetch bookings in range
    const bookingsRes = await query(`
      SELECT b.id, b.apartment_id, a.name AS apartment_name, b.client_name,
        b.dates, b.start_date, b.end_date, b.total_amount, b.rate_per_night, b.nights_count
      FROM altamira_bookings b
      JOIN altamira_apartments a ON b.apartment_id = a.id
      WHERE a.is_archived = FALSE
        AND (
          (b.start_date >= $1 AND b.start_date <= $2)
          OR (b.end_date >= $1 AND b.end_date <= $2)
          OR (b.start_date <= $1 AND b.end_date >= $2)
        )
        ${aptFilter}
      ORDER BY b.start_date ASC;
    `, params);

    // 2. Fetch expenses in range
    const expensesRes = await query(`
      SELECT e.id, e.apartment_id, a.name AS apartment_name, e.amount,
        e.category, e.description, e.expense_date
      FROM altamira_expenses e
      JOIN altamira_apartments a ON e.apartment_id = a.id
      WHERE a.is_archived = FALSE
        AND e.expense_date >= $1 AND e.expense_date <= $2
        ${aptFilter}
      ORDER BY e.expense_date ASC;
    `, params);

    // Build day-by-day ledger map
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    const ledgerMap: Record<string, {
      date: string;
      income: number;
      expenses: number;
      net: number;
      nights_booked: number;
      bookings_count: number;
      details: {
        bookings: { client_name: string; amount: number; apartment_name: string }[];
        expenses: { description: string; category: string; amount: number; apartment_name: string }[];
      };
    }> = {};

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalNightsBooked = 0;

    // Process bookings
    bookingsRes.rows.forEach(b => {
      const datesArr: string[] = Array.isArray(b.dates) ? b.dates : [];
      const amountPerNight = parseFloat(b.rate_per_night) || (datesArr.length > 0 ? parseFloat(b.total_amount) / datesArr.length : 0);

      datesArr.forEach(d => {
        if (d >= startDate && d <= endDate) {
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
          ledgerMap[d].income += amountPerNight;
          ledgerMap[d].nights_booked += 1;
          ledgerMap[d].bookings_count += 1;
          ledgerMap[d].details.bookings.push({
            client_name: b.client_name,
            amount: amountPerNight,
            apartment_name: b.apartment_name,
          });

          totalIncome += amountPerNight;
          totalNightsBooked += 1;
        }
      });
    });

    // Process expenses
    expensesRes.rows.forEach(e => {
      const d = e.expense_date instanceof Date ? e.expense_date.toISOString().split('T')[0] : String(e.expense_date);
      const amt = parseFloat(e.amount) || 0;
      if (d >= startDate && d <= endDate) {
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
        ledgerMap[d].expenses += amt;
        ledgerMap[d].details.expenses.push({
          description: e.description || e.category,
          category: e.category,
          amount: amt,
          apartment_name: e.apartment_name,
        });

        totalExpenses += amt;
      }
    });

    // Convert map to sorted array and calculate net
    const dailyLedger = Object.values(ledgerMap).map(item => ({
      ...item,
      income: Math.round(item.income * 100) / 100,
      expenses: Math.round(item.expenses * 100) / 100,
      net: Math.round((item.income - item.expenses) * 100) / 100,
    })).sort((a, b) => b.date.localeCompare(a.date));

    // Calculate total days in range for occupancy
    const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    const totalDaysInRange = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Get total count of apartments available to user
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
        total_bookings_count: bookingsRes.rows.length,
        occupancy_rate: occupancyRate,
      },
      daily_ledger: dailyLedger,
    });
  } catch (error: any) {
    console.error('Error in analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
