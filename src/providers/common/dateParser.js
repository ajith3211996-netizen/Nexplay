/**
 * Shared Date & Episode Normalization Utility for Serial Providers (TamilDhool, TamilGun, Arivumani)
 * Supports expressions like 'today', 'yesterday', '15-09-2026', '15th Sep', '15/09/2026', etc.
 */

export const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

/**
 * Parses user or query date input into structured date tokens
 * @param {string} [input]
 * @returns {object|null}
 */
export function parseDateInput(input) {
  if (!input) return null;
  const raw = String(input).trim().toLowerCase();
  const now = new Date();

  let d = '';
  let m = '';
  let y = '';

  if (raw === 'today') {
    d = String(now.getDate()).padStart(2, '0');
    m = String(now.getMonth() + 1).padStart(2, '0');
    y = String(now.getFullYear());
  } else if (raw === 'yesterday') {
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    d = String(yest.getDate()).padStart(2, '0');
    m = String(yest.getMonth() + 1).padStart(2, '0');
    y = String(yest.getFullYear());
  } else {
    const numMatch = raw.match(/(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?/);
    if (numMatch) {
      d = String(numMatch[1]).padStart(2, '0');
      m = String(numMatch[2]).padStart(2, '0');
      y = numMatch[3] || String(now.getFullYear());
      if (y.length === 2) y = '20' + y;
    } else {
      const wordMatch = raw.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+(\d{2,4}))?/i);
      if (wordMatch) {
        d = String(wordMatch[1]).padStart(2, '0');
        const monStr = wordMatch[2].toLowerCase();
        m = MONTH_MAP[monStr] || MONTH_MAP[monStr.slice(0, 3)] || '09';
        y = wordMatch[3] || String(now.getFullYear());
        if (y.length === 2) y = '20' + y;
      }
    }
  }

  if (!d || !m) return null;

  const monthIdx = parseInt(m, 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] || 'sep';
  const shortYear = y.slice(-2);

  return {
    day: d,
    month: m,
    year: y,
    monthName,
    shortYear,
    formatted: `${d}-${m}-${y}`,
    formattedShort: `${d}-${m}-${shortYear}`,
    formattedText: `${d}th ${monthName}`
  };
}

export default parseDateInput;
