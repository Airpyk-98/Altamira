'use client';

import React, { useState } from 'react';
import { User } from '@/lib/types';
import { Phone, Lock, LogOut } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  onUpdateProfile: (data: {
    name?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
  onLogout: () => void;
}

export default function ProfileView({ user, onUpdateProfile, onLogout }: ProfileViewProps) {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      await onUpdateProfile({ name, phone });
      setStatusMsg({ type: 'success', text: 'Contact details updated' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setStatusMsg({ type: 'error', text: 'Current password is required' });
      return;
    }
    if (newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    try {
      await onUpdateProfile({ currentPassword, newPassword });
      setStatusMsg({ type: 'success', text: 'Password successfully updated' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3.5 max-w-full">
      {/* User Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-950 font-bold text-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-950 truncate">{user.name}</h2>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-950 border border-blue-200">
                {user.role}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">● Active</span>
            </div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Contact Details Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-blue-700" />
          <h3 className="text-sm font-bold text-slate-950">Contact & Phone</h3>
        </div>

        <form onSubmit={handleSaveInfo} className="space-y-3">
          <div>
            <label className="text-xs text-slate-600 font-semibold block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 font-semibold block mb-1">Phone Number (WhatsApp)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 803 123 4567"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {loading ? 'Saving...' : 'Save Contact Info'}
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-blue-700" />
          <h3 className="text-sm font-bold text-slate-950">Password</h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="text-xs text-slate-600 font-semibold block mb-1">Current Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 font-semibold block mb-1">New Password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 font-semibold block mb-1">Confirm New Password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600 focus:bg-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Logout Action */}
      <button
        onClick={onLogout}
        className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out</span>
      </button>
    </div>
  );
}
