export enum ViewMode {
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  LIST = 'LIST'
}

export interface CalendarEvent {
  id: string; // Internal ID
  uid: string; // ICS UID
  summary: string;
  location: string;
  description: string;
  start: Date;
  end: Date;
  isManual: boolean; // True if manually added by user
  color?: string;
  deletedAt?: Date | null; // Timestamp if soft deleted
}

export interface DayColumn {
  date: Date;
  events: CalendarEvent[];
}

export interface AnalyticsData {
  subject: string;
  hours: number;
  fill: string;
}