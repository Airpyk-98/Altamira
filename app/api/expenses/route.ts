import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const apartmentId = searchParams.get('apartment_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let sql = `
      SELECT e.id, e.apartment_id, a.name AS apartment_name,
        e.amount, e.category, e.description, e.expense_date,
        e.logged_by, u.name AS logged_by_name, e.created_at
      FROM altamira_expenses e
      JOIN altamira_apartments a ON e.apartment_id = a.id
      LEFT JOIN altamira_users u ON e.logged_by = u.id
      WHERE a.is_archived = FALSE
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (user.role === 'manager') {
      sql += ` AND e.apartment_id IN (
        SELECT apartment_id FROM altamira_manager_apartments WHERE user_id = $${paramIndex}
      )`;
      params.push(user.id);
      paramIndex++;
    }

    if (apartmentId) {
      sql += ` AND e.apartment_id = $${paramIndex}`;
      params.push(parseInt(apartmentId));
      paramIndex++;
    }

    if (startDate) {
      sql += ` AND e.expense_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND e.expense_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    sql += ' ORDER BY e.expense_date DESC, e.created_at DESC;';

    const res = await query(sql, params);
    return NextResponse.json({ success: true, expenses: res.rows });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Strict rule: Admin just observes
    if (user.role === 'admin') {
      return NextResponse.json({
        error: 'Administrators have observer status on expenses and cannot log expenses. Only assigned active managers can log expenses.'
      }, { status: 403 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Your account is deactivated' }, { status: 403 });
    }

    const { apartment_id, amount, category, description, expense_date } = await request.json();

    if (!apartment_id || amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Apartment and amount are required' }, { status: 400 });
    }

    const aptId = parseInt(apartment_id);
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json({ error: 'Please enter a valid amount' }, { status: 400 });
    }

    // Check manager assignment
    const isAssigned = await query(
      'SELECT id FROM altamira_manager_apartments WHERE user_id = $1 AND apartment_id = $2',
      [user.id, aptId]
    );

    if (isAssigned.rows.length === 0) {
      return NextResponse.json({ error: 'You are not assigned to manage this apartment' }, { status: 403 });
    }

    const res = await query(
      `INSERT INTO altamira_expenses (apartment_id, amount, category, description, expense_date, logged_by)
       VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6)
       RETURNING *`,
      [
        aptId,
        parsedAmount,
        (category || 'General').trim(),
        (description || '').trim(),
        expense_date || null,
        user.id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Expense logged successfully',
      expense: res.rows[0],
    });
  } catch (error: any) {
    console.error('Error logging expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role === 'admin') {
      return NextResponse.json({
        error: 'Administrators have observer status and cannot edit expenses.'
      }, { status: 403 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Your account is deactivated' }, { status: 403 });
    }

    const { id, amount, category, description, expense_date } = await request.json();
    const expenseId = parseInt(id);
    if (!expenseId) return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });

    const check = await query(`
      SELECT e.id FROM altamira_expenses e
      JOIN altamira_manager_apartments ma ON e.apartment_id = ma.apartment_id
      WHERE e.id = $1 AND ma.user_id = $2
    `, [expenseId, user.id]);

    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Expense not found or unauthorized' }, { status: 403 });
    }

    const parsedAmount = parseFloat(amount);
    const res = await query(
      `UPDATE altamira_expenses
       SET amount = $1, category = $2, description = $3, expense_date = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [parsedAmount, (category || 'General').trim(), (description || '').trim(), expense_date, expenseId]
    );

    return NextResponse.json({
      success: true,
      message: 'Expense updated successfully',
      expense: res.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role === 'admin') {
      return NextResponse.json({
        error: 'Administrators have observer status and cannot delete expenses.'
      }, { status: 403 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Your account is deactivated' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const expenseId = parseInt(id || '');
    if (!expenseId) return NextResponse.json({ error: 'Invalid expense ID' }, { status: 400 });

    const check = await query(`
      SELECT e.id FROM altamira_expenses e
      JOIN altamira_manager_apartments ma ON e.apartment_id = ma.apartment_id
      WHERE e.id = $1 AND ma.user_id = $2
    `, [expenseId, user.id]);

    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Expense not found or unauthorized' }, { status: 403 });
    }

    await query('DELETE FROM altamira_expenses WHERE id = $1', [expenseId]);
    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
