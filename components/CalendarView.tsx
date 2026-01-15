import React, { useState, useMemo } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { CalendarEvent } from '../types';
import EventModal from './EventModal';
import { getContrastColor, getSubjectCode } from '../utils/colorUtils';

const CalendarView: React.FC = () => {
  const { events, currentDate, viewMode, updateEvent, addEvent, deleteEvent, deleteEventsBySummary } = useCalendar();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState<Date | undefined>(undefined);

  // Generate week days based on current date
  const weekDays = useMemo(() => {
    const days = [];
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week

    for (let i = 0; i < 7; i++) {
      const next = new Date(curr);
      next.setDate(first + i);
      days.push(next);
    }
    return days;
  }, [currentDate]);

  // Extract unique subject codes for autocomplete (only suggest codes like COMP3122)
  const existingSubjects = useMemo(() => {
    const codes = events
      .map(e => getSubjectCode(e.summary))
      .filter(code => code && code !== 'default');

    return Array.from(new Set(codes)).sort();
  }, [events]);

  const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 to 22:00

  const getEventsForDay = (date: Date) => {
    return events.filter(e =>
      e.start.getDate() === date.getDate() &&
      e.start.getMonth() === date.getMonth() &&
      e.start.getFullYear() === date.getFullYear()
    );
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleGridClick = (date: Date, hour: number) => {
    const newDate = new Date(date);
    newDate.setHours(hour);
    newDate.setMinutes(0);
    setClickedDate(newDate);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Header Row */}
      <div className="grid grid-cols-8 border-b bg-gray-50 border-gray-200 shadow-sm z-10">
        <div className="p-2 border-r text-center text-gray-400 text-xs font-semibold py-4">TIME</div>
        {weekDays.map((day, i) => (
          <div key={i} className={`p-2 border-r text-center ${day.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''}`}>
            <div className={`text-xs font-bold uppercase ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-500'}`}>
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={`text-xl ${day.toDateString() === new Date().toDateString() ? 'text-blue-600 font-bold' : 'text-gray-800'}`}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="grid grid-cols-8 min-h-[800px]">
          {/* Time Column */}
          <div className="border-r bg-gray-50">
            {hours.map(h => (
              <div key={h} className="h-20 border-b text-xs text-gray-400 text-right pr-2 pt-2 relative">
                {h}:00
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {weekDays.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(day);
            return (
              <div key={dayIndex} className="border-r relative bg-white">
                {/* Grid Lines */}
                {hours.map(h => (
                  <div
                    key={h}
                    className="h-20 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleGridClick(day, h)}
                  ></div>
                ))}

                {/* Events Rendering */}
                {dayEvents.map((event) => {
                  const startHour = event.start.getHours();
                  const startMin = event.start.getMinutes();
                  const endHour = event.end.getHours();
                  const endMin = event.end.getMinutes();

                  // Calculate top offset (relative to 7am start)
                  const startTotalMinutes = (startHour * 60) + startMin;
                  const gridStartMinutes = 7 * 60;
                  const diffMinutes = startTotalMinutes - gridStartMinutes;

                  // 20px height = 60 mins? No, h-20 is 5rem = 80px usually in tailwind standard, let's assume 80px per hour
                  const PIXELS_PER_HOUR = 80;
                  const top = (diffMinutes / 60) * PIXELS_PER_HOUR;

                  const durationMinutes = ((endHour * 60) + endMin) - startTotalMinutes;
                  const height = (durationMinutes / 60) * PIXELS_PER_HOUR;

                  const bgColor = event.color || '#3b82f6';
                  const textColor = getContrastColor(bgColor);

                  return (
                    <div
                      key={event.id}
                      onClick={(e) => handleEventClick(e, event)}
                      className="absolute w-[95%] left-[2.5%] rounded px-2 py-1 text-xs cursor-pointer shadow-sm hover:shadow-md transition-shadow overflow-hidden border-l-4 border-black/20"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: bgColor,
                        color: textColor
                      }}
                    >
                      <div className="font-bold truncate">{event.summary}</div>
                      <div className="truncate opacity-90">{event.location}</div>
                      <div className="truncate opacity-75">{startHour}:{startMin < 10 ? '0' + startMin : startMin} - {endHour}:{endMin < 10 ? '0' + endMin : endMin}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(e) => {
          if (selectedEvent) updateEvent(e);
          else addEvent(e);
        }}
        onDelete={deleteEvent}
        onDeleteBatch={deleteEventsBySummary}
        initialEvent={selectedEvent}
        defaultDate={clickedDate}
        existingSubjects={existingSubjects}
      />
    </div>
  );
};

export default CalendarView;