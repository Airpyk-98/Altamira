'use client';

import React, { useState, useEffect } from 'react';
import { Apartment, User, AnalyticsApiResponse } from '@/lib/types';
import { formatNaira, formatDate } from '@/lib/utils';
import { Download, Printer, RefreshCw, TrendingUp, TrendingDown, DollarSign, BedDouble, Building2, Calendar, UserCheck } from 'lucide-react';

interface AnalyticsViewProps {
  apartments: Apartment[];
  currentUser: User;
}

export default function AnalyticsView({ apartments, currentUser }: AnalyticsViewProps) {
  const isAdmin = currentUser.role === 'admin';
  const [rangeType, setRangeType] = useState<'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAptId, setSelectedAptId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'bookings' | 'transactions'>('bookings');

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsApiResponse | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/api/analytics?range_type=${rangeType}`;
      if (rangeType === 'custom') {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }
      if (selectedAptId !== 'all') {
        url += `&apartment_id=${selectedAptId}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [rangeType, selectedAptId]);

  const handleApplyCustom = () => {
    if (startDate && endDate) {
      fetchAnalytics();
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const bookings = data?.individual_bookings || [];
    if (bookings.length === 0) {
      alert('No booking records to export for this range');
      return;
    }

    const headers = ['Apartment', 'Client Name', 'Dates', 'Nights', 'Rate Per Night (NGN)', 'Total Amount (NGN)', 'Booked By'];
    const rows = bookings.map((b) => [
      `"${b.apartment_name}"`,
      `"${b.client_name}"`,
      `"${b.start_date} to ${b.end_date}"`,
      b.nights_count,
      b.rate_per_night,
      b.total_amount,
      `"${b.booked_by_name || 'Manager'}"`,
    ]);

    rows.push([
      'TOTAL',
      `${bookings.length} Bookings`,
      '',
      data?.summary.total_nights_booked || 0,
      '',
      data?.summary.total_income || 0,
      '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Altamira_Bookings_${rangeType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const summary = data?.summary || {
    total_income: 0,
    total_expenses: 0,
    net_profit: 0,
    total_nights_booked: 0,
    total_bookings_count: 0,
    occupancy_rate: 0,
  };

  const individualBookings = data?.individual_bookings || [];
  const itemizedLedger = data?.itemized_ledger || [];

  return (
    <div className="w-full flex flex-col gap-3.5 max-w-full">
      {/* Range and Filter Controls */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Period
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
            {(['weekly', 'monthly', 'yearly', 'custom'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRangeType(r)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                  rangeType === r
                    ? 'bg-blue-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Picker */}
        {rangeType === 'custom' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 items-end">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-2.5 py-1.5 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-2.5 py-1.5 text-xs outline-none"
              />
            </div>
            <button
              onClick={handleApplyCustom}
              className="col-span-2 sm:col-span-1 py-2 px-3 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        )}

        {/* Apartment Filter */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <label className="text-xs text-slate-500 font-medium shrink-0">Apartment:</label>
          <select
            value={selectedAptId}
            onChange={(e) => setSelectedAptId(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3 py-1.5 outline-none focus:border-blue-600 truncate"
          >
            <option value="all">All Units ({apartments.length})</option>
            {apartments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Gross Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gross Income</span>
            <div className="p-1 rounded-md bg-blue-50 text-blue-700">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-base sm:text-lg font-black text-blue-950 truncate">
            {formatNaira(summary.total_income)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {individualBookings.length} booking{individualBookings.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Expenses</span>
            <div className="p-1 rounded-md bg-rose-50 text-rose-600">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-base sm:text-lg font-black text-rose-600 truncate">
            {formatNaira(summary.total_expenses)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Operational costs</span>
        </div>

        {/* Net Profit */}
        <div className="bg-white border border-blue-200 rounded-2xl p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-blue-950 uppercase tracking-wider">Net Profit</span>
            <div className="p-1 rounded-md bg-blue-50 text-blue-700">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <span
            className={`text-base sm:text-lg font-black truncate ${
              summary.net_profit >= 0 ? 'text-blue-950' : 'text-rose-600'
            }`}
          >
            {formatNaira(summary.net_profit)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Income minus expenses</span>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Occupancy</span>
            <div className="p-1 rounded-md bg-slate-100 text-slate-700">
              <BedDouble className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-base sm:text-lg font-black text-slate-900 truncate">
            {summary.occupancy_rate}%
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {summary.total_nights_booked} nights booked
          </span>
        </div>
      </div>

      {/* Action Header & View Mode Switcher */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setViewMode('bookings')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'bookings'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Individual Bookings
          </button>
          <button
            onClick={() => setViewMode('transactions')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'transactions'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Ledger Items
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-700" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-blue-700" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: INDIVIDUAL BOOKINGS TABLE */}
      {viewMode === 'bookings' && (
        <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 tracking-tight">
                Individual Bookings Breakdown
              </h3>
              <p className="text-[10px] text-slate-500">
                Itemized booking records for each apartment
              </p>
            </div>
            <span className="text-[11px] font-bold bg-blue-50 text-blue-950 border border-blue-200 px-2 py-0.5 rounded-full">
              {individualBookings.length} Bookings
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-3">Apartment</th>
                  <th className="py-2.5 px-3">Guest Client</th>
                  <th className="py-2.5 px-3">Dates</th>
                  <th className="py-2.5 px-3 text-center">Nights</th>
                  <th className="py-2.5 px-3 text-right">Rate / Night</th>
                  <th className="py-2.5 px-3 text-right">Total (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {individualBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No individual bookings found in this period.
                    </td>
                  </tr>
                ) : (
                  individualBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        <span className="block truncate max-w-[160px] sm:max-w-[220px]" title={b.apartment_name}>
                          {b.apartment_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 whitespace-nowrap">
                        <span className="font-medium text-slate-900 block">{b.client_name}</span>
                        {b.client_phone && (
                          <span className="text-[10px] text-slate-500 block">{b.client_phone}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                        {b.start_date} → {b.end_date}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {b.nights_count}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-600 whitespace-nowrap">
                        {formatNaira(b.rate_per_night)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-950 whitespace-nowrap">
                        {formatNaira(b.total_amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {individualBookings.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 text-slate-950 font-extrabold border-t-2 border-slate-200">
                    <td colSpan={3} className="py-3 px-3 uppercase text-[11px] tracking-wider text-blue-950">
                      Total Bookings ({individualBookings.length})
                    </td>
                    <td className="py-3 px-3 text-center text-slate-900 font-bold">
                      {summary.total_nights_booked}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">-</td>
                    <td className="py-3 px-3 text-right text-blue-950 whitespace-nowrap font-black">
                      {formatNaira(summary.total_income)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: ALL TRANSACTIONS (BOOKINGS & EXPENSES ITEMIZED) */}
      {viewMode === 'transactions' && (
        <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 tracking-tight">
                Itemized Ledger Entries
              </h3>
              <p className="text-[10px] text-slate-500">
                Individual bookings and expenses per apartment
              </p>
            </div>
            <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {itemizedLedger.length} Items
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Apartment</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Amount (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemizedLedger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No transactions recorded in this period.
                    </td>
                  </tr>
                ) : (
                  itemizedLedger.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-medium">
                        {formatDate(row.date)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        <span className="block truncate max-w-[140px] sm:max-w-[200px]" title={row.apartment_name}>
                          {row.apartment_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            row.type === 'booking'
                              ? 'bg-blue-50 text-blue-900 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {row.type === 'booking' ? 'Booking' : 'Expense'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">
                        <span className="font-medium text-slate-900 block truncate max-w-[200px]">
                          {row.title}
                        </span>
                        {row.subtitle && (
                          <span className="text-[10px] text-slate-500 block truncate">
                            {row.subtitle}
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                          row.amount >= 0 ? 'text-blue-950' : 'text-rose-600'
                        }`}
                      >
                        {row.amount >= 0 ? `+${formatNaira(row.raw_amount)}` : `-${formatNaira(row.raw_amount)}`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
