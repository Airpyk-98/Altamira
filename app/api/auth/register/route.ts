import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name, email, phone, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await query('SELECT id FROM altamira_users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const result = await query(
      `INSERT INTO altamira_users (name, email, phone, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, 'manager', FALSE)
       RETURNING id, name, email, phone, role, is_active`,
      [name.trim(), normalizedEmail, (phone || '').trim(), passwordHash]
    );

    return NextResponse.json({
      success: true,
      message: 'Account registered successfully! An administrator must activate your manager account before you can log in.',
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
