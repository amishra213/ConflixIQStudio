/**
 * Formats a Date object to MM-DD-YYYY format
 */
export function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

/**
 * Converts MM-DD-YYYY format to YYYY-MM-DD format for HTML input[type="date"]
 */
export function formatDateForInput(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [month, day, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

/**
 * Converts YYYY-MM-DD format from HTML input[type="date"] to MM-DD-YYYY format
 */
export function formatDateFromInput(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${month}-${day}-${year}`;
  } catch {
    return '';
  }
}
