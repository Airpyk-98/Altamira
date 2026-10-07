'use client';

import React, { useState, useMemo } from 'react';
import { Apartment, Expense, User } from '@/lib/types';
import { formatNaira, formatDate, EXPENSE_CATEGORIES } from '@/lib/utils';
import { Receipt, PlusCircle, Filter, Eye, Calendar, Building2, Tag, Search } from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  apartments: Apartment[];
  currentUser: User;
  onOpenExpenseModal: (expense?: Expense) => void;
}

export default function ExpensesView({
  expenses,
  apartments,
  currentUser,
  onOpenExpenseModal,
}: ExpensesViewProps) {
  const isAdmin = currentUser.role === 'admin';

  const [selectedAptId, setSelectedAptId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchApt = selectedAptId === 'all' || e.apartment_id === parseInt(selectedAptId);
      const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.apartment_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchApt && matchCat && matchSearch;
    });
  }, [expenses, selectedAptId, selectedCategory, searchQuery]);

  // Total amount
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (parseFloat(String(e.amount)) || 0), 0);
  }, [filteredExpenses]);

  return (
    <div className="w-full flex flex-col gap-3 max-w-full">
      {/* Top Total Expense Card */}
      <div className="w-full bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Logged Expenses
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight mt-0.5">
            {formatNaira(totalAmount)}
          </h2>
          <span className="text-[10px] text-slate-400">
            {filteredExpenses.length} record{filteredExpenses.length !== 1 ? 's' : ''} listed
          </span>
        </div>

        {/* Manager Action */}
        {!isAdmin ? (
          <button
            onClick={() => onOpenExpenseModal()}
            className="flex items-center gap-1.5 py-2.5 px-3.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-500/20 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Expense</span>
          </button>
        ) : (
          <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-right">
            <span className="text-[10px] font-bold text-amber-300 uppercase block">Observer</span>
            <span className="text-[9px] text-slate-400">Read-Only</span>
          </div>
        )}
      </div>

      {/* Admin Observer Notice */}
      {isAdmin && (
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-300">
          <Eye className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-tight">
            <span className="font-bold">Observer Mode:</span> You can monitor all operational expense records across all apartments. Creating and editing expenses is reserved for assigned managers.
          </p>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search expenses by description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 text-white rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition-colors"
          />
        </div>

        {/* Apartment and Category Selectors */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={selectedAptId}
            onChange={(e) => setSelectedAptId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-2 outline-none focus:border-amber-500/50 truncate"
          >
            <option value="all">All Apartments</option>
            {apartments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-2 outline-none focus:border-amber-500/50 truncate"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense Feed List */}
      <div className="w-full flex flex-col gap-2">
        {filteredExpenses.length === 0 ? (
          <div className="w-full bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center">
            <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No expenses found matching the filter</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => {
            return (
              <div
                key={expense.id}
                onClick={() => {
                  if (!isAdmin) {
                    onOpenExpenseModal(expense);
                  }
                }}
                className={`w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-start justify-between gap-3 transition-all ${
                  !isAdmin ? 'hover:border-slate-700 cursor-pointer' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 truncate">
                      {expense.apartment_name}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded truncate">
                      {expense.category}
                    </span>
                  </div>

                  {expense.description ? (
                    <p className="text-xs text-slate-200 font-medium leading-snug line-clamp-2 mt-0.5">
                      {expense.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No description provided</p>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(expense.expense_date)}
                    </span>
                    {expense.logged_by_name && (
                      <span>• Logged by: {expense.logged_by_name}</span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm sm:text-base font-extrabold text-rose-400 block">
                    {formatNaira(expense.amount)}
                  </span>
                  {!isAdmin && (
                    <span className="text-[10px] text-slate-500 hover:text-amber-400 mt-1 inline-block">
                      Tap to Edit
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
