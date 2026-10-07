'use client';

import React, { useState, useEffect } from 'react';
import { User, Apartment, Booking, Expense } from '@/lib/types';
import Navbar from '@/components/Navbar';
import BottomNav, { NavTab } from '@/components/BottomNav';
import AuthView from '@/components/AuthView';
import ApartmentCard from '@/components/ApartmentCard';
import CalendarView from '@/components/CalendarView';
import ExpensesView from '@/components/ExpensesView';
import AnalyticsView from '@/components/AnalyticsView';
import ManagerManagementView from '@/components/ManagerManagementView';
import ProfileView from '@/components/ProfileView';
import BookingModal from '@/components/BookingModal';
import ExpenseModal from '@/components/ExpenseModal';
import ApartmentModal from '@/components/ApartmentModal';
import { PlusCircle, Building2, Calendar, Receipt, Shield, Sparkles, AlertCircle } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('apartments');

  // Core Data
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  // Modals state
  const [bookingModalState, setBookingModalState] = useState<{
    isOpen: boolean;
    booking?: Booking;
    dates?: string[];
    apartment?: Apartment;
    isViewOnly?: boolean;
  }>({ isOpen: false });

  const [expenseModalState, setExpenseModalState] = useState<{
    isOpen: boolean;
    expense?: Expense;
  }>({ isOpen: false });

  const [apartmentModalState, setApartmentModalState] = useState<{
    isOpen: boolean;
    apartment?: Apartment | null;
  }>({ isOpen: false, apartment: null });

  // 1. Check user session
  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // 2. Fetch data once authenticated
  const loadData = async () => {
    if (!user) return;
    try {
      // Fetch apartments
      const aptRes = await fetch('/api/apartments');
      const aptData = await aptRes.json();
      if (aptData.success) {
        setApartments(aptData.apartments);
        if (aptData.apartments.length > 0 && !selectedApartment) {
          setSelectedApartment(aptData.apartments[0]);
        }
      }

      // Fetch bookings
      const bookRes = await fetch('/api/bookings');
      const bookData = await bookRes.json();
      if (bookData.success) {
        setBookings(bookData.bookings);
      }

      // Fetch expenses
      const expRes = await fetch('/api/expenses');
      const expData = await expRes.json();
      if (expData.success) {
        setExpenses(expData.expenses);
      }

      // If admin, fetch managers
      if (user.role === 'admin') {
        const mgrRes = await fetch('/api/managers');
        const mgrData = await mgrRes.json();
        if (mgrData.success) {
          setManagers(mgrData.managers);
        }
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setCurrentTab('apartments');
    }
  };

  // Profile update
  const handleUpdateProfile = async (data: any) => {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update profile');
    setUser((prev) => (prev ? { ...prev, ...result.user } : null));
  };

  // Apartment Save (Admin)
  const handleSaveApartment = async (aptData: any) => {
    const url = aptData.id ? `/api/apartments/${aptData.id}` : '/api/apartments';
    const method = aptData.id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aptData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to save apartment');

    await loadData();
  };

  // Apartment Delete (Admin)
  const handleDeleteApartment = async (aptId: number) => {
    const res = await fetch(`/api/apartments/${aptId}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete apartment');

    await loadData();
    if (selectedApartment?.id === aptId) {
      setSelectedApartment(apartments.find((a) => a.id !== aptId) || null);
    }
  };

  // Booking Save (Manager)
  const handleSaveBooking = async (bookingData: any) => {
    const method = bookingData.id ? 'PUT' : 'POST';
    const res = await fetch('/api/bookings', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to save booking');

    await loadData();
  };

  // Booking Delete (Manager)
  const handleDeleteBooking = async (bookingId: number) => {
    const res = await fetch(`/api/bookings?id=${bookingId}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete booking');

    await loadData();
  };

  // Expense Save (Manager)
  const handleSaveExpense = async (expenseData: any) => {
    const method = expenseData.id ? 'PUT' : 'POST';
    const res = await fetch('/api/expenses', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to save expense');

    await loadData();
  };

  // Expense Delete (Manager)
  const handleDeleteExpense = async (expenseId: number) => {
    const res = await fetch(`/api/expenses?id=${expenseId}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete expense');

    await loadData();
  };

  // Manager Actions (Admin)
  const handleToggleManagerActive = async (managerId: number, currentActive: boolean) => {
    const res = await fetch('/api/managers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        managerId,
        action: 'toggle_active',
        is_active: !currentActive,
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to toggle status');
    await loadData();
  };

  const handleUpgradeToAdmin = async (managerId: number) => {
    const res = await fetch('/api/managers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        managerId,
        action: 'upgrade_to_admin',
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to upgrade account');
    await loadData();
  };

  const handleAssignApartments = async (managerId: number, apartmentIds: number[]) => {
    const res = await fetch('/api/managers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        managerId,
        action: 'assign_apartments',
        apartment_ids: apartmentIds,
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to assign apartments');
    await loadData();
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-xs text-amber-400 font-medium tracking-wide uppercase">
            Loading Altamira...
          </span>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <AuthView onSuccess={(u) => setUser(u)} />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-full overflow-x-hidden">
      {/* Top Header */}
      <Navbar
        user={user}
        onOpenProfile={() => setCurrentTab('profile')}
        onOpenManagers={isAdmin ? () => setCurrentTab('team') : undefined}
      />

      {/* Main Container */}
      <main className="w-full max-w-lg mx-auto flex-1 px-3 sm:px-4 py-4 pb-24">
        {/* TAB 1: APARTMENTS */}
        {currentTab === 'apartments' && (
          <div className="flex flex-col gap-3.5">
            {/* Header banner */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {isAdmin ? 'Luxury Apartment Units' : 'Your Managed Apartments'}
                </h2>
                <p className="text-xs text-slate-400">
                  {apartments.length} unit{apartments.length !== 1 ? 's' : ''} available
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setApartmentModalState({ isOpen: true, apartment: null })}
                  className="flex items-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Unit</span>
                </button>
              )}
            </div>

            {/* Empty state for manager */}
            {!isAdmin && apartments.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
                <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-white mb-1">No Assigned Apartments</h3>
                <p className="text-xs text-slate-400">
                  An administrator has not assigned any apartments to your account yet. Please contact your admin.
                </p>
              </div>
            )}

            {/* Apartments Grid */}
            <div className="flex flex-col gap-3">
              {apartments.map((apt) => (
                <ApartmentCard
                  key={apt.id}
                  apartment={apt}
                  isAdmin={isAdmin}
                  onSelect={(selected) => {
                    setSelectedApartment(selected);
                    setCurrentTab('calendar');
                  }}
                  onEdit={
                    isAdmin
                      ? (edited) => setApartmentModalState({ isOpen: true, apartment: edited })
                      : undefined
                  }
                  onDelete={isAdmin ? handleDeleteApartment : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CALENDAR */}
        {currentTab === 'calendar' && (
          <CalendarView
            apartments={apartments}
            selectedApartment={selectedApartment || apartments[0] || null}
            onSelectApartment={(apt) => setSelectedApartment(apt)}
            bookings={bookings}
            currentUser={user}
            onOpenBookingModal={(data) => {
              setBookingModalState({
                isOpen: true,
                booking: data.booking,
                dates: data.dates,
                apartment: data.apartment,
                isViewOnly: data.isViewOnly,
              });
            }}
          />
        )}

        {/* TAB 3: EXPENSES */}
        {currentTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            apartments={apartments}
            currentUser={user}
            onOpenExpenseModal={(exp) => {
              setExpenseModalState({ isOpen: true, expense: exp });
            }}
          />
        )}

        {/* TAB 4: ANALYTICS & REPORTS */}
        {currentTab === 'analytics' && (
          <AnalyticsView apartments={apartments} currentUser={user} />
        )}

        {/* TAB 5: TEAM (Admin Only) */}
        {currentTab === 'team' && isAdmin && (
          <ManagerManagementView
            managers={managers}
            apartments={apartments}
            onToggleActive={handleToggleManagerActive}
            onUpgradeToAdmin={handleUpgradeToAdmin}
            onAssignApartments={handleAssignApartments}
          />
        )}

        {/* TAB 6: PROFILE */}
        {currentTab === 'profile' && (
          <ProfileView
            user={user}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={(tab) => setCurrentTab(tab)}
        isAdmin={isAdmin}
      />

      {/* Booking Modal */}
      {bookingModalState.isOpen && (
        <BookingModal
          isOpen={bookingModalState.isOpen}
          onClose={() => setBookingModalState({ isOpen: false })}
          apartment={bookingModalState.apartment || selectedApartment || apartments[0]}
          booking={bookingModalState.booking}
          initialDates={bookingModalState.dates || []}
          isViewOnly={bookingModalState.isViewOnly}
          onSave={handleSaveBooking}
          onDelete={handleDeleteBooking}
        />
      )}

      {/* Expense Modal */}
      {expenseModalState.isOpen && (
        <ExpenseModal
          isOpen={expenseModalState.isOpen}
          onClose={() => setExpenseModalState({ isOpen: false })}
          apartments={apartments}
          expense={expenseModalState.expense}
          onSave={handleSaveExpense}
          onDelete={handleDeleteExpense}
        />
      )}

      {/* Apartment Modal (Admin) */}
      {apartmentModalState.isOpen && isAdmin && (
        <ApartmentModal
          isOpen={apartmentModalState.isOpen}
          onClose={() => setApartmentModalState({ isOpen: false, apartment: null })}
          apartment={apartmentModalState.apartment}
          managers={managers.filter((m) => m.role === 'manager')}
          onSave={handleSaveApartment}
        />
      )}
    </div>
  );
}
