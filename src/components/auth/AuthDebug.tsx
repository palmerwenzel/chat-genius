import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import type { Session } from '@supabase/supabase-js';

type DebugState = {
  session: Session | null;
  localStorage: Record<string, string | null>;
  cookies: Record<string, string>;
};

export function AuthDebug() {
  const [debug, setDebug] = useState<DebugState>({
    session: null,
    localStorage: {},
    cookies: {},
  });

  useEffect(() => {
    const checkAuth = async () => {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get local storage
      const localStorageData: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('supabase')) {
          localStorageData[key] = localStorage.getItem(key);
        }
      }

      // Get cookies
      const cookies = document.cookie.split(';')
        .reduce((acc: Record<string, string>, curr) => {
          const [key, value] = curr.trim().split('=');
          if (key.includes('supabase')) {
            acc[key] = value;
          }
          return acc;
        }, {});

      setDebug({
        session,
        localStorage: localStorageData,
        cookies,
      });
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth event:', event);
      checkAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!debug.session && Object.keys(debug.localStorage).length === 0 && Object.keys(debug.cookies).length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-background border rounded-lg shadow-lg max-w-md overflow-auto max-h-[80vh]">
      <h3 className="font-semibold mb-2">Auth Debug</h3>
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-medium">Session:</h4>
          <pre className="text-xs mt-1 bg-muted p-2 rounded">
            {JSON.stringify(debug.session, null, 2)}
          </pre>
        </div>
        <div>
          <h4 className="font-medium">LocalStorage:</h4>
          <pre className="text-xs mt-1 bg-muted p-2 rounded">
            {JSON.stringify(debug.localStorage, null, 2)}
          </pre>
        </div>
        <div>
          <h4 className="font-medium">Cookies:</h4>
          <pre className="text-xs mt-1 bg-muted p-2 rounded">
            {JSON.stringify(debug.cookies, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 