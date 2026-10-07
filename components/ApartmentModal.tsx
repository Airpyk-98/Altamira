'use client';

import React, { useState, useEffect } from 'react';
import { Apartment } from '@/lib/types';
import { formatNaira } from '@/lib/utils';
import { X, Building2, MapPin, Tag, Users, FileText } from 'lucide-react';

interface ApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment?: Apartment | null;
  managers: { id: number; name: string; email: string; is_active: boolean }[];
  onSave: (data: {
    id?: number;
    name: string;
    address?: string;
    price_mode: 'fixed' | 'manual_input';
    default_price: number;
    description?: string;
    manager_ids: number[];
  }) => Promise<void>;
}

export default function ApartmentModal({
  isOpen,
  onClose,
  apartment,
  managers,
  onSave,
}: ApartmentModalProps) {
  const isEditing = Boolean(apartment);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [priceMode, setPriceMode] = useState<'fixed' | 'manual_input'>('fixed');
  const [defaultPrice, setDefaultPrice] = useState('150000');
  const [description, setDescription] = useState('');
  const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (apartment) {
      setName(apartment.name || '');
      setAddress(apartment.address || '');
      setPriceMode(apartment.price_mode || 'fixed');
      setDefaultPrice(String(apartment.default_price || '0'));
      setDescription(apartment.description || '');
      const existingMgrs = (apartment as any).managers?.map((m: any) => m.id) || [];
      setSelectedManagerIds(existingMgrs);
    } else {
      setName('');
      setAddress('');
      setPriceMode('fixed');
      setDefaultPrice('150000');
      setDescription('');
      setSelectedManagerIds([]);
    }
    setError('');
  }, [apartment]);

  if (!isOpen) return null;

  const toggleManager = (id: number) => {
    if (selectedManagerIds.includes(id)) {
      setSelectedManagerIds(selectedManagerIds.filter((m) => m !== id));
    } else {
      setSelectedManagerIds([...selectedManagerIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Apartment name is required');
      return;
    }

    const price = parseFloat(defaultPrice);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price in ₦');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave({
        id: apartment?.id,
        name,
        address,
        price_mode: priceMode,
        default_price: price,
        description,
        manager_ids: selectedManagerIds,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save apartment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Edit Apartment Unit' : 'Add New Luxury Apartment'}
              </h2>
              <p className="text-[10px] text-slate-400">Shortlet Apartment Configuration</p>
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
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Apartment Name <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Altamira Penthouse 01"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 text-white rounded-xl px-3 py-2 text-xs outline-none transition-colors"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Location / Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Victoria Island, Lagos"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 text-white rounded-xl pl-9 pr-3 py-2 text-xs outline-none transition-colors"
              />
            </div>
          </div>

          {/* Pricing Mode */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Booking Pricing Configuration <span className="text-amber-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPriceMode('fixed')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  priceMode === 'fixed'
                    ? 'bg-amber-500/15 border-amber-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Fixed Rate</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  Manager charges fixed daily rate automatically.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPriceMode('manual_input')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  priceMode === 'manual_input'
                    ? 'bg-amber-500/15 border-amber-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Flexible / Manual</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  Manager enters negotiated amount per booking.
                </p>
              </button>
            </div>
          </div>

          {/* Default Price in Naira */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {priceMode === 'fixed' ? 'Fixed Nightly Price (₦)' : 'Base / Reference Price (₦)'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2 text-amber-400 font-bold text-sm">₦</span>
              <input
                type="number"
                step="any"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
                placeholder="150000"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 text-white font-bold rounded-xl pl-8 pr-3 py-2 text-sm outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Assign Managers */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Assign to Manager(s)
            </label>
            {managers.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                No managers registered yet. You can assign managers anytime.
              </p>
            ) : (
              <div className="max-h-28 overflow-y-auto bg-slate-950/80 border border-slate-800 rounded-xl p-2 space-y-1">
                {managers.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedManagerIds.includes(m.id)}
                      onChange={() => toggleManager(m.id)}
                      className="rounded accent-amber-500"
                    />
                    <span className="text-slate-200 font-medium truncate">{m.name}</span>
                    {!m.is_active && (
                      <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded ml-auto">
                        Pending
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 3-Bedroom waterfront penthouse with private pool"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/60 text-white rounded-xl p-2.5 text-xs outline-none transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2">
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
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Apartment' : 'Create Apartment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
