import { NextResponse } from 'next/server';
import { getCurrentUser, comparePassword, hashPassword } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, currentPassword, newPassword } = await request.json();

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const res = await query('SELECT password_hash FROM altamira_users WHERE id = $1', [user.id]);
      if (res.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isMatch = await comparePassword(currentPassword, res.rows[0].password_hash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }

      const newHash = await hashPassword(newPassword);
      await query(
        'UPDATE altamira_users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newHash, user.id]
      );
    }

    // Update name and phone
    const updatedUser = await query(
      `UPDATE altamira_users 
       SET name = COALESCE($1, name), 
           phone = COALESCE($2, phone), 
           updated_at = NOW() 
       WHERE id = $3 
       RETURNING id, name, email, phone, role, is_active`,
      [name?.trim() || null, phone?.trim() || null, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.rows[0],
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
