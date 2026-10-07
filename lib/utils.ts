export function formatNaira(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  if (isNaN(num)) return '₦0';
  return '₦' + Math.round(num).toLocaleString('en-NG');
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  // 0 is Sunday, 1 is Monday, etc. Adjust so Monday is 0
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const EXPENSE_CATEGORIES = [
  'Power & Diesel Generator',
  'Housekeeping & Laundry',
  'Repairs & Maintenance',
  'Internet & Cable TV (DSTV)',
  'Water & Utilities',
  'Guest Supplies & Toiletries',
  'Facility Security',
  'Miscellaneous',
];
