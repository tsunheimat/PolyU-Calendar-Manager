import { CalendarEvent } from '../types';
import { getSubjectColor } from '../utils/colorUtils';

// Helper to parse ICS date strings (e.g., 20230901T143000 or 20230901T143000Z)
const parseICSDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);
  let hour = 0;
  let minute = 0;
  let second = 0;

  if (dateStr.includes('T')) {
    const timePart = dateStr.split('T')[1];
    hour = parseInt(timePart.substring(0, 2), 10);
    minute = parseInt(timePart.substring(2, 4), 10);
    second = parseInt(timePart.substring(4, 6), 10);
  }

  // Rudimentary UTC handling: if ends in Z, treat as UTC, else assume local (often safer for uni schedules unless strictly defined)
  if (dateStr.endsWith('Z')) {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }
  
  return new Date(year, month, day, hour, minute, second);
};

// Robust unescaping for ICS text values
const unescapeICSValue = (str: string): string => {
    return str.replace(/\\([,;nN\\])/g, (match, char) => {
        if (char === 'n' || char === 'N') return '\n';
        return char;
    });
};

export const parseICSContent = (content: string): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const lines = content.split(/\r\n|\n|\r/);
  
  let inEvent = false;
  let currentEvent: Partial<CalendarEvent> = {};
  
  // Basic unfolding (handling lines that start with space as continuation)
  const unfoldedLines: string[] = [];
  lines.forEach(line => {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (unfoldedLines.length > 0) {
        unfoldedLines[unfoldedLines.length - 1] += line.trim();
      }
    } else {
      unfoldedLines.push(line.trim());
    }
  });

  for (const line of unfoldedLines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = { isManual: false };
    } else if (line === 'END:VEVENT') {
      inEvent = false;
      if (currentEvent.uid && currentEvent.start && currentEvent.summary) {
         // Fallbacks
         if (!currentEvent.end) {
             // Default to 1 hour if end missing
             currentEvent.end = new Date(currentEvent.start.getTime() + 60 * 60 * 1000);
         }
         currentEvent.id = currentEvent.uid; // Use UID as ID
         currentEvent.color = getSubjectColor(currentEvent.summary);
         events.push(currentEvent as CalendarEvent);
      }
      currentEvent = {};
    } else if (inEvent) {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) continue;
      
      let key = line.substring(0, separatorIndex);
      const val = line.substring(separatorIndex + 1);
      
      // Handle params like DTSTART;TZID=Asia/Hong_Kong
      if (key.includes(';')) {
        key = key.split(';')[0];
      }

      switch (key) {
        case 'UID':
          currentEvent.uid = val;
          break;
        case 'SUMMARY':
          currentEvent.summary = unescapeICSValue(val);
          break;
        case 'LOCATION':
          currentEvent.location = unescapeICSValue(val);
          break;
        case 'DESCRIPTION':
          currentEvent.description = unescapeICSValue(val);
          break;
        case 'DTSTART':
          currentEvent.start = parseICSDate(val);
          break;
        case 'DTEND':
          currentEvent.end = parseICSDate(val);
          break;
      }
    }
  }

  return events;
};

// Format Date to ICS string
const formatICSDate = (d: Date): string => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

// Strictly escape special characters to prevent ICS injection
const escapeICSValue = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/;/g, '\\;')   // Escape semicolons
    .replace(/,/g, '\\,')   // Escape commas
    .replace(/\n/g, '\\n')  // Escape newlines
    .replace(/\r/g, '');    // Remove CR
};

export const generateICSFile = (events: CalendarEvent[]): string => {
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//UniCal Manager//EN\r\n';
    
    events.forEach(event => {
        ics += 'BEGIN:VEVENT\r\n';
        ics += `UID:${event.uid}\r\n`;
        ics += `DTSTAMP:${formatICSDate(new Date())}\r\n`;
        ics += `DTSTART:${formatICSDate(event.start)}\r\n`;
        ics += `DTEND:${formatICSDate(event.end)}\r\n`;
        ics += `SUMMARY:${escapeICSValue(event.summary)}\r\n`;
        if (event.location) ics += `LOCATION:${escapeICSValue(event.location)}\r\n`;
        if (event.description) ics += `DESCRIPTION:${escapeICSValue(event.description)}\r\n`;
        ics += 'END:VEVENT\r\n';
    });
    
    ics += 'END:VCALENDAR';
    return ics;
};