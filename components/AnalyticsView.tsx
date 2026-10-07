'use client';

import React, { useState, useEffect } from 'react';
import { Apartment, User, AnalyticsApiResponse, AnalyticsSummary, DailyLedgerItem } from '@/lib/types';
import { formatNaira, formatDate } from '@/lib/utils';
import { BarChart3, Download, Printer, Calendar, TrendingUp, TrendingDown, DollarSign, BedDouble, RefreshCw } from 'lucide-react';

interface AnalyticsViewProps {
  apartments: Apartment[];
  currentUser: User;
}

export default function AnalyticsView({ apartments, currentUser }: AnalyticsViewProps) {
  const [rangeType, setRangeType] = useState<'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAptId, setSelectedAptId] = useState<string>('all');

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
    if (!data || !data.daily_ledger || data.daily_ledger.length === 0) {
      alert('No data to export for this range');
      return;
    }

    const headers = ['Date', 'Gross Income (NGN)', 'Expenses (NGN)', 'Net Total (NGN)', 'Nights Booked'];
    const rows = data.daily_ledger.map((d) => [
      d.date,
      d.income,
      d.expenses,
      d.net,
      d.nights_booked,
    ]);

    // Add totals row
    rows.push([
      'TOTAL',
      data.summary.total_income,
      data.summary.total_expenses,
      data.summary.net_profit,
      data.summary.total_nights_booked,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Altamira_Report_${rangeType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrintReport = () => {
    window.print();
  };

  const summary = data?.summary || {
    total_income: 0,
    total_expenses: 0,
    net_profit: 0,
    total_nights_booked: 0,
    occupancy_rate: 0,
  };

  const dailyLedger = data?.daily_ledger || [];

  return (
    <div className="w-full flex flex-col gap-3.5 max-w-full">
      {/* Range and Apartment Controls */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Report Range
          </span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['weekly', 'monthly', 'yearly', 'custom'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRangeType(r)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                  rangeType === r
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Picker */}
        {rangeType === 'custom' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 items-end">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-1.5 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-1.5 text-xs outline-none"
              />
            </div>
            <button
              onClick={handleApplyCustom}
              className="col-span-2 sm:col-span-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        )}

        {/* Apartment Filter Dropdown */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <label className="text-xs text-slate-400 shrink-0">Apartment:</label>
          <select
            value={selectedAptId}
            onChange={(e) => setSelectedAptId(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-1.5 outline-none focus:border-amber-500/50 truncate"
          >
            <option value="all">All Available Apartments</option>
            {apartments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Gross Income */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Income</span>
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-base sm:text-lg font-black text-emerald-400 truncate">
            {formatNaira(summary.total_income)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Total booked revenue</span>
        </div>

        {/* Total Expenses */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <div className="p-1 rounded-md bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-base sm:text-lg font-black text-rose-400 truncate">
            {formatNaira(summary.total_expenses)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Operational costs</span>
        </div>

        {/* Net Profit */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Net Profit</span>
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <span
            className={`text-base sm:text-lg font-black truncate ${
              summary.net_profit >= 0 ? 'text-amber-400' : 'text-rose-400'
            }`}
          >
            {formatNaira(summary.net_profit)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Income minus expenses</span>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Occupancy</span>
            <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
              <BedDouble className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-base sm:text-lg font-black text-indigo-300 truncate">
            {summary.occupancy_rate}%
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {summary.total_nights_booked} nights booked
          </span>
        </div>
      </div>

      {/* Export & Download Buttons */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>Export CSV</span>
        </button>

        <button
          onClick={handlePrintReport}
          className="flex items-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span>Print / PDF</span>
        </button>
      </div>

      {/* Daily Breakdown Table */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
            Daily Breakdown Ledger
          </h3>
          <span className="text-[10px] text-slate-400">
            {dailyLedger.length} active day{dailyLedger.length !== 1 ? 's' : ''} in range
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3 font-semibold">Date</th>
                <th className="py-2.5 px-3 font-semibold text-right">Income</th>
                <th className="py-2.5 px-3 font-semibold text-right">Expenses</th>
                <th className="py-2.5 px-3 font-semibold text-right">Net Total</th>
                <th className="py-2.5 px-3 font-semibold text-center">Nights</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {dailyLedger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No activity recorded in the selected date range
                  </td>
                </tr>
              ) : (
                dailyLedger.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-3 font-medium text-slate-300 whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-emerald-400 whitespace-nowrap">
                      {row.income > 0 ? formatNaira(row.income) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-rose-400 whitespace-nowrap">
                      {row.expenses > 0 ? formatNaira(row.expenses) : '-'}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-bold whitespace-nowrap ${
                        row.net >= 0 ? 'text-amber-400' : 'text-rose-400'
                      }`}
                    >
                      {formatNaira(row.net)}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400">
                      {row.nights_booked || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Sticky summary footer row */}
            {dailyLedger.length > 0 && (
              <tfoot>
                <tr className="bg-slate-950 text-white font-extrabold border-t-2 border-slate-700">
                  <td className="py-3 px-3 uppercase text-[11px] tracking-wider text-amber-400">
                    Range Total
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 whitespace-nowrap">
                    {formatNaira(summary.total_income)}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-400 whitespace-nowrap">
                    {formatNaira(summary.total_expenses)}
                  </td>
                  <td
                    className={`py-3 px-3 text-right whitespace-nowrap ${
                      summary.net_profit >= 0 ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  >
                    {formatNaira(summary.net_profit)}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-300">
                    {summary.total_nights_booked}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
