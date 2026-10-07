'use client';

import React from 'react';
import { Apartment } from '@/lib/types';
import { formatNaira } from '@/lib/utils';
import { Calendar, MapPin, Tag, Users, Edit3, Trash2 } from 'lucide-react';

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
    <div className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition-all duration-150 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Top Badges & Price */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isFixed
                ? 'bg-blue-50 text-blue-900 border border-blue-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Tag className="w-3 h-3 text-blue-700" />
            {isFixed ? 'Fixed Rate' : 'Flexible Rate'}
          </span>

          <span className="text-sm font-extrabold text-blue-950">
            {formatNaira(apartment.default_price)}
            <span className="text-[11px] text-slate-500 font-normal"> /night</span>
          </span>
        </div>

        {/* Title & Address */}
        <h3 className="text-base font-bold text-slate-950 tracking-tight mb-1 truncate">
          {apartment.name}
        </h3>
        {apartment.address && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{apartment.address}</span>
          </div>
        )}

        {apartment.description && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3">
            {apartment.description}
          </p>
        )}

        {/* Admin Assigned Managers */}
        {isAdmin && managers.length > 0 && (
          <div className="mb-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              Managers:
            </span>
            {managers.map((m: any) => (
              <span
                key={m.id}
                className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md"
              >
                {m.name} {!m.is_active && '(Pending)'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
        <button
          onClick={() => onSelect(apartment)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendar</span>
        </button>

        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(apartment);
                }}
                className="p-2 text-slate-600 hover:text-blue-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
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
                className="p-2 text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
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
