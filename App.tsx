

import React, { useState, useRef } from 'react';
import { CalendarProvider, useCalendar } from './context/CalendarContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import CalendarView from './components/CalendarView';
import Analytics from './components/Analytics';
import ShareModal from './components/ShareModal';
import TrashModal from './components/TrashModal';
import ApiSettingsModal from './components/ApiSettingsModal';
import Auth from './components/Auth';
import TermsOfServiceModal from './components/TermsOfServiceModal';
import { isMockMode } from './services/supabaseClient';
import { GitHubLink } from './components/GitHubLink';

const TopBar: React.FC = () => {
  const { importICS, exportICS, publishICS, currentDate, setCurrentDate, clearAll, loading, error, deletedEvents, calendarFilename } = useCalendar();
  const { signOut, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showApi, setShowApi] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showTos, setShowTos] = useState(false);

  // Check for API Access feature flag (Vite environment variable)
  // @ts-ignore
  const enableApiAccess = import.meta.env?.VITE_ENABLE_API_ACCESS === 'true';
  // @ts-ignore
  const enableTos = import.meta.env?.VITE_SHOW_TOS === 'true';

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        importICS(content);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
    }
  };

  const handleSubscribe = async () => {
    setIsPublishing(true);
    const url = await publishICS();
    setIsPublishing(false);
    if (url) {
      setShareUrl(url);
      setShowShare(true);
    }
  };

  const shiftDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-20 relative">
        <div className="flex items-center space-x-4">
          <div className="bg-brand-600 text-white p-2 rounded-lg">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">PolyU <span className="text-brand-600">Calendar</span></h1>

          <div className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border tracking-wide uppercase ${!isMockMode
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
            }`} title={!isMockMode ? "Connected to Supabase Cloud" : "Local Storage Mode (Data not synced)"}>
            <div className={`w-1.5 h-1.5 rounded-full ${!isMockMode ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
            <span>{!isMockMode ? 'Cloud' : 'Local'}</span>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-2"></div>

          <div className="flex items-center bg-gray-100 rounded-md p-1 space-x-1">
            <button onClick={() => shiftDate(-7)} className="p-1 hover:bg-white rounded-md shadow-sm transition-all text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={handleToday} className="px-3 text-sm font-medium text-gray-700 hover:text-black">Today</button>
            <button onClick={() => shiftDate(7)} className="p-1 hover:bg-white rounded-md shadow-sm transition-all text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <span className="text-sm font-medium text-gray-500">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          {(loading || isPublishing) && (
            <div className="ml-4 flex items-center text-xs text-brand-600 font-medium animate-pulse">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isPublishing ? 'Publishing...' : 'Syncing...'}
            </div>
          )}
          {calendarFilename && !loading && !isPublishing && (
            <div className="ml-4 flex items-center text-xs text-green-600 font-medium opacity-70">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
              Live Sync Active
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".ics"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            <span>Import</span>
          </button>

          <button
            onClick={exportICS}
            className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>Export</span>
          </button>

          <button
            onClick={handleSubscribe}
            className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors text-sm font-medium ${calendarFilename ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'}`}
            title="Get Subscription Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            <span>{calendarFilename ? 'My Subscription' : 'Subscribe'}</span>
          </button>

          <div className="h-6 w-px bg-gray-300 mx-2"></div>

          {enableApiAccess && (
            <button
              onClick={() => setShowApi(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              title="API Settings (n8n)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </button>
          )}

          {enableTos && (
            <button
              onClick={() => setShowTos(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              title="Terms of Service"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
          )}



          <GitHubLink />

          <button
            onClick={() => setShowTrash(true)}
            className={`p-2 rounded-full hover:bg-gray-100 ${deletedEvents.length > 0 ? 'text-gray-600' : 'text-gray-400'}`}
            title="Recycle Bin"
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {deletedEvents.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {deletedEvents.length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setShowAnalytics(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            title="Analytics"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </button>

          <button
            onClick={() => { if (confirm("Are you sure you want to clear all events?")) clearAll() }}
            className="p-2 text-red-400 hover:bg-red-50 rounded-full hover:text-red-600"
            title="Clear All Events"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>

          <div className="h-6 w-px bg-gray-300 mx-2"></div>

          <button
            onClick={() => { if (confirm("Sign out?")) signOut(); }}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors"
            title="Sign Out"
          >
            <span className="truncate max-w-[100px]">{user?.email?.split('@')[0]}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-b border-red-200 p-4 relative">
          <div className="flex items-center text-red-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-medium">Error:</span> <span className="ml-1">{error}</span>
          </div>
        </div>
      )}

      {showAnalytics && <Analytics onClose={() => setShowAnalytics(false)} />}
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} url={shareUrl} />
      <ApiSettingsModal isOpen={showApi} onClose={() => setShowApi(false)} />
      <TermsOfServiceModal isOpen={showTos} onClose={() => setShowTos(false)} />
      <TrashModal isOpen={showTrash} onClose={() => setShowTrash(false)} />
    </>
  );
};

import UpdatePasswordModal from './components/UpdatePasswordModal';

const MainApp: React.FC = () => {
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const { session, loading, authEvent } = useAuth();

  // Check for password recovery event
  React.useEffect(() => {
    if (authEvent === 'PASSWORD_RECOVERY') {
      setShowUpdatePassword(true);
    }
  }, [authEvent]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <CalendarProvider>
      <div className="flex flex-col h-screen bg-gray-50">
        <TopBar />
        <CalendarView />
        <UpdatePasswordModal isOpen={showUpdatePassword} onClose={() => setShowUpdatePassword(false)} />
      </div>
    </CalendarProvider>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
