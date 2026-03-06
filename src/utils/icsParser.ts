export interface IcsEvent {
  date: string; // YYYY-MM-DD
  startTime: string | null; // HH:mm or null
  label: string;
}

/**
 * Parse ICS file content and extract VEVENT entries.
 * Returns array of events with date, optional time, and summary.
 */
export function parseIcs(content: string): IcsEvent[] {
  const events: IcsEvent[] = [];
  const blocks = content.split('BEGIN:VEVENT');

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0];
    if (!block) continue;

    const summary = extractField(block, 'SUMMARY');
    const dtstart = extractDtstart(block);

    if (!dtstart) continue;

    events.push({
      date: dtstart.date,
      startTime: dtstart.time,
      label: summary || 'Wedstrijd',
    });
  }

  return events;
}

function extractField(block: string, field: string): string | null {
  // Handle both "FIELD:value" and "FIELD;params:value" formats
  const regex = new RegExp(`^${field}[;:](.*)$`, 'm');
  const match = block.match(regex);
  if (!match) return null;
  // Remove any parameters before the actual value
  const value = match[1].includes(':') && match[0].includes(';')
    ? match[1].split(':').slice(1).join(':')
    : match[1];
  return value.replace(/\\n/g, ' ').replace(/\\,/g, ',').trim();
}

function extractDtstart(block: string): { date: string; time: string | null } | null {
  // Match DTSTART with various formats:
  // DTSTART:20250301T140000Z
  // DTSTART;VALUE=DATE:20250301
  // DTSTART;TZID=Europe/Amsterdam:20250301T140000
  const regex = /^DTSTART[;:](.*)$/m;
  const match = block.match(regex);
  if (!match) return null;

  let raw = match[1];
  // If there are parameters (;), get the value after the last colon
  if (match[0].startsWith('DTSTART;')) {
    const colonIdx = raw.indexOf(':');
    if (colonIdx >= 0) raw = raw.substring(colonIdx + 1);
  }

  raw = raw.trim();

  // Parse date: YYYYMMDD or YYYYMMDDTHHmmss or YYYYMMDDTHHmmssZ
  const dateMatch = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!dateMatch) return null;

  const date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;

  // Parse optional time
  const timeMatch = raw.match(/T(\d{2})(\d{2})(\d{2})/);
  const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : null;

  return { date, time };
}
