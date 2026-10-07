'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Apartment, Booking, User } from '@/lib/types';
import { formatNaira, MONTH_NAMES, getDaysInMonth, getFirstDayOfMonth } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Eye, PlusCircle, Check } from 'lucide-react';

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

  const clearSelection = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setSelectedDates([]);
  };

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

  // Calendar days generation
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

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

  // Clean up selected dates if any are now booked or if apartment changes
  useEffect(() => {
    setSelectedDates((prev) => prev.filter((d) => !bookingsByDate[d]));
  }, [bookingsByDate]);

  // Handle day click
  const handleDayClick = (dateStr: string) => {
    const existingBooking = bookingsByDate[dateStr];

    if (existingBooking) {
      if (!selectedApartment) return;
      onOpenBookingModal({
        booking: existingBooking,
        apartment: selectedApartment,
        isViewOnly: isAdmin,
      });
      return;
    }

    if (isAdmin) return;

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
        const start = rangeStart < dateStr ? rangeStart : dateStr;
        const end = rangeStart < dateStr ? dateStr : rangeStart;

        const datesInRange: string[] = [];
        const cur = new Date(start);
        const endDateObj = new Date(end);

        while (cur <= endDateObj) {
          const dStr = cur.toISOString().split('T')[0];
          if (bookingsByDate[dStr]) {
            alert(`Date ${dStr} is already booked.`);
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
    const datesToBook = [...selectedDates];
    clearSelection(); // Reset selection immediately
    onOpenBookingModal({
      dates: datesToBook,
      apartment: selectedApartment,
      isViewOnly: false,
    });
  };

  const isSelected = (dateStr: string) => selectedDates.includes(dateStr);

  return (
    <div className="w-full flex flex-col gap-3 max-w-full">
      {/* Unit Selector & Rate Banner */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Unit
          </label>
          {isAdmin && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1">
              <Eye className="w-3 h-3 text-blue-700" />
              <span>Observer Mode</span>
            </span>
          )}
        </div>

        <select
          value={selectedApartment?.id || ''}
          onChange={(e) => {
            const found = apartments.find((a) => a.id === parseInt(e.target.value));
            if (found) {
              onSelectApartment(found);
              clearSelection();
            }
          }}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-600 focus:bg-white transition-colors"
        >
          {apartments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.price_mode === 'fixed' ? formatNaira(a.default_price) + '/night' : 'Flexible'})
            </option>
          ))}
        </select>

        {selectedApartment && (
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-200/80">
            <span className="font-medium text-slate-900">
              {selectedApartment.price_mode === 'fixed' ? 'Fixed Daily Rate:' : 'Pricing:'}
            </span>
            <span className="font-bold text-blue-950">
              {selectedApartment.price_mode === 'fixed'
                ? `${formatNaira(selectedApartment.default_price)} /night`
                : 'Custom Rate per Booking'}
            </span>
          </div>
        )}
      </div>

      {/* Month Navigator */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between shadow-2xs">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-colors cursor-pointer"
          title="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-extrabold text-slate-950 tracking-tight">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={handleGoToday}
            className="text-[11px] px-2 py-0.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 font-semibold transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-colors cursor-pointer"
          title="Next Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Selection Mode Controls for Manager */}
      {!isAdmin && (
        <div className="w-full flex items-center justify-between gap-2 px-1 text-xs">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => {
                setSelectionMode('range');
                clearSelection();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectionMode === 'range'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Range Selection
            </button>
            <button
              onClick={() => {
                setSelectionMode('multi');
                clearSelection();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectionMode === 'multi'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Multi-Day
            </button>
          </div>

          {selectedDates.length > 0 && (
            <button
              onClick={clearSelection}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors cursor-pointer"
            >
              Clear ({selectedDates.length})
            </button>
          )}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-2xs">
        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-[10px] sm:text-xs font-bold text-slate-500 py-1 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[58px] sm:min-h-[70px] rounded-xl bg-slate-50/50 opacity-40" />
          ))}

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
                className={`min-h-[58px] sm:min-h-[70px] rounded-xl p-1 sm:p-1.5 flex flex-col justify-between transition-all cursor-pointer relative ${
                  isBooked
                    ? 'bg-blue-50 border border-blue-300 hover:border-blue-400'
                    : isDaySelected
                    ? 'bg-blue-950 text-white border border-blue-950 shadow-xs'
                    : 'bg-slate-50/80 border border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {/* Day number & indicators */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] sm:text-xs font-bold leading-none ${
                      isDaySelected
                        ? 'text-white'
                        : isToday
                        ? 'w-5 h-5 rounded-full bg-blue-950 text-white flex items-center justify-center font-bold'
                        : isBooked
                        ? 'text-blue-950'
                        : 'text-slate-800'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {isBooked && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-700 shrink-0" />
                  )}
                </div>

                {/* Booking Content inside day tile */}
                {isBooked ? (
                  <div className="mt-1 flex flex-col">
                    <span className="text-[9px] sm:text-[10px] font-bold text-blue-950 truncate leading-tight">
                      {booking.client_name.split(' ')[0]}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-semibold text-blue-700 truncate leading-none mt-0.5">
                      {formatNaira(booking.rate_per_night || booking.total_amount / (booking.nights_count || 1))}
                    </span>
                  </div>
                ) : isDaySelected ? (
                  <div className="mt-1 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white bg-blue-800 px-1 py-0.2 rounded">
                      Selected
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 text-[8px] text-slate-400 font-medium">
                    Open
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Card for Manager — ONLY when dates are actively selected */}
      {!isAdmin && selectedDates.length > 0 && selectedApartment && (
        <div className="w-full bg-white border border-blue-300 shadow-lg rounded-2xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
              <Check className="w-4 h-4 text-blue-700" />
              <span>{selectedDates.length} Night{selectedDates.length > 1 ? 's' : ''} Selected</span>
            </div>
            <p className="text-[11px] text-slate-600 truncate mt-0.5">
              {selectedDates[0]} ➔ {selectedDates[selectedDates.length - 1]}
            </p>
            {selectedApartment.price_mode === 'fixed' && (
              <p className="text-[11px] text-blue-900 font-bold">
                Total: {formatNaira(selectedApartment.default_price * selectedDates.length)}
              </p>
            )}
          </div>

          <button
            onClick={handleOpenNewBooking}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Booking</span>
          </button>
        </div>
      )}
    </div>
  );
}
