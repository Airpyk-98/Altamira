import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const res = await query(
      'SELECT id, name, email, phone, password_hash, role, is_active FROM altamira_users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = res.rows[0];
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json(
        { 
          error: 'Account Pending Activation: Your manager account has not been activated yet. An administrator must approve your sign-in.',
          is_pending: true 
        }, 
        { status: 403 }
      );
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Check assigned apartments if manager
    let assigned_apartments: number[] = [];
    if (user.role === 'manager') {
      const apts = await query<{ apartment_id: number }>(
        'SELECT apartment_id FROM altamira_manager_apartments WHERE user_id = $1',
        [user.id]
      );
      assigned_apartments = apts.rows.map(r => r.apartment_id);
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        assigned_apartments,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
