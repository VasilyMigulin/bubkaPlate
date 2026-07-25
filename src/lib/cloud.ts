// Облачные аккаунты и синхронизация (Supabase).
// Конфиг: впишите два публичных ключа проекта — до этого приложение работает локально как раньше.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ── Ключи проекта Supabase (публичные, могут лежать в коде открыто) ──
// Взять на supabase.com → Project Settings → API: Project URL и anon public key.
const SUPABASE_URL = 'https://sgsskqhffatfizemkmks.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iVUcC7oj5-YW8pkc-cuFrA_9BSpf01x';

export const cloudEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/**
 * Одна строка на пользователя в таблице `states`:
 *   user_id uuid primary key references auth.users
 *   state jsonb          — весь PersistedV2 (профили детей, дневник, окна)
 *   updated_at timestamptz
 * SQL для создания — в CLOUD_SETUP ниже.
 */
export interface CloudRow { state: unknown; updated_at: string }

/** Вход через Google/Apple — редирект на текущую страницу. */
export async function signInOAuth(provider: 'google' | 'apple'): Promise<string | null> {
  if (!supabase) return 'Облако не настроено';
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  return error ? error.message : null;
}

export async function pullState(userId: string): Promise<CloudRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('states').select('state, updated_at').eq('user_id', userId).maybeSingle();
  if (error) { console.warn('pullState', error.message); return null; }
  return (data as CloudRow) ?? null;
}

export async function pushState(userId: string, state: unknown): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('states').upsert(
    { user_id: userId, state, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  );
  if (error) { console.warn('pushState', error.message); return false; }
  return true;
}

// SQL, который нужно один раз выполнить в Supabase → SQL Editor:
export const CLOUD_SETUP = `
create table if not exists states (
  user_id uuid primary key references auth.users on delete cascade,
  state jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table states enable row level security;
create policy "own state select" on states for select using (auth.uid() = user_id);
create policy "own state upsert" on states for insert with check (auth.uid() = user_id);
create policy "own state update" on states for update using (auth.uid() = user_id);
`;
