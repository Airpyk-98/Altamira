import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from './db';
import { User } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'altamira_luxury_homes_jwt_secret_token_2026_super_key_991823';
const key = new TextEncoder().encode(JWT_SECRET);

export const AUTH_COOKIE_NAME = 'altamira_session';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: { id: number; email: string; role: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<{ id: number; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as { id: number; email: string; role: string };
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.id) return null;

    const res = await query<User>(
      'SELECT id, name, email, phone, role, is_active, created_at FROM altamira_users WHERE id = $1',
      [payload.id]
    );

    if (res.rows.length === 0) return null;
    const user = res.rows[0];

    // If manager, fetch assigned apartments
    if (user.role === 'manager') {
      const apts = await query<{ apartment_id: number }>(
        'SELECT apartment_id FROM altamira_manager_apartments WHERE user_id = $1',
        [user.id]
      );
      user.assigned_apartments = apts.rows.map(r => r.apartment_id);
    }

    return user;
  } catch (err) {
    console.error('Error fetching current user:', err);
    return null;
  }
}
