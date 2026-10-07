'use client';

import React, { useState } from 'react';
import { Apartment } from '@/lib/types';
import { Shield, Building2, Phone, Mail, Crown } from 'lucide-react';

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
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-blue-700" />
          <h2 className="text-base font-bold text-slate-950">Team & Managers</h2>
        </div>
        <p className="text-xs text-slate-500">
          Approve manager sign-in activations and assign apartments.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {managers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-2xs">
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
                className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 transition-all shadow-2xs"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-950 truncate">{mgr.name}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isManagerAdmin
                            ? 'bg-blue-50 text-blue-900 border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {mgr.role}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isActive ? 'Active' : 'Pending Approval'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {mgr.email}
                      </span>
                      {mgr.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
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
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isActive ? 'Deactivate' : 'Approve'}
                    </button>
                  )}
                </div>

                {/* Assigned Units */}
                {!isManagerAdmin && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-blue-700" />
                        Assigned Units:
                      </span>
                      <button
                        onClick={() => {
                          if (isAssigningThis) {
                            setEditingAssignId(null);
                          } else {
                            startAssigning(mgr);
                          }
                        }}
                        className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold cursor-pointer underline"
                      >
                        {isAssigningThis ? 'Cancel' : 'Manage Units'}
                      </button>
                    </div>

                    {!isAssigningThis ? (
                      <div className="flex flex-wrap gap-1">
                        {mgr.assigned_apartments && mgr.assigned_apartments.length > 0 ? (
                          mgr.assigned_apartments.map((a: any) => (
                            <span
                              key={a.id}
                              className="text-[10px] bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded-md border border-slate-200"
                            >
                              {a.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            No units assigned yet.
                          </span>
                        )}
                      </div>
                    ) : (
                      /* Checkbox list */
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2 space-y-2">
                        <p className="text-[11px] text-slate-600 font-medium">
                          Select units for {mgr.name.split(' ')[0]}:
                        </p>
                        <div className="max-h-36 overflow-y-auto space-y-1">
                          {apartments.map((apt) => (
                            <label
                              key={apt.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={selectedApts.includes(apt.id)}
                                onChange={() => toggleApt(apt.id)}
                                className="rounded accent-blue-900"
                              />
                              <span className="text-slate-800 font-medium">{apt.name}</span>
                            </label>
                          ))}
                        </div>
                        <button
                          onClick={() => saveAssignments(mgr.id)}
                          disabled={loadingId === mgr.id}
                          className="w-full py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          {loadingId === mgr.id ? 'Saving...' : 'Save Units'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Upgrade Action */}
                {!isManagerAdmin && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Admin privileges</span>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Promote ${mgr.name} to Administrator?`
                          )
                        ) {
                          onUpgradeToAdmin(mgr.id);
                        }
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-950 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-blue-700" />
                      <span>Promote to Admin</span>
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
