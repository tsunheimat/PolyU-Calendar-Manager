
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Robust helper to access environment variables across different environments (Vite, Webpack, etc.)
const getEnv = (key: string) => {
  // 1. Check import.meta.env (Vite standard)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
       // @ts-ignore
       if (import.meta.env[key]) return import.meta.env[key];
       // @ts-ignore
       if (import.meta.env[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
    }
  } catch (e) {
    // ignore
  }

  // 2. Check process.env (Legacy/Webpack/Node)
  try {
    if (typeof process !== 'undefined' && process.env) {
        if (process.env[key]) return process.env[key];
        if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`];
        if (process.env[`REACT_APP_${key}`]) return process.env[`REACT_APP_${key}`];
    }
  } catch (e) {
    // ignore
  }

  return undefined;
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_KEY');

let client: SupabaseClient | any;
let isMock = false;

// Mock Client for Local Storage (Offline/Demo Mode)
const createMockClient = () => {
  console.warn("Supabase credentials missing or not exposed to client. Using Local Storage (Mock Mode).");
  console.warn("TIP: If using Vercel + Vite, rename env vars to VITE_SUPABASE_URL and VITE_SUPABASE_KEY in Vercel dashboard.");
  
  const getStore = (table: string) => JSON.parse(localStorage.getItem(`sb_${table}`) || '[]');
  const setStore = (table: string, data: any[]) => localStorage.setItem(`sb_${table}`, JSON.stringify(data));
  const authListeners: any[] = [];

  return {
    auth: {
      getSession: async () => {
        const user = JSON.parse(localStorage.getItem('sb_mock_user') || 'null');
        return { data: { session: user ? { user, access_token: 'mock-token' } : null }, error: null };
      },
      onAuthStateChange: (cb: any) => {
        authListeners.push(cb);
        return { data: { subscription: { unsubscribe: () => {
           const idx = authListeners.indexOf(cb);
           if (idx > -1) authListeners.splice(idx, 1);
        } } } };
      },
      signInWithPassword: async ({ email }: any) => {
        const user = { id: 'local-user', email };
        localStorage.setItem('sb_mock_user', JSON.stringify(user));
        const session = { user, access_token: 'mock-token' };
        authListeners.forEach(cb => cb('SIGNED_IN', session));
        return { data: { user, session }, error: null };
      },
      signUp: async ({ email }: any) => {
        const user = { id: 'local-user', email };
        localStorage.setItem('sb_mock_user', JSON.stringify(user));
        const session = { user, access_token: 'mock-token' };
        authListeners.forEach(cb => cb('SIGNED_IN', session));
        return { data: { user, session }, error: null };
      },
      signOut: async () => {
        localStorage.removeItem('sb_mock_user');
        authListeners.forEach(cb => cb('SIGNED_OUT', null));
        return { error: null };
      }
    },
    from: (table: string) => {
        const queryBuilder: any = {
            data: getStore(table),
            filters: [],
            
            // Standard query modifiers
            select: function() { return this; },
            eq: function(col: string, val: any) { 
                this.filters.push((r: any) => r[col] === val); 
                return this; 
            },
            is: function(col: string, val: any) {
                if(val === null) this.filters.push((r: any) => r[col] === null || r[col] === undefined);
                return this;
            },
            in: function(col: string, vals: any[]) {
                this.filters.push((r: any) => vals.includes(r[col]));
                return this;
            },
            single: async function() {
                const res = this.data.filter((r: any) => this.filters.every((f: any) => f(r)));
                return { data: res[0] || null, error: null };
            },
            order: function(col: string, { ascending = true } = {}) {
                this.data.sort((a: any, b: any) => ascending ? (a[col] > b[col] ? 1 : -1) : (a[col] < b[col] ? 1 : -1));
                return this;
            },
            limit: function(n: number) {
                // Mock limit (simplified)
                return this;
            },
            // Execution for SELECT
            then: function(resolve: any) {
                const res = this.data.filter((r: any) => this.filters.every((f: any) => f(r)));
                resolve({ data: res, error: null });
            },
            
            // Mutations
            insert: async function(rows: any[]) {
                const current = getStore(table);
                const newRows = rows.map(r => ({ ...r, id: r.id || crypto.randomUUID(), created_at: new Date().toISOString() }));
                setStore(table, [...current, ...newRows]);
                return { data: newRows, error: null };
            },
            update: function(updates: any) {
                const mutationBuilder: any = {
                    filters: [],
                    eq: function(col: string, val: any) { 
                        this.filters.push((r: any) => r[col] === val); 
                        return this; 
                    },
                    is: function(col: string, val: any) {
                        if(val === null) this.filters.push((r: any) => r[col] === null || r[col] === undefined);
                        return this;
                    },
                    then: function(resolve: any) {
                        let store = getStore(table);
                        store = store.map((r: any) => {
                            if (this.filters.every((f: any) => f(r))) {
                                return { ...r, ...updates };
                            }
                            return r;
                        });
                        setStore(table, store);
                        resolve({ data: null, error: null });
                    }
                };
                return mutationBuilder;
            },
            delete: function() {
                const mutationBuilder: any = {
                    filters: [],
                    eq: function(col: string, val: any) { 
                        this.filters.push((r: any) => r[col] === val); 
                        return this; 
                    },
                    is: function(col: string, val: any) {
                        if(val === null) this.filters.push((r: any) => r[col] === null || r[col] === undefined);
                        return this;
                    },
                    then: function(resolve: any) {
                        let store = getStore(table);
                        store = store.filter((r: any) => !this.filters.every((f: any) => f(r)));
                        setStore(table, store);
                        resolve({ data: null, error: null });
                    }
                };
                return mutationBuilder;
            }
        };
        return queryBuilder;
    },
    storage: {
        from: (bucket: string) => ({
            upload: async (path: string, blob: Blob) => {
                console.log(`[Mock Storage] Uploaded to ${bucket}/${path}`);
                return { data: { path }, error: null };
            },
            getPublicUrl: (path: string) => ({ data: { publicUrl: `#local-mock/${path}` } })
        })
    }
  };
};

// Initialize real client ONLY if keys are present
if (supabaseUrl && supabaseKey) {
    try {
        client = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
        console.error("Failed to create Supabase client:", e);
        client = createMockClient();
        isMock = true;
    }
} else {
    client = createMockClient();
    isMock = true;
}

export const supabase = client;
export const isMockMode = isMock;
