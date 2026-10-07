'use client';

import React, { useState } from 'react';
import { User } from '@/lib/types';
import { User as UserIcon, Phone, Lock, LogOut, CheckCircle2, Shield, Mail } from 'lucide-react';

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
      setStatusMsg({ type: 'success', text: 'Profile contact details updated successfully' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update profile' });
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
    <div className="w-full flex flex-col gap-4 max-w-full">
      {/* User Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white truncate">{user.name}</h2>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {user.role}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">● Active</span>
            </div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-2xl text-xs font-medium ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Contact & Phone Information Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Contact & Phone Number</h3>
        </div>

        <form onSubmit={handleSaveInfo} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/50"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Phone Number (WhatsApp)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +234 803 123 4567"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {loading ? 'Saving...' : 'Save Contact Details'}
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Change Account Password</h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/50"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/50"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500/50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Logout Action */}
      <button
        onClick={onLogout}
        className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out of Altamira</span>
      </button>
    </div>
  );
}
