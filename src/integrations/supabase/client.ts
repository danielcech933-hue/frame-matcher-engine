// Client-side Supabase connection for the learning platform.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

// The learning content and user progress live in the original Trading Academy project.
// News has its own client in /routes/novinky.tsx so its refresh pipeline can remain isolated.
const LEARNING_SUPABASE_URL = 'https://tzepmqceuiayoqsftjlr.supabase.co';
const LEARNING_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_V0KDBHBggGqhqKqSSB-JPw_iJyhYu9H';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }
    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseClient() {
  return createClient<Database>(LEARNING_SUPABASE_URL, LEARNING_SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: createSupabaseFetch(LEARNING_SUPABASE_PUBLISHABLE_KEY) },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
