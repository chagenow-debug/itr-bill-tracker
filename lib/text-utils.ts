/**
 * Capitalize only the first word, keep rest lowercase
 * Example: "ALL CAPS TEXT" -> "All caps text"
 */
export function capitalizeFirstWordOnly(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const trimmed = text.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
