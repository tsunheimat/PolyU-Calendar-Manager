import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { getSubjectColor, getSubjectCode } from '../utils/colorUtils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  initialEvent?: CalendarEvent | null;
  defaultDate?: Date;
  existingSubjects?: string[];
  onDeleteBatch?: (summary: string) => void;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, onDeleteBatch, initialEvent, defaultDate, existingSubjects = [] }) => {
  const [summary, setSummary] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  // Calculate preview color: if editing and title matches, keep orig color, else generate new
  const previewColor = (initialEvent && summary === initialEvent.summary)
    ? initialEvent.color
    : getSubjectColor(summary);

  const detectedCode = getSubjectCode(summary);

  useEffect(() => {
    if (initialEvent) {
      setSummary(initialEvent.summary);
      setLocation(initialEvent.location || '');
      setDescription(initialEvent.description || '');
      // Input datetime-local needs YYYY-MM-DDThh:mm format
      setStart(toLocalISO(initialEvent.start));
      setEnd(toLocalISO(initialEvent.end));
    } else {
      const d = defaultDate || new Date();
      d.setSeconds(0, 0);
      const e = new Date(d.getTime() + 60 * 60 * 1000);
      setSummary('');
      setLocation('');
      setDescription('');
      setStart(toLocalISO(d));
      setEnd(toLocalISO(e));
    }
  }, [initialEvent, defaultDate, isOpen]);

  const toLocalISO = (date: Date) => {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) +
      ':' + pad(date.getMinutes());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startDate = new Date(start);
    const endDate = new Date(end);

    const event: CalendarEvent = {
      id: initialEvent ? initialEvent.id : crypto.randomUUID(),
      uid: initialEvent ? initialEvent.uid : crypto.randomUUID(),
      summary,
      location,
      description,
      start: startDate,
      end: endDate,
      isManual: true, // Any edit/create via UI makes it manual/protected
      color: previewColor,
    };
    onSave(event);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-brand-500 p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold">{initialEvent ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={onClose} className="hover:bg-brand-600 rounded-full p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject / Summary</label>
            <div className="flex gap-2 items-center mt-1 relative">
              <div
                className="w-6 h-6 rounded-full border border-gray-200 shadow-sm flex-shrink-0"
                style={{ backgroundColor: previewColor }}
                title={`Color generated from: ${detectedCode}`}
              ></div>
              <input
                required
                type="text"
                list="subjects-list"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                className="block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                placeholder="e.g. COMP3122 Lecture"
              />
              <datalist id="subjects-list">
                {existingSubjects.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            {summary && detectedCode !== summary && detectedCode !== 'default' && (
              <p className="text-xs text-gray-500 mt-1 ml-8">Detected Subject Code: <span className="font-mono bg-gray-100 px-1 rounded">{detectedCode}</span></p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                required
                type="datetime-local"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                required
                type="datetime-local"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-brand-500 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            {initialEvent && onDelete && (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => { onDelete(initialEvent.id); onClose(); }}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                >
                  Delete
                </button>
                {onDeleteBatch && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete ALL events with summary "${initialEvent.summary}"?`)) {
                        onDeleteBatch(initialEvent.summary);
                        onClose();
                      }
                    }}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 border border-red-200"
                    title="Delete all events with this summary"
                  >
                    Delete All
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;