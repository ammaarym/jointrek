/**
 * Formats a date to a human-readable string (e.g., "May 21, 2023")
 * @param date The date to format
 * @returns The formatted date string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats a time to a human-readable string (e.g., "2:30 PM")
 * @param date The date containing the time to format
 * @returns The formatted time string
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats a date to a standard date string for input elements (e.g., "2023-05-21")
 * @param date The date to format
 * @returns The formatted date string for input elements
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Combines a date string and a time string into a single Date object
 * @param dateStr The date string (e.g., "2023-05-21")
 * @param timeStr The time string (e.g., "14:30")
 * @returns A Date object representing the combined date and time
 */
export function combineDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  const date = new Date();
  date.setFullYear(year, month - 1, day);
  date.setHours(hours, minutes, 0, 0);
  
  return date;
}