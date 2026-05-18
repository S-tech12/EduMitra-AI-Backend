/**
 * Date calculation helpers for the Smart Timetable Generator
 */

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date object set to midnight
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Month is 0-indexed in JS Date
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Gets today's date with time set to midnight
 */
export function getTodayMidnight(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Adds a specific number of days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculates the number of days between two dates (inclusive or exclusive)
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gets the day name (e.g., "Monday") from a Date or date string
 */
export function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Checks if a date string is a valid exam date (today to 30 days from today)
 */
export function isValidExamDate(dateStr: string): { isValid: boolean; reason?: string } {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { isValid: false, reason: 'Invalid date format. Expected YYYY-MM-DD.' };
  }

  const examDate = parseDateString(dateStr);
  const today = getTodayMidnight();
  const maxDate = addDays(today, 30);

  if (examDate.getTime() < today.getTime()) {
    return { isValid: false, reason: 'Exam date cannot be in the past.' };
  }

  if (examDate.getTime() > maxDate.getTime()) {
    return { isValid: false, reason: 'Exam date must be within 30 days from today.' };
  }

  return { isValid: true };
}
