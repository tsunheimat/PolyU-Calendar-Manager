
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiKey {
  id: string;
  label: string;
  key_value: string;
  created_at: string;
  last_used_at: string | null;
}

const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchKeys();
    }
  }, [isOpen, user]);

  const fetchKeys = async () => {
    setLoading(true);
    const { data } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false });
    if (data) setKeys(data);
    setLoading(false);
  };

  const generateKey = async () => {
    if (!user) return;
    const key = `sk_uc_${crypto.randomUUID().replace(/-/g, '')}`;

    const { error } = await supabase.from('api_keys').insert([{
      user_id: user.id,
      key_value: key,
      label: 'n8n Integration'
    }]);

    if (!error) {
      setNewKey(key);
      fetchKeys();
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Are you sure? This will break any n8n workflows using this key.')) return;
    await supabase.from('api_keys').delete().eq('id', id);
    fetchKeys();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gray-800 p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            API Access (n8n)
          </h2>
          <button onClick={onClose} className="hover:bg-gray-700 rounded-full p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 bg-gray-50 max-h-[70vh] overflow-y-auto">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6">
            <h3 className="font-bold text-blue-800 text-sm mb-2">How to use with n8n (Vercel API)</h3>
            <p className="text-sm text-blue-700 mb-2">
              Use the Vercel-hosted API to manage your events. This endpoint <strong>automatically regenerates and syncs your ICS file</strong> upon changes.
            </p>
            <p className="text-sm text-blue-700">
              <strong>Endpoint:</strong> <code className="bg-white px-1 rounded">POST /api/calendar</code>
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Header:</strong> <code className="bg-white px-1 rounded">x-api-key: [YOUR_KEY_BELOW]</code>
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Body (Action):</strong> <br />
              Create: <code>{`{ "action": "create", "event": { "summary": "...", "start": "..." } }`}</code><br />
              Search: <code>{`{ "action": "search", "query": "lecture" }`}</code><br />
              Delete: <code>{`{ "action": "delete", "id": "..." }`}</code><br />
              Subjects: <code>{`{ "action": "get_subjects" }`}</code>
            </p>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Your API Keys</h3>
            <button
              onClick={generateKey}
              className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              Generate New Key
            </button>
          </div>

          {newKey && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded animate-pulse">
              <p className="text-green-800 font-bold text-sm mb-1">New Key Generated:</p>
              <div className="flex items-center gap-2">
                <code className="bg-white border border-green-300 p-2 rounded block flex-1 font-mono text-sm break-all">
                  {newKey}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(newKey)}
                  className="text-green-700 hover:text-green-900 text-sm font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {loading && <p className="text-center text-gray-500">Loading keys...</p>}
            {!loading && keys.length === 0 && <p className="text-center text-gray-400 py-4">No active API keys.</p>}

            {keys.map(key => (
              <div key={key.id} className="bg-white p-3 rounded shadow-sm border border-gray-200 flex justify-between items-center">
                <div>
                  <p className="font-mono text-sm text-gray-800">
                    {key.key_value.substring(0, 8)}...{key.key_value.substring(key.key_value.length - 4)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(key.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteKey(key.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                  title="Revoke Key"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiSettingsModal;
