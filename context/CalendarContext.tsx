
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CalendarEvent, ViewMode } from '../types';
import { parseICSContent, generateICSFile } from '../services/icsService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

interface CalendarContextType {
  events: CalendarEvent[]; // Active events
  deletedEvents: CalendarEvent[]; // Soft-deleted events
  viewMode: ViewMode;
  currentDate: Date;
  loading: boolean;
  error: string | null;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void; // Soft delete
  restoreEvent: (id: string) => void; // Recover
  permanentlyDeleteEvent: (id: string) => void; // Hard delete
  importICS: (content: string) => void;
  exportICS: () => void;
  publishICS: (silent?: boolean) => Promise<string | null>;
  regenerateCalendarLink: () => Promise<string | null>;
  setViewMode: (mode: ViewMode) => void;
  setCurrentDate: (date: Date) => void;
  clearAll: () => void;
  calendarFilename: string | null;
  deleteEventsBySummary: (summary: string) => void;
  restoreEventsBySummary: (summary: string) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [deletedEvents, setDeletedEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.WEEK);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarFilename, setCalendarFilename] = useState<string | null>(null);

  // Use a ref to track events for the background sync to avoid closure issues
  const eventsRef = useRef<CalendarEvent[]>([]);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const mapFromDb = (e: any): CalendarEvent => ({
    id: e.id,
    uid: e.uid,
    summary: e.summary,
    location: e.location,
    description: e.description,
    start: new Date(e.start_time),
    end: new Date(e.end_time),
    isManual: e.is_manual,
    color: e.color,
    deletedAt: e.deleted_at ? new Date(e.deleted_at) : null
  });

  const mapToDb = (e: CalendarEvent) => ({
    id: e.id,
    user_id: user?.id,
    uid: e.uid,
    summary: e.summary,
    location: e.location,
    description: e.description,
    start_time: e.start.toISOString(),
    end_time: e.end.toISOString(),
    is_manual: e.isManual,
    color: e.color,
    deleted_at: e.deletedAt ? e.deletedAt.toISOString() : null
  });

  const fetchCalendarMeta = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('user_calendars').select('filename').eq('user_id', user.id).single();
    if (data?.filename) {
      setCalendarFilename(data.filename);
    }
  }, [user]);

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase.from('events').select('*');
      if (dbError) {
        console.error("Error fetching events:", dbError);
        setError(dbError.message || "Failed to fetch events.");
      } else {
        const allEvents = (data || []).map(mapFromDb);
        const active = allEvents.filter(e => !e.deletedAt);
        const deleted = allEvents.filter(e => e.deletedAt);
        setEvents(active);
        setDeletedEvents(deleted);
        eventsRef.current = active;
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchCalendarMeta();
    }
  }, [user, fetchEvents, fetchCalendarMeta]);

  const syncToStorage = async (currentEvents: CalendarEvent[], targetFilename?: string) => {
    if (!user) return;

    let filename = targetFilename || calendarFilename;

    // If we don't have a filename yet, check DB again or wait for publish
    if (!filename) {
      const { data } = await supabase.from('user_calendars').select('filename').eq('user_id', user.id).single();
      if (data?.filename) {
        filename = data.filename;
        setCalendarFilename(filename);
      } else {
        return; // No active subscription to sync to
      }
    }

    try {
      const activeEvents = currentEvents.filter(e => !e.deletedAt);
      const icsContent = generateICSFile(activeEvents);
      const blob = new Blob([icsContent], { type: 'text/calendar' });

      await supabase.storage
        .from('calendars')
        .upload(filename, blob, {
          contentType: 'text/calendar',
          upsert: true,
          cacheControl: '60'
        });
    } catch (e) {
      console.warn("Background sync error:", e);
    }
  };

  const addEvent = useCallback(async (event: CalendarEvent) => {
    if (!user) return;
    const newEvents = [...events, event];
    setEvents(newEvents);

    const { error } = await supabase.from('events').insert([mapToDb(event)]);
    if (error) {
      setError("Failed to save event: " + error.message);
      fetchEvents();
    } else {
      syncToStorage(newEvents);
    }
  }, [events, fetchEvents, user, calendarFilename]);

  const updateEvent = useCallback(async (updatedEvent: CalendarEvent) => {
    if (!user) return;
    const newEvents = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    setEvents(newEvents);

    const { error } = await supabase.from('events').update(mapToDb(updatedEvent)).eq('id', updatedEvent.id);
    if (error) {
      setError("Failed to update event: " + error.message);
      fetchEvents();
    } else {
      syncToStorage(newEvents);
    }
  }, [events, fetchEvents, user, calendarFilename]);

  const deleteEvent = useCallback(async (id: string) => {
    if (!user) return;

    const eventToDelete = events.find(e => e.id === id);
    if (!eventToDelete) return;

    const newEvents = events.filter(e => e.id !== id);
    const softDeletedEvent = { ...eventToDelete, deletedAt: new Date() };
    const newDeletedEvents = [...deletedEvents, softDeletedEvent];

    setEvents(newEvents);
    setDeletedEvents(newDeletedEvents);

    const { error } = await supabase
      .from('events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setError("Failed to delete event: " + error.message);
      fetchEvents();
    } else {
      syncToStorage(newEvents);
    }
  }, [events, deletedEvents, fetchEvents, user, calendarFilename]);

  const deleteEventsBySummary = useCallback(async (summary: string) => {
    if (!user) return;

    const eventsToDelete = events.filter(e => e.summary === summary);
    if (eventsToDelete.length === 0) return;

    const newEvents = events.filter(e => e.summary !== summary);
    const softDeletedEvents = eventsToDelete.map(e => ({ ...e, deletedAt: new Date() }));
    const newDeletedEvents = [...deletedEvents, ...softDeletedEvents];

    setEvents(newEvents);
    setDeletedEvents(newDeletedEvents);

    const { error } = await supabase
      .from('events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('summary', summary)
      .is('deleted_at', null);

    if (error) {
      setError("Failed to delete events: " + error.message);
      fetchEvents();
    } else {
      syncToStorage(newEvents);
    }
  }, [events, deletedEvents, fetchEvents, user, calendarFilename]);

  const restoreEvent = useCallback(async (id: string) => {
    if (!user) return;

    const eventToRestore = deletedEvents.find(e => e.id === id);
    if (!eventToRestore) return;

    const newDeletedEvents = deletedEvents.filter(e => e.id !== id);
    const restoredEvent = { ...eventToRestore, deletedAt: null };
    const newEvents = [...events, restoredEvent];

    setDeletedEvents(newDeletedEvents);
    setEvents(newEvents);

    const { error } = await supabase
      .from('events')
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) {
      setError("Failed to restore event: " + error.message);
      fetchEvents();
    } else {
      syncToStorage(newEvents);
    }
  }, [events, deletedEvents, fetchEvents, user, calendarFilename]);

  const restoreEventsBySummary = useCallback(async (summary: string) => {
    if (!user) return;

    const eventsToRestore = deletedEvents.filter(e => e.summary === summary);
    if (eventsToRestore.length === 0) return;

    const newDeletedEvents = deletedEvents.filter(e => e.summary !== summary);
    const restoredEvents = eventsToRestore.map(e => ({ ...e, deletedAt: null }));
    const newEvents = [...events, ...restoredEvents];

    setDeletedEvents(newDeletedEvents);
    setEvents(newEvents);

    const { error } = await supabase
      .from('events')
      .update({ deleted_at: null })
      .eq('summary', summary)
      .not('deleted_at', 'is', null);

    if (error) {
      setError("Failed to restore events: " + error.message);
      fetchEvents();
    } else {
      syncToStorage(newEvents);
    }
  }, [events, deletedEvents, fetchEvents, user, calendarFilename]);

  const permanentlyDeleteEvent = useCallback(async (id: string) => {
    if (!user) return;
    const newDeletedEvents = deletedEvents.filter(e => e.id !== id);
    setDeletedEvents(newDeletedEvents);
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      setError("Failed to permanently delete: " + error.message);
      fetchEvents();
    }
  }, [deletedEvents, fetchEvents, user]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    setEvents([]);
    const { error } = await supabase.from('events')
      .update({ deleted_at: new Date().toISOString() })
      .is('deleted_at', null);

    if (error) {
      setError("Failed to clear events: " + error.message);
      fetchEvents();
    } else {
      fetchEvents();
      syncToStorage([]);
    }
  }, [user, fetchEvents, calendarFilename]);

  const importICS = useCallback(async (content: string) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const newEventsRaw = parseICSContent(content);
      const { data: manualData } = await supabase.from('events').select('*').eq('is_manual', true);
      const manualEvents = (manualData || []).map(mapFromDb);
      const manualUids = new Set(manualEvents.map(e => e.uid));

      const dbEventsToInsert = newEventsRaw
        .filter(e => !manualUids.has(e.uid))
        .map(e => ({
          ...mapToDb(e),
          id: crypto.randomUUID(),
          is_manual: false,
          deleted_at: null
        }));

      await supabase.from('events').delete().eq('is_manual', false);

      if (dbEventsToInsert.length > 0) {
        await supabase.from('events').insert(dbEventsToInsert);
      }
      await fetchEvents();

      // Immediately sync to storage after import to keep calendar up to date
      const { data: allEvents } = await supabase.from('events').select('*');
      if (allEvents) {
        const active = allEvents.map(mapFromDb).filter(e => !e.deletedAt);
        syncToStorage(active);
      }
    } catch (err: any) {
      console.error("Import failed:", err);
      setError("Import failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [fetchEvents, user, calendarFilename]);

  const exportICS = useCallback(() => {
    const icsContent = generateICSFile(events);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'university_schedule.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [events]);

  const publishICS = useCallback(async (silent = false): Promise<string | null> => {
    if (!user) return null;
    if (!silent) setLoading(true);
    try {
      let filename = calendarFilename;

      // If no filename in state, try DB, then create new
      if (!filename) {
        const { data } = await supabase.from('user_calendars').select('filename').eq('user_id', user.id).single();
        if (data?.filename) {
          filename = data.filename;
        } else {
          filename = `private-${crypto.randomUUID()}.ics`;
          const { error: insertError } = await supabase.from('user_calendars').insert([{ user_id: user.id, filename }]);
          if (insertError) throw insertError;
        }
        setCalendarFilename(filename);
      }

      const icsContent = generateICSFile(events);
      const blob = new Blob([icsContent], { type: 'text/calendar' });

      const { error: uploadError } = await supabase.storage
        .from('calendars')
        .upload(filename, blob, {
          contentType: 'text/calendar',
          upsert: true,
          cacheControl: '60'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('calendars')
        .getPublicUrl(filename);

      return publicUrl;
    } catch (err: any) {
      console.error("Publish failed:", err);
      if (!silent) setError(err.message || "Unknown error");
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [events, user, calendarFilename]);

  const regenerateCalendarLink = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    setLoading(true);
    try {
      const oldFilename = calendarFilename; // Capture current filename before generating new one
      const newFilename = `private-${crypto.randomUUID()}.ics`;

      // Update the filename mapping in the database
      const { error: dbError } = await supabase.from('user_calendars')
        .upsert({ user_id: user.id, filename: newFilename, created_at: new Date().toISOString() });

      if (dbError) throw dbError;

      setCalendarFilename(newFilename);

      // Immediately upload content to the new filename location
      const icsContent = generateICSFile(events);
      const blob = new Blob([icsContent], { type: 'text/calendar' });

      const { error: uploadError } = await supabase.storage
        .from('calendars')
        .upload(newFilename, blob, {
          contentType: 'text/calendar',
          upsert: true,
          cacheControl: '60'
        });

      if (uploadError) throw uploadError;

      // Delete the old file from storage to clean up
      if (oldFilename) {
        const { error: deleteError } = await supabase.storage
          .from('calendars')
          .remove([oldFilename]);

        if (deleteError) {
          console.warn('Failed to delete old calendar file:', deleteError);
        }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('calendars')
        .getPublicUrl(newFilename);

      return publicUrl;
    } catch (err: any) {
      console.error("Regenerate failed:", err);
      setError(err.message || "Failed to regenerate link");
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, events, calendarFilename]);

  return (
    <CalendarContext.Provider value={{
      events,
      deletedEvents,
      viewMode,
      currentDate,
      loading,
      error,
      addEvent,
      updateEvent,
      deleteEvent,
      restoreEvent,
      permanentlyDeleteEvent,
      importICS,
      exportICS,
      publishICS,
      regenerateCalendarLink,
      setViewMode,
      setCurrentDate,
      clearAll,
      calendarFilename,
      deleteEventsBySummary,
      restoreEventsBySummary
    }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) throw new Error("useCalendar must be used within a CalendarProvider");
  return context;
};
