import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FOODS, IRON_IDS } from '../data/foods';
import type { AllergenWindow, ChildState, LogEntry, PersistedState, PersistedV2, Profile, Reaction } from '../types';

interface Store {
  profile: Profile | null;
  introduced: Set<string>;
  log: LogEntry[];
  windows: AllergenWindow[];
  readiness: Set<string>;
  toast: { icon: string; title: string; sub?: string } | null;
  ageMonths: number | null;
  // мультидети
  children: { id: string; profile: Profile }[];
  activeId: string | null;
  addChild: (p: Profile) => void;
  switchChild: (id: string) => void;
  removeChild: (id: string) => void;
  setProfile: (p: Profile) => void;
  logFood: (id: string, rx: Reaction, note?: string, photo?: string) => void;
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

/** Демо-данные первого малыша — чтобы экраны не были пустыми. */
const demoLog: LogEntry[] = [
  { id: 'broccoli', date: 'вчера, утро', rx: 'ok' },
  { id: 'egg', date: '3 дня назад', rx: 'wait' },
  { id: 'carrot', date: '5 дней назад', rx: 'ok' },
];
const demoIntroduced = () => FOODS.filter((f) => f.status).map((f) => f.id);

function freshChild(p: Profile, withDemo: boolean): ChildState {
  return {
    id: 'c' + Math.random().toString(36).slice(2, 8),
    profile: p,
    introduced: withDemo ? demoIntroduced() : [],
    log: withDemo ? demoLog : [],
    windows: withDemo ? [{ id: 'egg', day: 2, reaction: null }] : [],
    readiness: [],
  };
}

/** Загрузка с миграцией: старый формат (один малыш) → v2 (несколько). */
function loadState(): PersistedV2 | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedV2 | PersistedState;
    if ('children' in data) return data as PersistedV2;
    const old = data as PersistedState;
    if (!old.profile) return null;
    const child: ChildState = {
      id: 'c1',
      profile: old.profile,
      introduced: old.introduced ?? [],
      log: old.log ?? [],
      windows: old.windows ?? [],
      readiness: old.readiness ?? [],
    };
    return { v: 2, active: 'c1', children: [child] };
  } catch {
    return null;
  }
}

export function computeAgeMonths(birthDate: string): number {
  const bd = new Date(birthDate);
  const now = new Date();
  let m = (now.getFullYear() - bd.getFullYear()) * 12 + (now.getMonth() - bd.getMonth());
  if (now.getDate() < bd.getDate()) m--;
  return Math.max(0, m);
}

export function StoreProvider({ children: kids }: { children: ReactNode }) {
  const saved = loadState();
  const [childList, setChildList] = useState<ChildState[]>(saved?.children ?? []);
  const [activeId, setActiveId] = useState<string | null>(saved?.active ?? saved?.children?.[0]?.id ?? null);
  const [toast, setToast] = useState<Store['toast']>(null);

  const child = childList.find((c) => c.id === activeId) ?? childList[0] ?? null;

  useEffect(() => {
    const data: PersistedV2 = { v: 2, active: activeId ?? '', children: childList };
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore quota */ }
  }, [childList, activeId]);

  const showToast = useCallback((icon: string, title: string, sub?: string) => {
    setToast({ icon, title, sub });
    window.clearTimeout((showToast as unknown as { t?: number }).t);
    (showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(null), 2600);
  }, []);

  /** Обновить активного малыша. */
  const patch = useCallback((fn: (c: ChildState) => ChildState) => {
    setChildList((list) => list.map((c) => (c.id === (activeId ?? list[0]?.id) ? fn(c) : c)));
  }, [activeId]);

  const setProfile = useCallback((p: Profile) => {
    setChildList((list) => {
      if (list.length === 0) {
        const c = freshChild(p, true);
        setActiveId(c.id);
        return [c];
      }
      const id = activeId ?? list[0].id;
      return list.map((c) => (c.id === id ? { ...c, profile: p } : c));
    });
  }, [activeId]);

  const addChild = useCallback((p: Profile) => {
    const c = freshChild(p, false);
    setChildList((list) => [...list, c]);
    setActiveId(c.id);
  }, []);

  const switchChild = useCallback((id: string) => setActiveId(id), []);

  const removeChild = useCallback((id: string) => {
    setChildList((list) => {
      const next = list.filter((c) => c.id !== id);
      setActiveId((cur) => (cur === id ? (next[0]?.id ?? null) : cur));
      return next;
    });
  }, []);

  const logFood = useCallback((id: string, rx: Reaction, note?: string, photo?: string) => {
    patch((c) => {
      const introduced = new Set(c.introduced).add(id);
      if (id.includes(':')) introduced.add(id.split(':')[0]);
      return {
        ...c,
        log: [{ id, date: 'сегодня', rx, note: note?.trim() || undefined, photo, ts: Date.now() }, ...c.log],
        introduced: [...introduced],
        windows: c.windows.map((w) => {
          if (w.id !== id) return w;
          if (rx === 'skin' || rx === 'tummy') return { ...w, reaction: 'bad' as const };
          return w.day < 3 ? { ...w, day: w.day + 1 } : w;
        }),
      };
    });
  }, [patch]);

  const startAllergen = useCallback((id: string) => {
    patch((c) => (c.windows.some((w) => w.id === id) ? c : { ...c, windows: [{ id, day: 1, reaction: null }, ...c.windows] }));
  }, [patch]);

  const markAllergenDay = useCallback((id: string) => {
    patch((c) => ({
      ...c,
      windows: c.windows.map((w) => (w.id === id && w.day < 3 ? { ...w, day: w.day + 1 } : w)),
      introduced: [...new Set(c.introduced).add(id)],
    }));
  }, [patch]);

  const toggleReadiness = useCallback((key: string) => {
    patch((c) => {
      const n = new Set(c.readiness);
      n.has(key) ? n.delete(key) : n.add(key);
      return { ...c, readiness: [...n] };
    });
  }, [patch]);

  const resetAll = useCallback(() => {
    localStorage.removeItem(KEY);
    setChildList([]);
    setActiveId(null);
  }, []);

  const introduced = useMemo(() => new Set(child?.introduced ?? []), [child]);
  const readiness = useMemo(() => new Set(child?.readiness ?? []), [child]);
  const ironCovered = useMemo(() => IRON_IDS.filter((id) => introduced.has(id)).length, [introduced]);
  const ageMonths = child ? computeAgeMonths(child.profile.birthDate) : null;

  const value: Store = {
    profile: child?.profile ?? null,
    introduced,
    log: child?.log ?? [],
    windows: child?.windows ?? [],
    readiness,
    toast,
    ageMonths,
    children: childList.map((c) => ({ id: c.id, profile: c.profile })),
    activeId: child?.id ?? null,
    addChild, switchChild, removeChild,
    setProfile, logFood, startAllergen, markAllergenDay, toggleReadiness, showToast, resetAll,
    ironCovered, ironTotal: IRON_IDS.length,
  };
  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be inside StoreProvider');
  return s;
}
