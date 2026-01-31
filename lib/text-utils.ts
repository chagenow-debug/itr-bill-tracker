/**
 * Capitalize first letter of each word (Title Case)
 * Example: "ALL CAPS TEXT" -> "All Caps Text"
 */
export function capitalizeFirstWordOnly(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const trimmed = text.trim();
  return trimmed
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
