/**
 * Fetches ward and special event data from a single published Google Sheet CSV at build time.
 *
 * All rows live in one tab. A `type` column distinguishes ward rows from event rows.
 *
 * Required columns (row 1 must be a header row with these exact names):
 *   type         – "ward" or "event"
 *   key          – Ward only. Short identifier, no spaces (e.g. rockyview). Used as the DOM id.
 *   name         – Full display name (e.g. Rockyview Ward / General Conference)
 *   displayTime  – Ward only. Human-readable meeting time (e.g. 9:00 AM)
 *   windowStart  – Auto-redirect window start, minutes since midnight (e.g. 480 = 8:00 AM)
 *   windowEnd    – Auto-redirect window end,   minutes since midnight (e.g. 600 = 10:00 AM)
 *   url          – Full URL for the ward or event
 *   date         – Event only. YYYY-MM-DD (e.g. 2025-04-05)
 *
 * Example sheet rows:
 *   type,key,name,displayTime,windowStart,windowEnd,url,date
 *   ward,rockyview,Rockyview Ward,9:00 AM,480,600,https://rockyview.example.com,
 *   ward,arbourlake,Arbour Lake Ward,10:30 AM,600,690,https://arbourlake.example.com,
 *   ward,bowness,Bowness Ward,12:00 PM,690,780,https://www.bownessward.ca/announcements,
 *   event,,General Conference,,540,660,https://www.churchofjesuschrist.org/general-conference,2025-04-05
 *   event,,General Conference,,780,900,https://www.churchofjesuschrist.org/general-conference,2025-04-05
 */

const REQUIRED_COLUMNS = ['type', 'name', 'windowStart', 'windowEnd', 'url'];

// ── Placeholder data ───────────────────────────────────────────────────────────
// Used when SHEET_CSV_URL is not set or the fetch fails.
const PLACEHOLDER_WARDS = [
  {
    key:         'rockyview',
    name:        'Rockyview Ward',
    displayTime: '9:00 AM',
    windowStart: '480',   // 8:00 AM
    windowEnd:   '600',   // 10:00 AM
    url:         'https://rockyview.example.com',
  },
  {
    key:         'arbourlake',
    name:        'Arbour Lake Ward',
    displayTime: '10:30 AM',
    windowStart: '600',   // 10:00 AM
    windowEnd:   '690',   // 11:30 AM
    url:         'https://arbourlake.example.com',
  },
  {
    key:         'bowness',
    name:        'Bowness Ward',
    displayTime: '12:00 PM',
    windowStart: '690',   // 11:30 AM
    windowEnd:   '780',   // 1:00 PM
    url:         'https://www.bownessward.ca/announcements',
  },
];

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Fetches all sheet data from SHEET_CSV_URL and returns ward rows and event rows.
 * Falls back to placeholder wards and no events if the URL is unset or the fetch fails.
 */
export async function fetchSheetData() {
  const sheetUrl = import.meta.env.SHEET_CSV_URL;

  if (!sheetUrl) {
    console.warn('[data] SHEET_CSV_URL is not set — using placeholder ward data.');
    console.warn('[data] Copy .env.example to .env and add your Google Sheet CSV URL.');
    return { wards: PLACEHOLDER_WARDS, specialEvents: [] };
  }

  try {
    const res = await fetch(sheetUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const csv = await res.text();
    const rows = parseCSV(csv);

    if (rows.length === 0) throw new Error('Sheet returned no data rows');

    const missing = REQUIRED_COLUMNS.filter(col => !(col in rows[0]));
    if (missing.length > 0) throw new Error(`Sheet is missing columns: ${missing.join(', ')}`);

    const wards         = rows.filter(r => r.type === 'ward');
    const specialEvents = rows.filter(r => r.type === 'event');

    console.log(`[data] Loaded ${wards.length} ward(s) and ${specialEvents.length} special event session(s).`);
    return { wards, specialEvents };

  } catch (err) {
    console.error(`[data] Failed to fetch sheet data: ${err.message}`);
    console.error('[data] Falling back to placeholder ward data.');
    return { wards: PLACEHOLDER_WARDS, specialEvents: [] };
  }
}

// ── CSV parser ─────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map(h => h.trim());

  return lines
    .slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = splitCSVLine(line);
      return Object.fromEntries(
        headers.map((header, i) => [header, (values[i] ?? '').trim()])
      );
    });
}

// Handles quoted values so URLs with commas in query strings parse correctly.
function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
