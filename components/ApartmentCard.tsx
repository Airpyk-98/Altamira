'use client';

import React from 'react';
import { Apartment } from '@/lib/types';
import { formatNaira } from '@/lib/utils';
import { Building2, Calendar, MapPin, Tag, Users, Edit3, Trash2 } from 'lucide-react';

interface ApartmentCardProps {
  apartment: Apartment;
  isAdmin: boolean;
  onSelect: (apt: Apartment) => void;
  onEdit?: (apt: Apartment) => void;
  onDelete?: (aptId: number) => void;
}

export default function ApartmentCard({
  apartment,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
}: ApartmentCardProps) {
  const isFixed = apartment.price_mode === 'fixed';
  const managers = (apartment as any).managers || [];

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all duration-200 shadow-sm flex flex-col justify-between">
      <div>
        {/* Top badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
              isFixed
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
            }`}
          >
            <Tag className="w-3 h-3" />
            {isFixed ? 'Fixed Rate' : 'Flexible Pricing'}
          </span>

          <span className="text-xs font-semibold text-amber-400">
            {formatNaira(apartment.default_price)}
            <span className="text-[10px] text-slate-400 font-normal"> /night</span>
          </span>
        </div>

        {/* Name and address */}
        <h3 className="text-base font-bold text-white tracking-tight mb-1 truncate">
          {apartment.name}
        </h3>
        {apartment.address && (
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{apartment.address}</span>
          </div>
        )}

        {apartment.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
            {apartment.description}
          </p>
        )}

        {/* Admin Assigned Managers */}
        {isAdmin && managers.length > 0 && (
          <div className="mb-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1.5">
              <Users className="w-3 h-3 text-amber-400/80" />
              <span>Assigned Managers:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {managers.map((m: any) => (
                <span
                  key={m.id}
                  className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50"
                >
                  {m.name} {!m.is_active && '(Pending)'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
        <button
          onClick={() => onSelect(apartment)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition-all shadow-sm shadow-amber-500/10 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>View Calendar</span>
        </button>

        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(apartment);
                }}
                className="p-2 text-slate-400 hover:text-amber-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-colors cursor-pointer"
                title="Edit Apartment"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Archive ${apartment.name}?`)) {
                    onDelete(apartment.id);
                  }
                }}
                className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-colors cursor-pointer"
                title="Delete Apartment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
