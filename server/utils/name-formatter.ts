/**
 * Utility functions for formatting user names consistently
 */

/**
 * Converts "Last, First Middle" format to "First Middle Last" format
 * @param name The name string to format
 * @returns Properly formatted name in "First Last" format
 */
export function formatDisplayName(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'Anonymous User';
  }

  const trimmedName = name.trim();
  
  // If name contains a comma, it's likely in "Last, First" format
  if (trimmedName.includes(',')) {
    const parts = trimmedName.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      const lastName = parts[0];
      const firstName = parts[1];
      
      // Handle middle names or additional parts
      const additionalParts = parts.slice(2).join(' ').trim();
      
      if (additionalParts) {
        return `${firstName} ${additionalParts} ${lastName}`;
      } else {
        return `${firstName} ${lastName}`;
      }
    }
  }
  
  // If no comma, assume it's already in correct format
  return trimmedName;
}

/**
 * Formats name for SMS messages in "First Last" format
 * @param name The name string to format
 * @returns Name formatted for SMS
 */
export function formatNameForSMS(name: string): string {
  const formatted = formatDisplayName(name);
  
  // For SMS, we want just first and last name
  const parts = formatted.split(' ').filter(part => part.length > 0);
  
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }
  
  return formatted;
}