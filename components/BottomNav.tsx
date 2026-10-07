'use client';

import React from 'react';
import { Building2, Calendar, Receipt, BarChart3, User, Shield } from 'lucide-react';

export type NavTab = 'apartments' | 'calendar' | 'expenses' | 'analytics' | 'profile' | 'team';

interface BottomNavProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  isAdmin: boolean;
}

export default function BottomNav({ currentTab, onChangeTab, isAdmin }: BottomNavProps) {
  const tabs = [
    { id: 'apartments' as NavTab, label: 'Units', icon: Building2 },
    { id: 'calendar' as NavTab, label: 'Calendar', icon: Calendar },
    { id: 'expenses' as NavTab, label: 'Expenses', icon: Receipt },
    { id: 'analytics' as NavTab, label: 'Ledger', icon: BarChart3 },
    ...(isAdmin ? [{ id: 'team' as NavTab, label: 'Team', icon: Shield }] : []),
    { id: 'profile' as NavTab, label: 'Account', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 pb-safe shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[48px] ${
                isActive
                  ? 'text-blue-950 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-900' : 'bg-transparent text-slate-500'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? 'text-blue-950 font-bold' : 'text-slate-600'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
