
import React, { useState, useEffect } from 'react';
import { useCalendar } from '../context/CalendarContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, url }) => {
  const { regenerateCalendarLink, loading } = useCalendar();
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);

  useEffect(() => {
    setCurrentUrl(url);
  }, [url]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (confirm("Are you sure? This will invalidate the previous link. Devices using the old link will stop syncing.")) {
        const newUrl = await regenerateCalendarLink();
        if (newUrl) {
            setCurrentUrl(newUrl);
        }
    }
  };

  // Create webcal link (replace https:// with webcal://)
  const webcalUrl = currentUrl.replace(/^https?:\/\//, 'webcal://');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            Subscribe to Calendar
          </h2>
          <button onClick={onClose} className="hover:bg-indigo-700 rounded-full p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Use this private link to subscribe to your university schedule in external calendar apps (Google Calendar, Outlook, Apple Calendar).
          </p>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">One-Click Subscribe (Webcal)</label>
            <div className="flex gap-2">
                <input 
                    readOnly
                    value={webcalUrl}
                    className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-mono"
                    onClick={(e) => e.currentTarget.select()}
                />
                <button 
                    onClick={handleCopy}
                    className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${copied ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
             <p className="text-xs text-gray-400">Works best with Apple Calendar and Outlook.</p>
          </div>
          
           <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Private HTTPS URL</label>
            <div className="flex gap-2">
                <input 
                    readOnly
                    value={currentUrl}
                    className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-mono"
                    onClick={(e) => e.currentTarget.select()}
                />
                 <button 
                    onClick={() => {navigator.clipboard.writeText(currentUrl); setCopied(true); setTimeout(() => setCopied(false), 2000);}}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gray-500 hover:bg-gray-600"
                >
                    Copy
                </button>
            </div>
             <p className="text-xs text-gray-400">Use this for Google Calendar "Add by URL".</p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="ml-3">
                    <p className="text-xs text-yellow-700">
                        This link is private. Do not share it publicly.
                        Changes made here will automatically sync to this link (approx. every few minutes).
                    </p>
                </div>
            </div>
          </div>

          <div className="pt-2 border-t flex justify-end">
              <button 
                onClick={handleRegenerate}
                disabled={loading}
                className="text-xs text-red-600 hover:text-red-800 underline flex items-center"
              >
                {loading ? 'Regenerating...' : 'Reset / Regenerate Link'}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
