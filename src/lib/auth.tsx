import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { cloudEnabled, pullState, pushState, signInOAuth, supabase } from './cloud';

const KEY = 'bubka-plate-v1';
const MTIME = 'bubka-plate-mtime';

interface AuthCtx {
  enabled: boolean;
  user: User | null;
  ready: boolean;
  syncing: boolean;
  signUp: (email: string, pass: string) => Promise<string | null>; // возвращает текст ошибки или null
  signIn: (email: string, pass: string) => Promise<string | null>;
  signInWith: (p: 'google' | 'apple') => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

/** Логическое время последнего изменения — внутри state, чтобы решать «кто новее». */
function localMtime(): number { return Number(localStorage.getItem(MTIME) || 0); }
function localState(): unknown { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!cloudEnabled);
  const [syncing, setSyncing] = useState(false);
  const pushTimer = useRef<number | undefined>(undefined);

  // Слияние при входе: кто новее (по _mtime), тот и главный.
  const syncOnLogin = useCallback(async (u: User) => {
    setSyncing(true);
    try {
      const cloud = await pullState(u.id);
      const cloudState = cloud?.state as { _mtime?: number } | undefined;
      const cloudMtime = cloudState?._mtime ?? 0;
      const mine = localMtime();
      if (cloudState && cloudMtime > mine) {
        // облако новее — принимаем его и перезагружаем, чтобы UI отразил
        localStorage.setItem(KEY, JSON.stringify(cloudState));
        localStorage.setItem(MTIME, String(cloudMtime));
        location.reload();
        return;
      }
      // локальное новее (или в облаке пусто) — заливаем своё
      const state = localState() as Record<string, unknown> | null;
      if (state) await pushState(u.id, { ...state, _mtime: mine || Date.now() });
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session as Session | null;
      setUser(s?.user ?? null);
      setReady(true);
      if (s?.user) syncOnLogin(s.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
      if (s?.user) syncOnLogin(s.user);
    });
    return () => sub.subscription.unsubscribe();
  }, [syncOnLogin]);

  // Автопуш при локальных изменениях (стор шлёт 'bubka-saved').
  useEffect(() => {
    if (!supabase) return;
    const onSaved = () => {
      if (!user) return;
      window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(async () => {
        const state = localState() as Record<string, unknown> | null;
        if (state) await pushState(user.id, { ...state, _mtime: localMtime() || Date.now() });
      }, 1500);
    };
    window.addEventListener('bubka-saved', onSaved);
    return () => window.removeEventListener('bubka-saved', onSaved);
  }, [user]);

  const signUp = useCallback(async (email: string, pass: string) => {
    if (!supabase) return 'Облако не настроено';
    const { error } = await supabase.auth.signUp({ email, password: pass });
    return error ? error.message : null;
  }, []);
  const signIn = useCallback(async (email: string, pass: string) => {
    if (!supabase) return 'Облако не настроено';
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return error ? error.message : null;
  }, []);
  const signInWith = useCallback((p: 'google' | 'apple') => signInOAuth(p), []);
  const signOut = useCallback(async () => { await supabase?.auth.signOut(); }, []);

  return <Ctx.Provider value={{ enabled: cloudEnabled, user, ready, syncing, signUp, signIn, signInWith, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be inside AuthProvider');
  return c;
}
