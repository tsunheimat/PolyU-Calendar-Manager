export const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export const getContrastColor = (hexcolor: string): string => {
  // If a leading # is provided, remove it
  if (hexcolor.slice(0, 1) === '#') {
    hexcolor = hexcolor.slice(1);
  }

  // Convert to RGB value
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);

  // Get YIQ ratio
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

  // Check contrast
  return (yiq >= 128) ? 'black' : 'white';
};

// Pastel palette for better UI
const PASTEL_COLORS = [
  '#cbd5e1', '#fca5a5', '#fdba74', '#fcd34d', '#86efac', 
  '#6ee7b7', '#5eead4', '#67e8f9', '#7dd3fc', '#93c5fd',
  '#a5b4fc', '#c4b5fd', '#d8b4fe', '#f0abfc', '#fda4af',
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399',
  '#22d3ee', '#818cf8', '#a78bfa', '#e879f9', '#fb7185'
];

/**
 * Extracts the subject code from a summary string.
 * Examples: 
 * "COMP3122 Lecture" -> "COMP3122"
 * "CHC1CM15P Tutorial" -> "CHC1CM15P"
 * "Maths Class" -> "Maths" (Fallback)
 */
export const getSubjectCode = (summary: string): string => {
  if (!summary) return 'default';
  
  const cleanSummary = summary.trim();

  // Regex for Subject Codes: 
  // Looks for 3-4 Uppercase letters followed by digits and optionally more letters/digits.
  // Example: COMP3122, EIE3333, CHC1CM15P
  const codeRegex = /\b([A-Z]{3,4}[0-9][A-Z0-9]{3,6})\b/;
  const match = cleanSummary.match(codeRegex);
  
  if (match) {
    return match[1];
  }

  // Fallback 1: "Code - Name" format
  if (cleanSummary.includes('-')) {
      const part = cleanSummary.split('-')[0].trim();
      if (part.length > 2 && part.length < 15) return part;
  }

  // Fallback 2: First word if it looks like a code (alphanumeric, > 3 chars)
  const firstWord = cleanSummary.split(' ')[0];
  if (firstWord.length > 3 && /[0-9]/.test(firstWord)) {
      return firstWord;
  }
  
  // Final Fallback: Use the whole summary string as the key
  return cleanSummary;
};

export const getSubjectColor = (subject: string): string => {
  // Use the extracted code as the key for coloring
  const key = getSubjectCode(subject);
  
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PASTEL_COLORS.length;
  return PASTEL_COLORS[index];
};