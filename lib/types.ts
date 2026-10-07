export type UserRole = 'admin' | 'manager';
export type PriceMode = 'fixed' | 'manual_input';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  assigned_apartments?: number[];
}

export interface Apartment {
  id: number;
  name: string;
  address?: string;
  price_mode: PriceMode;
  default_price: number;
  description?: string;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
  assigned_manager_ids?: number[];
  assigned_manager_names?: string[];
  active_bookings_count?: number;
  this_month_income?: number;
}

export interface Booking {
  id: number;
  apartment_id: number;
  apartment_name?: string;
  client_name: string;
  client_phone?: string;
  dates: string[];
  start_date: string;
  end_date: string;
  total_amount: number;
  rate_per_night: number;
  nights_count: number;
  notes?: string;
  booked_by?: number;
  booked_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: number;
  apartment_id: number;
  apartment_name?: string;
  amount: number;
  category: string;
  description?: string;
  expense_date: string;
  logged_by?: number;
  logged_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IndividualBookingLedgerItem {
  id: number;
  apartment_id: number;
  apartment_name: string;
  client_name: string;
  client_phone?: string;
  start_date: string;
  end_date: string;
  dates: string[];
  nights_count: number;
  rate_per_night: number;
  total_amount: number;
  booked_by_name?: string;
  notes?: string;
}

export interface IndividualExpenseLedgerItem {
  id: number;
  apartment_id: number;
  apartment_name: string;
  category: string;
  description?: string;
  amount: number;
  expense_date: string;
  logged_by_name?: string;
}

export interface ItemizedTransaction {
  id: string;
  type: 'booking' | 'expense';
  date: string;
  apartment_id: number;
  apartment_name: string;
  title: string;
  subtitle?: string;
  amount: number;
  raw_amount: number;
}

export interface DailyLedgerItem {
  date: string;
  apartment_id?: number;
  apartment_name?: string;
  income: number;
  expenses: number;
  net: number;
  nights_booked: number;
  bookings_count: number;
  details: {
    bookings: { client_name: string; amount: number; apartment_name: string }[];
    expenses: { description: string; category: string; amount: number; apartment_name: string }[];
  };
}

export interface AnalyticsSummary {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  total_nights_booked: number;
  total_bookings_count: number;
  occupancy_rate: number;
}

export interface AnalyticsApiResponse {
  success: boolean;
  range: {
    type: string;
    start_date: string;
    end_date: string;
    total_days: number;
  };
  summary: AnalyticsSummary;
  individual_bookings: IndividualBookingLedgerItem[];
  individual_expenses: IndividualExpenseLedgerItem[];
  itemized_ledger: ItemizedTransaction[];
  daily_ledger: DailyLedgerItem[];
}
