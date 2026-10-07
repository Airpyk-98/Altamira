'use client';

import React, { useState, useMemo } from 'react';
import { Apartment, Booking, User } from '@/lib/types';
import { formatNaira, MONTH_NAMES, getDaysInMonth, getFirstDayOfMonth } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Tag, UserCheck, Eye, PlusCircle, Check, Info } from 'lucide-react';

interface CalendarViewProps {
  apartments: Apartment[];
  selectedApartment: Apartment | null;
  onSelectApartment: (apt: Apartment) => void;
  bookings: Booking[];
  currentUser: User;
  onOpenBookingModal: (data: {
    booking?: Booking;
    dates?: string[];
    apartment: Apartment;
    isViewOnly?: boolean;
  }) => void;
}

export default function CalendarView({
  apartments,
  selectedApartment,
  onSelectApartment,
  bookings,
  currentUser,
  onOpenBookingModal,
}: CalendarViewProps) {
  const isAdmin = currentUser.role === 'admin';
  const today = new Date();

  // Current viewed month and year
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12

  // Date selection states (for manager)
  const [selectionMode, setSelectionMode] = useState<'range' | 'multi'>('range');
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    clearSelection();
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    clearSelection();
  };

  const handleGoToday = () => {
    setCurrentMonth(today.getMonth() + 1);
    setCurrentYear(today.getFullYear());
    clearSelection();
  };

  const clearSelection = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setSelectedDates([]);
  };

  // Calendar days generation
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth); // 0 = Mon, 6 = Sun

  // Map bookings to dates for quick lookup
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking> = {};
    if (!selectedApartment) return map;

    bookings
      .filter((b) => b.apartment_id === selectedApartment.id)
      .forEach((b) => {
        const datesArr = Array.isArray(b.dates) ? b.dates : [];
        datesArr.forEach((d) => {
          map[d] = b;
        });
      });

    return map;
  }, [bookings, selectedApartment]);

  // Handle day click
  const handleDayClick = (dateStr: string) => {
    const existingBooking = bookingsByDate[dateStr];

    if (existingBooking) {
      // Open booking modal
      if (!selectedApartment) return;
      onOpenBookingModal({
        booking: existingBooking,
        apartment: selectedApartment,
        isViewOnly: isAdmin, // Admin is view-only observer!
      });
      return;
    }

    if (isAdmin) {
      // Admin is observer
      return;
    }

    // Manager logging flow
    if (selectionMode === 'multi') {
      if (selectedDates.includes(dateStr)) {
        setSelectedDates(selectedDates.filter((d) => d !== dateStr));
      } else {
        setSelectedDates([...selectedDates, dateStr].sort());
      }
    } else {
      // Range selection
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(dateStr);
        setRangeEnd(null);
        setSelectedDates([dateStr]);
      } else {
        // We have start, setting end
        const start = rangeStart < dateStr ? rangeStart : dateStr;
        const end = rangeStart < dateStr ? dateStr : rangeStart;

        // Generate all dates between start and end
        const datesInRange: string[] = [];
        const cur = new Date(start);
        const endDateObj = new Date(end);

        while (cur <= endDateObj) {
          const dStr = cur.toISOString().split('T')[0];
          // Check if any date in between is already booked
          if (bookingsByDate[dStr]) {
            alert(`Date ${dStr} is already booked! Please select available dates.`);
            return;
          }
          datesInRange.push(dStr);
          cur.setDate(cur.getDate() + 1);
        }

        setRangeStart(start);
        setRangeEnd(end);
        setSelectedDates(datesInRange);
      }
    }
  };

  const handleOpenNewBooking = () => {
    if (!selectedApartment || selectedDates.length === 0) return;
    onOpenBookingModal({
      dates: selectedDates,
      apartment: selectedApartment,
      isViewOnly: false,
    });
  };

  const isSelected = (dateStr: string) => selectedDates.includes(dateStr);

  return (
    <div className="w-full flex flex-col gap-3 max-w-full">
      {/* Apartment Selector Dropdown */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Select Apartment
        </label>
        <select
          value={selectedApartment?.id || ''}
          onChange={(e) => {
            const found = apartments.find((a) => a.id === parseInt(e.target.value));
            if (found) {
              onSelectApartment(found);
              clearSelection();
            }
          }}
          className="w-full bg-slate-950 border border-slate-800 text-white font-medium text-sm rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50 transition-colors"
        >
          {apartments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.price_mode === 'fixed' ? 'Fixed: ' + formatNaira(a.default_price) : 'Flexible Price'})
            </option>
          ))}
        </select>

        {selectedApartment && (
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 rounded-xl px-3 py-2 border border-slate-800/60">
            <div className="flex items-center gap-1.5 truncate">
              <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-medium text-amber-300">
                {selectedApartment.price_mode === 'fixed' ? 'Fixed Daily Rate:' : 'Pricing Mode:'}
              </span>
              <span className="font-semibold text-white">
                {selectedApartment.price_mode === 'fixed'
                  ? `${formatNaira(selectedApartment.default_price)} /night`
                  : 'Manual / Negotiated'}
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 shrink-0">
              {selectedApartment.price_mode === 'fixed' ? 'Locked Rate' : 'Custom Rate'}
            </span>
          </div>
        )}
      </div>

      {/* Admin Observer Mode Notice */}
      {isAdmin && (
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-300">
          <Eye className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-tight">
            <span className="font-bold">Observer Mode:</span> You can view all booked dates, client names, and prices in ₦ Naira. Booking logging and edits are handled by the assigned manager.
          </p>
        </div>
      )}

      {/* Month Navigator Bar */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-bold text-white tracking-wide">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={handleGoToday}
            className="text-[11px] px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Selection Mode Controls (For Managers) */}
      {!isAdmin && (
        <div className="w-full flex items-center justify-between gap-2 px-1 text-xs">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setSelectionMode('range');
                clearSelection();
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                selectionMode === 'range'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Range Selection
            </button>
            <button
              onClick={() => {
                setSelectionMode('multi');
                clearSelection();
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                selectionMode === 'multi'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Multi-Day Pick
            </button>
          </div>

          {selectedDates.length > 0 && (
            <button
              onClick={clearSelection}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors underline cursor-pointer"
            >
              Reset ({selectedDates.length})
            </button>
          )}
        </div>
      )}

      {/* Calendar 7-Day Grid */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-2 sm:p-3 overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-[10px] sm:text-xs font-bold text-slate-400 py-1 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Day Tiles */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[58px] sm:min-h-[72px] rounded-xl bg-slate-950/30 opacity-20" />
          ))}

          {/* Days in Month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const booking = bookingsByDate[dateStr];
            const isBooked = Boolean(booking);
            const isDaySelected = isSelected(dateStr);
            const isToday =
              today.getFullYear() === currentYear &&
              today.getMonth() + 1 === currentMonth &&
              today.getDate() === dayNum;

            return (
              <div
                key={dateStr}
                onClick={() => handleDayClick(dateStr)}
                className={`min-h-[58px] sm:min-h-[72px] rounded-xl p-1 sm:p-1.5 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                  isBooked
                    ? 'bg-amber-950/40 border border-amber-500/40 hover:border-amber-400'
                    : isDaySelected
                    ? 'bg-amber-500/20 border-2 border-amber-400 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Day number & indicators */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] sm:text-xs font-semibold leading-none ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold'
                        : isBooked
                        ? 'text-amber-300'
                        : isDaySelected
                        ? 'text-amber-400 font-bold'
                        : 'text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {isBooked && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  )}
                </div>

                {/* Booking Content inside day tile */}
                {isBooked ? (
                  <div className="mt-1 flex flex-col">
                    <span className="text-[9px] sm:text-[10px] font-bold text-amber-200 truncate leading-tight">
                      {booking.client_name.split(' ')[0]}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-medium text-emerald-400 truncate leading-none mt-0.5">
                      {formatNaira(booking.rate_per_night || booking.total_amount / (booking.nights_count || 1))}
                    </span>
                  </div>
                ) : isDaySelected ? (
                  <div className="mt-1 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded">
                      Selected
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 text-[8px] text-slate-600 font-medium">
                    Avail
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Card for Manager when dates are selected */}
      {!isAdmin && selectedDates.length > 0 && selectedApartment && (
        <div className="w-full bg-slate-900 border border-amber-500/40 shadow-xl shadow-black/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Check className="w-4 h-4 text-amber-400" />
              <span>{selectedDates.length} Night{selectedDates.length > 1 ? 's' : ''} Selected</span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              {selectedDates[0]} ➔ {selectedDates[selectedDates.length - 1]}
            </p>
            {selectedApartment.price_mode === 'fixed' && (
              <p className="text-[10px] text-emerald-400 font-medium">
                Est. Total: {formatNaira(selectedApartment.default_price * selectedDates.length)}
              </p>
            )}
          </div>

          <button
            onClick={handleOpenNewBooking}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Booking</span>
          </button>
        </div>
      )}
    </div>
  );
}
