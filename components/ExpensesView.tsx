'use client';

import React, { useState, useMemo } from 'react';
import { Apartment, Expense, User } from '@/lib/types';
import { formatNaira, formatDate, EXPENSE_CATEGORIES } from '@/lib/utils';
import { Receipt, PlusCircle, Calendar, Search, Eye } from 'lucide-react';

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
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Operational Costs
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight mt-0.5">
            {formatNaira(totalAmount)}
          </h2>
          <span className="text-[11px] text-slate-500">
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} listed
          </span>
        </div>

        {/* Manager Action / Admin Observer */}
        {!isAdmin ? (
          <button
            onClick={() => onOpenExpenseModal()}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Expense</span>
          </button>
        ) : (
          <div className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-xl text-right">
            <span className="text-[10px] font-bold text-blue-950 uppercase block">Observer</span>
            <span className="text-[9px] text-slate-500">View Only</span>
          </div>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-3 flex flex-col gap-2 shadow-2xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition-colors"
          />
        </div>

        {/* Apartment and Category Selectors */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={selectedAptId}
            onChange={(e) => setSelectedAptId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-xl px-2.5 py-2 outline-none focus:border-blue-600 truncate"
          >
            <option value="all">All Units</option>
            {apartments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-xl px-2.5 py-2 outline-none focus:border-blue-600 truncate"
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

      {/* Expense List */}
      <div className="w-full flex flex-col gap-2">
        {filteredExpenses.length === 0 ? (
          <div className="w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-2xs">
            <Receipt className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No expenses found matching the filter</p>
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
                className={`w-full bg-white border border-slate-200 rounded-2xl p-3.5 flex items-start justify-between gap-3 transition-all shadow-2xs ${
                  !isAdmin ? 'hover:border-slate-300 cursor-pointer' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-blue-950 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 truncate">
                      {expense.apartment_name}
                    </span>
                    <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium truncate">
                      {expense.category}
                    </span>
                  </div>

                  {expense.description ? (
                    <p className="text-xs text-slate-800 font-medium leading-snug line-clamp-2 mt-0.5">
                      {expense.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No description</p>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(expense.expense_date)}
                    </span>
                    {expense.logged_by_name && (
                      <span>• {expense.logged_by_name}</span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm sm:text-base font-extrabold text-rose-600 block">
                    {formatNaira(expense.amount)}
                  </span>
                  {!isAdmin && (
                    <span className="text-[10px] text-blue-700 hover:text-blue-900 mt-1 inline-block font-semibold">
                      Edit
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
