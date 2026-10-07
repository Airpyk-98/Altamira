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
    if (!confirm('Delete this expense record?')) return;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 shadow-xl relative my-auto animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-950">
                {isEditing ? 'Edit Expense' : 'Log Expense'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* Apartment Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Unit <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={apartmentId}
                onChange={(e) => setApartmentId(parseInt(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition-colors font-medium"
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
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Cost in Naira (₦) <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-rose-600 font-bold text-sm">₦</span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="65000"
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-600 focus:bg-white text-slate-900 font-extrabold rounded-xl pl-9 pr-3 py-2 text-sm outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Expense Category */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Category <span className="text-rose-600">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 rounded-xl px-3 py-2 text-xs outline-none transition-colors font-medium"
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
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Date Incurred
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Description (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Diesel refill for generator"
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition-colors"
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
                className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Delete Expense"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Expense' : 'Log Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
