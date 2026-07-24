import { useEffect, useMemo, useState } from 'react';
import { helloNow, ageTextOf } from './lib/day';
import { computeXP, earnedBadges, levelOf } from './data/badges';
import { StoreProvider, useStore } from './state/store';
import { MyPlate } from './screens/MyPlate';
import { Catalog } from './screens/Catalog';
import { Recipes } from './screens/Recipes';
import { Safety } from './screens/Safety';
import { Onboarding } from './screens/Onboarding';
import { Settings } from './components/Settings';

type Tab = 'mine' | 'catalog' | 'recipes' | 'safety';

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'mine', icon: '📋', label: 'Мой прикорм' },
  { key: 'catalog', icon: '🥑', label: 'Каталог' },
  { key: 'recipes', icon: '🍲', label: 'Рецепты' },
  { key: 'safety', icon: '🎓', label: 'База' },
];

const HEAD: Record<Tab, { title: string; sub: string }> = {
  mine: { title: 'Мой прикорм', sub: 'Что уже введено, что дальше и как реагирует малыш' },
  catalog: { title: 'Каталог', sub: 'Как безопасно подать каждый продукт — по возрасту малыша' },
  recipes: { title: 'Рецепты', sub: 'Из того, что есть дома · по возрасту' },
  safety: { title: 'База', sub: 'Всё, что нужно знать родителю, — коротко и по делу' },
};

function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="toast-wrap">
      <div className="toast">
        <span className="toast-e">{toast.icon}</span>
        <div><div className="toast-t">{toast.title}</div>{toast.sub && <div className="toast-s">{toast.sub}</div>}</div>
      </div>
    </div>
  );
}

function Shell() {
  const [tab, setTab] = useState<Tab>(() => {
    const q = new URLSearchParams(location.search).get('tab') as Tab | null;
    if (q && ['mine', 'catalog', 'recipes', 'safety'].includes(q)) return q;
    const t = localStorage.getItem('bubka-plate-start-tab') as Tab | null;
    if (t) { localStorage.removeItem('bubka-plate-start-tab'); return t; }
    return 'mine';
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { profile, ageMonths, log, introduced, windows, activeId } = useStore();
  const achCtx = useMemo(() => ({ log, introduced, windows }), [log, introduced, windows]);
  const lvl = levelOf(computeXP(achCtx));
  const hasNewBadges = useMemo(() => {
    try {
      const seen = new Set(JSON.parse(localStorage.getItem(`bubka-plate-badges-seen-${activeId ?? ''}`) || '[]') as string[]);
      return earnedBadges(achCtx).some((b) => !seen.has(b.id));
    } catch { return false; }
  }, [achCtx, activeId]);
  // онбординг завершился с «Читать базу» — переключаемся на неё
  useEffect(() => {
    if (profile) {
      const t = localStorage.getItem('bubka-plate-start-tab') as Tab | null;
      if (t) { localStorage.removeItem('bubka-plate-start-tab'); setTab(t); }
    }
  }, [profile]);
  useEffect(() => {
    const h = (e: Event) => setTab((e as CustomEvent).detail as Tab);
    window.addEventListener('bubka-tab', h);
    return () => window.removeEventListener('bubka-tab', h);
  }, []);

  // Жесты как в iOS: тянем шторку вниз — закрывается; свайп от левого края полноэкранной карточки — назад.
  useEffect(() => {
    let sheet: HTMLElement | null = null;
    let view: HTMLElement | null = null;
    let startX = 0, startY = 0, dx = 0, dy = 0, mode: 'none' | 'sheet' | 'back' = 'none';

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY; dx = 0; dy = 0; mode = 'none';
      const el = e.target as HTMLElement;
      const sh = el.closest('.bottom-sheet') as HTMLElement | null;
      if (sh && sh.scrollTop <= 0) { sheet = sh; mode = 'sheet'; return; }
      if (startX < 28) {
        const vw = el.closest('.product-view, .recipe-view, .article-view, .rx-screen') as HTMLElement | null;
        if (vw) { view = vw; mode = 'back'; }
      }
    };
    const onMove = (e: TouchEvent) => {
      if (mode === 'none') return;
      const t = e.touches[0];
      dx = t.clientX - startX; dy = t.clientY - startY;
      if (mode === 'sheet') {
        if (dy > 6 && Math.abs(dy) > Math.abs(dx)) {
          sheet!.style.transform = `translateY(${dy}px)`;
          sheet!.style.transition = 'none';
          e.preventDefault();
        }
      } else if (mode === 'back' && dx > 6) {
        view!.style.transform = `translateX(${Math.max(0, dx)}px)`;
        view!.style.transition = 'none';
        e.preventDefault();
      }
    };
    const onEnd = () => {
      if (mode === 'sheet' && sheet) {
        const el = sheet;
        el.style.transition = 'transform .25s ease';
        if (dy > 110) {
          el.style.transform = 'translateY(100%)';
          setTimeout(() => (el.parentElement as HTMLElement | null)?.click(), 180);
        } else {
          el.style.transform = '';
        }
      }
      if (mode === 'back' && view) {
        const el = view;
        el.style.transition = 'transform .25s ease';
        if (dx > 90) {
          el.style.transform = 'translateX(100%)';
          const back = el.querySelector('.ps-back, .rx-back') as HTMLElement | null;
          setTimeout(() => back?.click(), 160);
        } else {
          el.style.transform = '';
        }
      }
      sheet = null; view = null; mode = 'none';
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, []);
  if (!profile) return <Onboarding />;
  const head = HEAD[tab];
  return (
    <div className="app">
      <div className="app-scroll" key={tab}>
        <div className="screen-head rise" style={{ position: 'relative' }}>
          <button className="gear-btn" onClick={() => setSettingsOpen(true)} aria-label="Настройки">⚙️</button>
          {tab === 'mine' && (
            <button className="search-btn" onClick={() => window.dispatchEvent(new CustomEvent('bubka-search'))} aria-label="Поиск">🔍</button>
          )}
          {tab === 'mine' ? (
            <>
              <div className="kid-row">
                <button className="ava-wrap" onClick={() => window.dispatchEvent(new CustomEvent('bubka-ach'))} aria-label="Достижения">
                  <svg className="ava-ring" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="27" fill="none" stroke="var(--elev)" strokeWidth="3.5" />
                    <circle cx="30" cy="30" r="27" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round"
                      strokeDasharray={String(2 * Math.PI * 27)} strokeDashoffset={String(2 * Math.PI * 27 * (1 - lvl.pct / 100))}
                      transform="rotate(-90 30 30)" />
                  </svg>
                  <div className="kid-ava">{profile.photo ? <img src={profile.photo} alt={profile.name} /> : '👶'}</div>
                  <span className="ava-lvl">{lvl.cur.e}{hasNewBadges && <i className="ava-dot" />}</span>
                </button>
                <div className="grow">
                  <div className="kid-hello">{helloNow()}</div>
                  <h1 className="h-screen" style={{ fontSize: 26, lineHeight: 1.1 }}>{profile.name}</h1>
                  <div className="sub" style={{ marginTop: 3 }}>{ageMonths != null ? ageTextOf(profile.birthDate, ageMonths) : ''} · {profile.approach === 'puree' ? 'пюре' : profile.approach === 'blw' ? 'кусочки' : 'пюре и кусочки'}</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="h-screen">{head.title}</h1>
              <div className="sub">{head.sub}</div>
            </>
          )}
        </div>
        <div className="rise">
          {tab === 'mine' && <MyPlate goCatalog={() => setTab('catalog')} />}
          {tab === 'catalog' && <Catalog />}
          {tab === 'recipes' && <Recipes />}
          {tab === 'safety' && <Safety />}
        </div>
      </div>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <span className="ti">{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>

      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <Toast />
      <style>{`
        .toast-wrap { position:fixed; left:0; right:0; bottom:96px; z-index:50; display:flex; justify-content:center; pointer-events:none; }
        .toast { display:flex; align-items:center; gap:12px; background:var(--card); border-radius:18px; padding:14px 16px;
          box-shadow:var(--shadow-lg); max-width:400px; margin:0 18px; animation:toastin .38s cubic-bezier(.34,1.4,.64,1) both; }
        @keyframes toastin { from { opacity:0; transform:translateY(24px);} to { opacity:1; transform:none; } }
        .toast-e { font-size:24px; }
        .toast-t { font-size:14px; font-weight:650; }
        .toast-s { font-size:12px; color:var(--text2); margin-top:1px; }
      `}</style>
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
