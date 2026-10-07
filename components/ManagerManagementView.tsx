'use client';

import React, { useState } from 'react';
import { User, Apartment } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Shield, UserCheck, UserX, Crown, Building2, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface ManagerManagementViewProps {
  managers: any[];
  apartments: Apartment[];
  onToggleActive: (managerId: number, currentActive: boolean) => Promise<void>;
  onUpgradeToAdmin: (managerId: number) => Promise<void>;
  onAssignApartments: (managerId: number, apartmentIds: number[]) => Promise<void>;
}

export default function ManagerManagementView({
  managers,
  apartments,
  onToggleActive,
  onUpgradeToAdmin,
  onAssignApartments,
}: ManagerManagementViewProps) {
  const [editingAssignId, setEditingAssignId] = useState<number | null>(null);
  const [selectedApts, setSelectedApts] = useState<number[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const startAssigning = (mgr: any) => {
    setEditingAssignId(mgr.id);
    const assignedIds = mgr.assigned_apartments?.map((a: any) => a.id) || [];
    setSelectedApts(assignedIds);
  };

  const toggleApt = (id: number) => {
    if (selectedApts.includes(id)) {
      setSelectedApts(selectedApts.filter((aId) => aId !== id));
    } else {
      setSelectedApts([...selectedApts, id]);
    }
  };

  const saveAssignments = async (mgrId: number) => {
    setLoadingId(mgrId);
    try {
      await onAssignApartments(mgrId, selectedApts);
      setEditingAssignId(null);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 max-w-full">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-amber-400" />
          <h2 className="text-base font-bold text-white">Manager & Team Administration</h2>
        </div>
        <p className="text-xs text-slate-400">
          Approve manager sign-in activations, assign apartments, or promote managers to administrator.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {managers.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
            No manager accounts registered yet.
          </div>
        ) : (
          managers.map((mgr) => {
            const isManagerAdmin = mgr.role === 'admin';
            const isActive = Boolean(mgr.is_active);
            const isAssigningThis = editingAssignId === mgr.id;

            return (
              <div
                key={mgr.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white truncate">{mgr.name}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isManagerAdmin
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {mgr.role}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isActive ? 'Active' : 'Pending / Deactivated'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {mgr.email}
                      </span>
                      {mgr.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {mgr.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Activation Toggle Button */}
                  {!isManagerAdmin && (
                    <button
                      onClick={() => onToggleActive(mgr.id, isActive)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isActive ? 'Deactivate' : 'Approve & Activate'}
                    </button>
                  )}
                </div>

                {/* Assigned Apartments Display */}
                {!isManagerAdmin && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-amber-400" />
                        Managed Units:
                      </span>
                      <button
                        onClick={() => {
                          if (isAssigningThis) {
                            setEditingAssignId(null);
                          } else {
                            startAssigning(mgr);
                          }
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline"
                      >
                        {isAssigningThis ? 'Cancel' : 'Change Units'}
                      </button>
                    </div>

                    {!isAssigningThis ? (
                      <div className="flex flex-wrap gap-1">
                        {mgr.assigned_apartments && mgr.assigned_apartments.length > 0 ? (
                          mgr.assigned_apartments.map((a: any) => (
                            <span
                              key={a.id}
                              className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800"
                            >
                              {a.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            No units assigned yet.
                          </span>
                        )}
                      </div>
                    ) : (
                      /* Assignment Checkbox Editor */
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mt-2 space-y-2">
                        <p className="text-[11px] text-slate-400 font-medium">
                          Select which apartments {mgr.name.split(' ')[0]} can manage:
                        </p>
                        <div className="max-h-36 overflow-y-auto space-y-1">
                          {apartments.map((apt) => (
                            <label
                              key={apt.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={selectedApts.includes(apt.id)}
                                onChange={() => toggleApt(apt.id)}
                                className="rounded accent-amber-500"
                              />
                              <span className="text-slate-200">{apt.name}</span>
                            </label>
                          ))}
                        </div>
                        <button
                          onClick={() => saveAssignments(mgr.id)}
                          disabled={loadingId === mgr.id}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          {loadingId === mgr.id ? 'Saving...' : 'Save Unit Assignments'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Upgrade to Admin Action */}
                {!isManagerAdmin && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Need admin privileges?</span>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Are you sure you want to promote ${mgr.name} to Administrator? They will have full administrative privileges.`
                          )
                        ) {
                          onUpgradeToAdmin(mgr.id);
                        }
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Upgrade to Admin</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
