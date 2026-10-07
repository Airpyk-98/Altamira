'use client';

import React from 'react';
import { User } from '@/lib/types';
import { Shield, UserCheck, Sparkles } from 'lucide-react';

interface NavbarProps {
  user: User;
  onOpenProfile: () => void;
  onOpenManagers?: () => void;
}

export default function Navbar({ user, onOpenProfile, onOpenManagers }: NavbarProps) {
  const isAdmin = user.role === 'admin';

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5 flex items-center justify-between">
      {/* Brand logo & tagline */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-[1px] shadow-sm shadow-amber-500/20 shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
            <span className="font-serif font-black text-amber-400 text-sm tracking-wider">A</span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
              ALTAMIRA
            </h1>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-medium tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Luxury
            </span>
          </div>
          <p className="text-[10px] text-slate-400 hidden xs:block truncate">
            Shortlet Management
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 shrink-0">
        {isAdmin && onOpenManagers && (
          <button
            onClick={onOpenManagers}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Manage Team</span>
          </button>
        )}

        <button
          onClick={onOpenProfile}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span className="capitalize text-slate-300 max-w-[80px] sm:max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
          <span className="text-[10px] px-1 py-0.2 bg-slate-800 text-slate-400 rounded">
            {isAdmin ? 'Admin' : 'Manager'}
          </span>
        </button>
      </div>
    </header>
  );
}
