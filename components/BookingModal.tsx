'use client';

import React, { useState, useEffect } from 'react';
import { Apartment, Booking } from '@/lib/types';
import { formatNaira } from '@/lib/utils';
import { X, Lock, Calendar, User, Phone, FileText, Trash2 } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment: Apartment;
  booking?: Booking;
  initialDates?: string[];
  isViewOnly?: boolean;
  onSave: (bookingData: {
    id?: number;
    apartment_id: number;
    client_name: string;
    client_phone?: string;
    dates: string[];
    total_amount: number;
    notes?: string;
  }) => Promise<void>;
  onDelete?: (bookingId: number) => Promise<void>;
}

export default function BookingModal({
  isOpen,
  onClose,
  apartment,
  booking,
  initialDates = [],
  isViewOnly = false,
  onSave,
  onDelete,
}: BookingModalProps) {
  const isEditing = Boolean(booking);
  const isFixed = apartment.price_mode === 'fixed';

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (booking) {
      setClientName(booking.client_name || '');
      setClientPhone(booking.client_phone || '');
      setNotes(booking.notes || '');
      setManualAmount(String(booking.total_amount || ''));
      setDates(Array.isArray(booking.dates) ? booking.dates : [booking.start_date]);
    } else {
      setClientName('');
      setClientPhone('');
      setNotes('');
      setDates(initialDates);
      if (isFixed) {
        setManualAmount(String(apartment.default_price * (initialDates.length || 1)));
      } else {
        setManualAmount(String(apartment.default_price * (initialDates.length || 1)));
      }
    }
    setError('');
  }, [booking, initialDates, apartment, isFixed]);

  if (!isOpen) return null;

  const nightsCount = dates.length || 1;
  const calculatedFixedTotal = isFixed ? apartment.default_price * nightsCount : parseFloat(manualAmount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return;

    if (!clientName.trim()) {
      setError('Client name is required');
      return;
    }

    if (dates.length === 0) {
      setError('At least one date must be selected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave({
        id: booking?.id,
        apartment_id: apartment.id,
        client_name: clientName,
        client_phone: clientPhone,
        dates,
        total_amount: isFixed ? calculatedFixedTotal : parseFloat(manualAmount) || 0,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save booking');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!booking?.id || !onDelete) return;
    if (!confirm(`Cancel booking for ${booking.client_name}?`)) return;

    setLoading(true);
    try {
      await onDelete(booking.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 shadow-xl relative my-auto animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-950 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {apartment.name}
            </span>
            <h2 className="text-base font-bold text-slate-950 mt-1">
              {isViewOnly ? 'Booking Details (Observer)' : isEditing ? 'Edit Booking' : 'Log New Booking'}
            </h2>
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
          {/* Client Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Client Name <span className="text-blue-700">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                disabled={isViewOnly}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Senator Adeleke"
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition-colors disabled:opacity-75 font-medium"
                required
              />
            </div>
          </div>

          {/* Client Phone */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Client Phone (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                disabled={isViewOnly}
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="e.g. +234 803 123 4567"
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition-colors disabled:opacity-75"
              />
            </div>
          </div>

          {/* Dates & Duration Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                Duration ({nightsCount} night{nightsCount > 1 ? 's' : ''}):
              </span>
              <span className="font-bold text-blue-950">
                {dates[0]} ➔ {dates[dates.length - 1]}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pt-1">
              {dates.map((d) => (
                <span key={d} className="text-[10px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Pricing Mode:</span>
              <span className="text-[11px] font-bold text-blue-950 flex items-center gap-1">
                {isFixed && <Lock className="w-3 h-3 text-blue-700" />}
                {isFixed ? 'Fixed Rate' : 'Flexible / Custom'}
              </span>
            </div>

            {isFixed ? (
              <div className="pt-1 border-t border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Nightly Rate:</span>
                  <span className="font-semibold text-slate-900">{formatNaira(apartment.default_price)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                  <span>Total Amount:</span>
                  <span className="text-sm">{formatNaira(calculatedFixedTotal)}</span>
                </div>
              </div>
            ) : (
              <div className="pt-1 border-t border-slate-200/80">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Total Amount (₦):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-bold text-xs">₦</span>
                  <input
                    type="number"
                    disabled={isViewOnly}
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="450000"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 text-slate-900 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none transition-colors disabled:opacity-75 font-bold"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <textarea
                disabled={isViewOnly}
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. VIP guest, airport transfer arranged"
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-900 rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition-colors disabled:opacity-75"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2">
            {isViewOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close (Observer)
              </button>
            ) : (
              <>
                {isEditing && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Cancel Booking"
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
                  {loading ? 'Saving...' : isEditing ? 'Update Booking' : 'Confirm Booking'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
