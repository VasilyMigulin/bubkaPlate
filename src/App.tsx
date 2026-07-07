import { useState } from 'react';
import { StoreProvider, useStore } from './state/store';
import { MyPlate } from './screens/MyPlate';
import { Catalog } from './screens/Catalog';
import { Recipes } from './screens/Recipes';
import { Safety } from './screens/Safety';

type Tab = 'mine' | 'catalog' | 'recipes' | 'safety';

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'mine', icon: '📋', label: 'Мой прикорм' },
  { key: 'catalog', icon: '🥑', label: 'Каталог' },
  { key: 'recipes', icon: '🍲', label: 'Рецепты' },
  { key: 'safety', icon: '🛡', label: 'Безопасность' },
];

const HEAD: Record<Tab, { title: string; sub: string }> = {
  mine: { title: 'Мой прикорм', sub: 'Что уже введено, что дальше и как реагирует малыш' },
  catalog: { title: 'Каталог', sub: 'Продукты по месяцам · подача, польза, безопасность' },
  recipes: { title: 'Рецепты', sub: 'Из того, что есть дома · по возрасту' },
  safety: { title: 'Безопасность', sub: 'Удушье, аллергены и первая помощь' },
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
  const [tab, setTab] = useState<Tab>('mine');
  const head = HEAD[tab];
  return (
    <div className="app">
      <div className="app-scroll" key={tab}>
        <div className="screen-head rise">
          <h1 className="h-screen">{head.title}</h1>
          <div className="sub">{head.sub}</div>
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
