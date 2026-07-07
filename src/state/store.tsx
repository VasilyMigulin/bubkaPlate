import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FOODS, IRON_IDS } from '../data/foods';
import type { AllergenWindow, LogEntry, PersistedState, Profile, Reaction } from '../types';

interface Store {
  profile: Profile | null;
  introduced: Set<string>;
  log: LogEntry[];
  windows: AllergenWindow[];
  readiness: Set<string>;
  toast: { icon: string; title: string; sub?: string } | null;
  ageMonths: number | null;      // возраст ребёнка в месяцах (или null без профиля)
  setProfile: (p: Profile) => void;
  logFood: (id: string, rx: Reaction) => void;
  startAllergen: (id: string) => void;
  markAllergenDay: (id: string) => void;
  toggleReadiness: (key: string) => void;
  showToast: (icon: string, title: string, sub?: string) => void;
  resetAll: () => void;
  ironCovered: number;
  ironTotal: number;
}

const Ctx = createContext<Store | null>(null);
const KEY = 'bubka-plate-v1';

function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

/** Демо-данные при первом запуске (пока профиль не создан — не показываются). */
const demoLog: LogEntry[] = [
  { id: 'broccoli', date: 'вчера, утро', rx: 'ok' },
  { id: 'egg', date: '3 дня назад', rx: 'wait' },
  { id: 'carrot', date: '5 дней назад', rx: 'ok' },
];

export function computeAgeMonths(birthDate: string): number {
  const bd = new Date(birthDate);
  const now = new Date();
  let m = (now.getFullYear() - bd.getFullYear()) * 12 + (now.getMonth() - bd.getMonth());
  if (now.getDate() < bd.getDate()) m--;
  return Math.max(0, m);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const saved = loadState();
  const [profile, setProfileState] = useState<Profile | null>(saved?.profile ?? null);
  const [introduced, setIntroduced] = useState<Set<string>>(
    new Set(saved?.introduced ?? FOODS.filter((f) => f.status).map((f) => f.id)),
  );
  const [log, setLog] = useState<LogEntry[]>(saved?.log ?? demoLog);
  const [windows, setWindows] = useState<AllergenWindow[]>(saved?.windows ?? [{ id: 'egg', day: 2, reaction: null }]);
  const [readiness, setReadiness] = useState<Set<string>>(new Set(saved?.readiness ?? []));
  const [toast, setToast] = useState<Store['toast']>(null);

  // Персист в localStorage при любом изменении
  useEffect(() => {
    const data: PersistedState = {
      profile,
      introduced: [...introduced],
      log,
      windows,
      readiness: [...readiness],
    };
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore quota */ }
  }, [profile, introduced, log, windows, readiness]);

  const showToast = useCallback((icon: string, title: string, sub?: string) => {
    setToast({ icon, title, sub });
    window.clearTimeout((showToast as unknown as { t?: number }).t);
    (showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const setProfile = useCallback((p: Profile) => setProfileState(p), []);

  const logFood = useCallback((id: string, rx: Reaction) => {
    setLog((l) => [{ id, date: 'сегодня', rx }, ...l]);
    setIntroduced((s) => new Set(s).add(id));
    setWindows((ws) => ws.map((w) => {
      if (w.id !== id) return w;
      if (rx === 'skin' || rx === 'tummy') return { ...w, reaction: 'bad' };
      return w.day < 3 ? { ...w, day: w.day + 1 } : w;
    }));
  }, []);

  const startAllergen = useCallback((id: string) => {
    setWindows((ws) => (ws.some((w) => w.id === id) ? ws : [{ id, day: 1, reaction: null }, ...ws]));
  }, []);

  const markAllergenDay = useCallback((id: string) => {
    setWindows((ws) => ws.map((w) => (w.id === id && w.day < 3 ? { ...w, day: w.day + 1 } : w)));
    setIntroduced((s) => new Set(s).add(id));
  }, []);

  const toggleReadiness = useCallback((key: string) => {
    setReadiness((s) => {
      const n = new Set(s);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(KEY);
    setProfileState(null);
    setIntroduced(new Set(FOODS.filter((f) => f.status).map((f) => f.id)));
    setLog(demoLog);
    setWindows([{ id: 'egg', day: 2, reaction: null }]);
    setReadiness(new Set());
  }, []);

  const ironCovered = useMemo(() => IRON_IDS.filter((id) => introduced.has(id)).length, [introduced]);
  const ageMonths = profile ? computeAgeMonths(profile.birthDate) : null;

  const value: Store = {
    profile, introduced, log, windows, readiness, toast, ageMonths,
    setProfile, logFood, startAllergen, markAllergenDay, toggleReadiness, showToast, resetAll,
    ironCovered, ironTotal: IRON_IDS.length,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be inside StoreProvider');
  return s;
}
