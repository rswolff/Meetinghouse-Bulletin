/**
 * Fetches ward data from a published Google Sheet CSV at build time.
 *
 * Expected sheet columns (row 1 must be a header row with these exact names):
 *   key          – Short identifier, no spaces (e.g. rockyview). Used as the DOM id.
 *   name         – Full display name (e.g. Rockyview Ward)
 *   displayTime  – Human-readable meeting time (e.g. 9:00 AM)
 *   windowStart  – Auto-redirect window start, minutes since midnight (e.g. 480 = 8:00 AM)
 *   windowEnd    – Auto-redirect window end,   minutes since midnight (e.g. 600 = 10:00 AM)
 *   url          – Full URL of the ward's announcement website
 *
 * Example sheet rows:
 *   key,name,displayTime,windowStart,windowEnd,url
 *   rockyview,Rockyview Ward,9:00 AM,480,600,https://rockyview.example.com
 *   arbourlake,Arbour Lake Ward,10:30 AM,600,690,https://arbourlake.example.com
 *   bowness,Bowness Ward,12:00 PM,690,780,https://www.bownessward.ca/announcements
 */

const REQUIRED_WARD_COLUMNS  = ['key', 'name', 'displayTime', 'windowStart', 'windowEnd', 'url'];
const REQUIRED_EVENT_COLUMNS = ['date', 'name', 'windowStart', 'windowEnd', 'url'];

// ── Placeholder data ───────────────────────────────────────────────────────────
// Used when SHEET_CSV_URL is not set or the fetch fails.
// Replace these URLs with production URLs when going live.
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

export async function fetchWardData() {
  const sheetUrl = import.meta.env.SHEET_CSV_URL;

  if (!sheetUrl) {
    console.warn('[data] SHEET_CSV_URL is not set — using placeholder ward data.');
    console.warn('[data] Copy .env.example to .env and add your Google Sheet CSV URL.');
    return PLACEHOLDER_WARDS;
  }

  try {
    const res = await fetch(sheetUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const csv = await res.text();
    const rows = parseCSV(csv);

    if (rows.length === 0) throw new Error('Sheet returned no data rows');

    const missing = REQUIRED_WARD_COLUMNS.filter(col => !(col in rows[0]));
    if (missing.length > 0) throw new Error(`Sheet is missing columns: ${missing.join(', ')}`);

    console.log(`[data] Loaded ${rows.length} ward(s) from Google Sheet.`);
    return rows;

  } catch (err) {
    console.error(`[data] Failed to fetch sheet data: ${err.message}`);
    console.error('[data] Falling back to placeholder ward data.');
    return PLACEHOLDER_WARDS;
  }
}

// ── Special events ─────────────────────────────────────────────────────────────

/**
 * Fetches special event sessions from a second published Google Sheet tab.
 *
 * Expected columns (row 1 must be a header row with these exact names):
 *   date         – YYYY-MM-DD (e.g. 2025-04-05)
 *   name         – Display name (e.g. General Conference)
 *   windowStart  – Session start, minutes since midnight (e.g. 540 = 9:00 AM)
 *   windowEnd    – Session end,   minutes since midnight (e.g. 660 = 11:00 AM)
 *   url          – URL to redirect to during this session
 *
 * Add one row per session. Multiple sessions on the same date are supported.
 *
 * Example rows:
 *   date,name,windowStart,windowEnd,url
 *   2025-04-05,General Conference,540,660,https://www.churchofjesuschrist.org/general-conference
 *   2025-04-05,General Conference,780,900,https://www.churchofjesuschrist.org/general-conference
 *   2025-04-06,General Conference,540,660,https://www.churchofjesuschrist.org/general-conference
 *   2025-04-06,General Conference,780,900,https://www.churchofjesuschrist.org/general-conference
 */
export async function fetchSpecialEvents() {
  const sheetUrl = import.meta.env.SPECIAL_EVENTS_CSV_URL;

  if (!sheetUrl) {
    console.warn('[data] SPECIAL_EVENTS_CSV_URL is not set — no special events loaded.');
    return [];
  }

  try {
    const res = await fetch(sheetUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const csv = await res.text();
    const rows = parseCSV(csv);

    if (rows.length === 0) {
      console.log('[data] Special events sheet is empty.');
      return [];
    }

    const missing = REQUIRED_EVENT_COLUMNS.filter(col => !(col in rows[0]));
    if (missing.length > 0) throw new Error(`Special events sheet missing columns: ${missing.join(', ')}`);

    console.log(`[data] Loaded ${rows.length} special event session(s) from Google Sheet.`);
    return rows;

  } catch (err) {
    console.error(`[data] Failed to fetch special events: ${err.message}`);
    return [];
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
