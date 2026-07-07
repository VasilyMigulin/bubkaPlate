import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { FOODS, IRON_IDS } from '../data/foods';
import type { AllergenWindow, LogEntry, Reaction } from '../types';

interface Store {
  introduced: Set<string>;      // id введённых продуктов
  log: LogEntry[];              // дневник прикорма
  windows: AllergenWindow[];    // активные окна ввода аллергенов
  toast: { icon: string; title: string; sub?: string } | null;
  logFood: (id: string, rx: Reaction) => void;
  startAllergen: (id: string) => void;
  markAllergenDay: (id: string) => void;
  showToast: (icon: string, title: string, sub?: string) => void;
  ironCovered: number;
  ironTotal: number;
}

const Ctx = createContext<Store | null>(null);

const seededIntroduced = new Set(FOODS.filter((f) => f.status).map((f) => f.id));

export function StoreProvider({ children }: { children: ReactNode }) {
  const [introduced, setIntroduced] = useState<Set<string>>(seededIntroduced);
  const [log, setLog] = useState<LogEntry[]>([
    { id: 'broccoli', date: 'вчера, утро', rx: 'ok' },
    { id: 'egg', date: '3 дня назад', rx: 'wait' },
    { id: 'carrot', date: '5 дней назад', rx: 'ok' },
  ]);
  const [windows, setWindows] = useState<AllergenWindow[]>([{ id: 'egg', day: 2, reaction: null }]);
  const [toast, setToast] = useState<Store['toast']>(null);

  const showToast = useCallback((icon: string, title: string, sub?: string) => {
    setToast({ icon, title, sub });
    window.clearTimeout((showToast as unknown as { t?: number }).t);
    (showToast as unknown as { t?: number }).t = window.setTimeout(() => setToast(null), 2600);
  }, []);

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

  const ironCovered = useMemo(() => IRON_IDS.filter((id) => introduced.has(id)).length, [introduced]);

  const value: Store = {
    introduced, log, windows, toast,
    logFood, startAllergen, markAllergenDay, showToast,
    ironCovered, ironTotal: IRON_IDS.length,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be inside StoreProvider');
  return s;
}
