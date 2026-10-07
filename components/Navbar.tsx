'use client';

import React from 'react';
import { User } from '@/lib/types';
import { Shield } from 'lucide-react';

interface NavbarProps {
  user: User;
  onOpenProfile: () => void;
  onOpenManagers?: () => void;
}

export default function Navbar({ user, onOpenProfile, onOpenManagers }: NavbarProps) {
  const isAdmin = user.role === 'admin';

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2.5 flex items-center justify-between">
      {/* Brand logo & title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-blue-950 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
          <span>A</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-950 truncate">
              ALTAMIRA
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold tracking-wide uppercase bg-blue-50 text-blue-900 border border-blue-200">
              Homes
            </span>
          </div>
          <p className="text-[10px] text-slate-500 hidden xs:block truncate">
            Shortlet Management
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 shrink-0">
        {isAdmin && onOpenManagers && (
          <button
            onClick={onOpenManagers}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-blue-700" />
            <span>Team</span>
          </button>
        )}

        <button
          onClick={onOpenProfile}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 rounded-xl transition-colors cursor-pointer"
        >
          <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-blue-600' : 'bg-emerald-600'}`} />
          <span className="font-semibold text-slate-900 max-w-[80px] sm:max-w-[120px] truncate">
            {user.name.split(' ')[0]}
          </span>
          <span className="text-[10px] px-1 py-0.2 bg-white text-slate-600 border border-slate-200 rounded font-medium">
            {isAdmin ? 'Admin' : 'Manager'}
          </span>
        </button>
      </div>
    </header>
  );
}
