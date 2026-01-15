import React from 'react';
import { useCalendar } from '../context/CalendarContext';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrashModal: React.FC<TrashModalProps> = ({ isOpen, onClose }) => {
  const { deletedEvents, restoreEvent, restoreEventsBySummary, permanentlyDeleteEvent, permanentlyDeleteEventsBySummary } = useCalendar();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
        <div className="bg-gray-800 p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Recycle Bin
          </h2>
          <button onClick={onClose} className="hover:bg-gray-700 rounded-full p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {deletedEvents.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              <p>No deleted items</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedEvents.map(event => (
                <div key={event.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-semibold text-gray-900 truncate">{event.summary || 'No Title'}</h3>
                    <p className="text-sm text-gray-500">{event.start.toLocaleDateString()} at {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">Deleted: {event.deletedAt?.toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => restoreEvent(event.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100 border border-green-200 text-sm font-medium transition-colors"
                      title="Restore"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      <span className="hidden sm:inline">Restore</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Restore ALL deleted events with summary "${event.summary}"?`)) {
                          restoreEventsBySummary(event.summary);
                        }
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100 border border-green-200 text-sm font-medium transition-colors"
                      title="Restore All Like This"
                    >
                      <span className="hidden sm:inline">Rest. All</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Permanently delete ALL deleted events with summary "${event.summary}"? This cannot be undone.`)) {
                          permanentlyDeleteEventsBySummary(event.summary);
                        }
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200 text-sm font-medium transition-colors"
                      title="Delete All Like This"
                    >
                      <span className="hidden sm:inline">Del. All</span>
                    </button>
                    <button
                      onClick={() => { if (confirm("Permanently delete this event? This cannot be undone.")) permanentlyDeleteEvent(event.id) }}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200 text-sm font-medium transition-colors"
                      title="Delete Permanently"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrashModal;