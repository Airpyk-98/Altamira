'use client';

import React, { useState, useEffect } from 'react';
import { Apartment, Expense } from '@/lib/types';
import { EXPENSE_CATEGORIES } from '@/lib/utils';
import { X, Receipt, Building2, Calendar, FileText, Trash2 } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartments: Apartment[];
  expense?: Expense;
  onSave: (expenseData: {
    id?: number;
    apartment_id: number;
    amount: number;
    category: string;
    description?: string;
    expense_date: string;
  }) => Promise<void>;
  onDelete?: (expenseId: number) => Promise<void>;
}

export default function ExpenseModal({
  isOpen,
  onClose,
  apartments,
  expense,
  onSave,
  onDelete,
}: ExpenseModalProps) {
  const isEditing = Boolean(expense);

  const [apartmentId, setApartmentId] = useState<number>(apartments[0]?.id || 0);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (expense) {
      setApartmentId(expense.apartment_id);
      setAmount(String(expense.amount));
      setCategory(expense.category || EXPENSE_CATEGORIES[0]);
      setDescription(expense.description || '');
      setExpenseDate(
        expense.expense_date
          ? new Date(expense.expense_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
    } else {
      setApartmentId(apartments[0]?.id || 0);
      setAmount('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setDescription('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
    }
    setError('');
  }, [expense, apartments]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid expense amount in ₦');
      return;
    }

    if (!apartmentId) {
      setError('Please select an apartment');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave({
        id: expense?.id,
        apartment_id: apartmentId,
        amount: parsedAmount,
        category,
        description,
        expense_date: expenseDate,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!expense?.id || !onDelete) return;
    if (!confirm('Are you sure you want to delete this expense record?')) return;

    setLoading(true);
    try {
      await onDelete(expense.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Edit Expense Record' : 'Log New Expense'}
              </h2>
              <p className="text-[10px] text-slate-400">Shortlet Apartment Operational Cost</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Apartment Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Select Apartment <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <select
                value={apartmentId}
                onChange={(e) => setApartmentId(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none transition-colors"
                required
              >
                {apartments.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    {apt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount in Naira */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Expense Cost in Naira (₦) <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-rose-400 font-bold text-sm">₦</span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 65000"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/60 text-white font-bold rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Expense Category */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Expense Category <span className="text-amber-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 text-white rounded-xl px-3 py-2.5 text-xs outline-none transition-colors"
              required
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Expense Date */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Date Incurred
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 text-white rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Description / Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 50 Litres generator diesel refill + servicing filter"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 text-white rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition-colors"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Delete Expense"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Expense' : 'Log Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
