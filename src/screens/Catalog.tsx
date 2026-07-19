import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BIG_ALLERGENS, CATEGORIES, FOODS } from '../data/foods';
import { RULE3_TEXT } from '../data/glossary';
import { MAIN_PHOTOS } from '../data/mainPhotos';
import { FoodIcon } from '../components/FoodIcon';
import { ProductSheet } from '../components/ProductSheet';
import { useStore } from '../state/store';
import type { Food, FoodCategory } from '../types';
import './Catalog.css';

const isDarkMode = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const CAT_EMOJI: Record<FoodCategory, string> = {
  'Овощи': '🥦', 'Фрукты': '🍎', 'Ягоды': '🫐', 'Каши': '🌾', 'Белок': '🥩', 'Молочное': '🥛', 'Напитки и добавки': '🥤',
};

type Filter = 'all' | FoodCategory | 'allergens';

const byName = (a: Food, b: Food) => a.n.localeCompare(b.n, 'ru');

type AgeF = 'all' | 'now' | 'early';
type StatusF = 'all' | 'given' | 'not';

export function Catalog() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [ageF, setAgeF] = useState<AgeF>('all');
  const [statusF, setStatusF] = useState<StatusF>('all');
  const [ironF, setIronF] = useState(false);
  const [open, setOpen] = useState<Food | null>(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  const { introduced, ageMonths } = useStore();

  const query = q.toLowerCase().trim();

  // Единый плоский список по алфавиту — поиск/категория + фильтры возраста, статуса и железа.
  const listed = useMemo(() => {
    let base: Food[];
    if (query) base = FOODS.filter((f) => f.n.toLowerCase().includes(query));
    else if (filter === 'all') base = [...FOODS];
    else if (filter === 'allergens') base = FOODS.filter((f) => f.allergen);
    else base = FOODS.filter((f) => f.cat === filter);
    if (ageMonths != null && ageF === 'now') base = base.filter((f) => f.fromMonth <= ageMonths);
    if (ageMonths != null && ageF === 'early') base = base.filter((f) => f.fromMonth > ageMonths);
    if (statusF === 'given') base = base.filter((f) => introduced.has(f.id));
    if (statusF === 'not') base = base.filter((f) => !introduced.has(f.id));
    if (ironF) base = base.filter((f) => f.iron);
    return base.sort(byName);
  }, [query, filter, ageF, statusF, ironF, ageMonths, introduced]);

  const filtersActive = ageF !== 'all' || statusF !== 'all' || ironF;

  // Алфавитная линейка справа: буквы, с которых начинаются продукты в текущем списке.
  const letters = useMemo(() => {
    const set = new Set(listed.map((f) => f.n[0].toUpperCase()));
    return [...set].sort((a, b) => a.localeCompare(b, 'ru'));
  }, [listed]);
  const showRail = !query && listed.length > 14;

  // Линейка видна только во время скролла (как скраббер в Google Docs) и прячется сама.
  const [railOn, setRailOn] = useState(false);
  const [scrub, setScrub] = useState<{ letter: string; y: number } | null>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sc = document.querySelector('.app-scroll');
    if (!sc) return;
    const onScroll = () => {
      setRailOn(true);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setRailOn(false), 1500);
    };
    sc.addEventListener('scroll', onScroll, { passive: true });
    return () => { sc.removeEventListener('scroll', onScroll); window.clearTimeout(hideTimer.current); };
  }, []);

  const jumpTo = (letter: string, smooth = true) => {
    const el = document.querySelector<HTMLElement>(`[data-letter="${letter}"]`);
    const scroller = document.querySelector<HTMLElement>('.app-scroll');
    if (!el || !scroller) return;
    const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 10;
    scroller.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
  };

  // Ведение пальцем по линейке: буква под пальцем + мгновенный переход.
  const scrubTo = (clientY: number) => {
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect || letters.length === 0) return;
    const idx = Math.min(letters.length - 1, Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * letters.length)));
    const letter = letters[idx];
    setScrub({ letter, y: clientY });
    window.clearTimeout(hideTimer.current);
    setRailOn(true);
    jumpTo(letter, false);
  };

  const renderCard = (f: Food, i: number) => {
    const bg = isDarkMode() ? f.dbg : f.bg;
    const done = introduced.has(f.id);
    const tooEarly = ageMonths != null && f.fromMonth > ageMonths;
    const letter = f.n[0].toUpperCase();
    const firstOfLetter = i === 0 || listed[i - 1].n[0].toUpperCase() !== letter;
    return (
      <button key={f.id} className={`food ${tooEarly ? 'early' : ''}`} data-letter={firstOfLetter ? letter : undefined} onClick={() => setOpen(f)}>
        <div className="food-pic" style={{ background: MAIN_PHOTOS[f.id] ? undefined : `radial-gradient(circle at 32% 28%, ${bg[0]}, ${bg[1]})` }}>
          {MAIN_PHOTOS[f.id] ? <img className="food-photo-cover" src={MAIN_PHOTOS[f.id]} alt={f.n} loading="lazy" /> : <FoodIcon food={f} size={60} />}
          <span className="food-from">с {f.fromMonth}</span>
          {done && <span className="food-done">✓</span>}
        </div>
        <div className="food-meta">
          <div className="food-name">
            {f.n}
            {f.iron && <span className="food-iron">железо</span>}
            {f.allergen && BIG_ALLERGENS.has(f.allergen) && <span className="food-intro">ввести до года</span>}
          </div>
          {tooEarly
            ? <div className="food-age"><span className="food-soon">рано · с {f.fromMonth} мес</span></div>
            : done
              ? <div className="food-status in">✓ в рационе</div>
              : <div className="food-status">ещё не пробовали</div>}
        </div>
      </button>
    );
  };

  return (
    <>
      <input className="search" placeholder="Найти продукт: банан, яйцо, брокколи…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="segs">
        <button className={`chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>Все</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${filter === c ? 'on' : ''}`} onClick={() => setFilter(c)}>{CAT_EMOJI[c]} {c}</button>
        ))}
        <button className={`chip chip-warn ${filter === 'allergens' ? 'on' : ''}`} onClick={() => setFilter('allergens')}>⚠️ Аллергены</button>
      </div>
      <div className="segs filters-row">
        {ageMonths != null && (
          <>
            <button className={`chip chip-mini ${ageF === 'now' ? 'on' : ''}`} onClick={() => setAgeF(ageF === 'now' ? 'all' : 'now')}>✅ можно сейчас</button>
            <button className={`chip chip-mini ${ageF === 'early' ? 'on' : ''}`} onClick={() => setAgeF(ageF === 'early' ? 'all' : 'early')}>🕐 пока рано</button>
            <span className="filter-sep" />
          </>
        )}
        <button className={`chip chip-mini ${statusF === 'given' ? 'on' : ''}`} onClick={() => setStatusF(statusF === 'given' ? 'all' : 'given')}>✓ уже дали</button>
        <button className={`chip chip-mini ${statusF === 'not' ? 'on' : ''}`} onClick={() => setStatusF(statusF === 'not' ? 'all' : 'not')}>ещё не дали</button>
        <span className="filter-sep" />
        <button className={`chip chip-mini ${ironF ? 'on' : ''}`} onClick={() => setIronF(!ironF)}>🩸 железо</button>
      </div>

      {filtersActive && (
        <div className="filter-summary">
          {ageF === 'now' && statusF === 'not'
            ? <>Это можно пробовать уже сейчас — <b>{listed.length}</b></>
            : <>Подходит: <b>{listed.length}</b></>}
          <button className="term-link" onClick={() => { setAgeF('all'); setStatusF('all'); setIronF(false); }}>сбросить</button>
        </div>
      )}

      {!query && filter !== 'all' && (
        <div className="cat-head">
          <span className="cat-emoji">{filter === 'allergens' ? '⚠️' : CAT_EMOJI[filter]}</span>
          {filter === 'allergens' ? 'Аллергены' : filter}
          <span className="cat-count">{listed.length}</span>
        </div>
      )}
      {!query && filter === 'allergens' && (
        <div className="note" style={{ marginBottom: 12 }}><span className="ne">🗓</span><span>Вводить до года по <button className="term-link" onClick={() => setRuleOpen(true)}>правилу 3 дней</button>: утром, малой дозой, 3 дня подряд. Собраны из всех групп.</span></div>
      )}

      <div className="food-grid">{listed.map(renderCard)}</div>

      {showRail && createPortal(
        <>
          <div
            ref={railRef}
            className={`alpha-rail ${railOn || scrub ? 'show' : ''}`}
            aria-hidden
            onTouchStart={(e) => scrubTo(e.touches[0].clientY)}
            onTouchMove={(e) => scrubTo(e.touches[0].clientY)}
            onTouchEnd={() => { setScrub(null); hideTimer.current = window.setTimeout(() => setRailOn(false), 1200); }}
          >
            {letters.map((l) => (
              <button key={l} className={scrub?.letter === l ? 'cur' : ''} onClick={() => jumpTo(l)}>{l}</button>
            ))}
          </div>
          {scrub && <div className="alpha-bubble" style={{ top: scrub.y }}>{scrub.letter}</div>}
        </>,
        document.body
      )}

      {listed.length === 0 && <div className="sub" style={{ textAlign: 'center', padding: 20 }}>Ничего не нашли — попробуйте другой запрос.</div>}

      {open && <ProductSheet food={open} onClose={() => setOpen(null)} />}

      {ruleOpen && (
        <div className="skill-pop-scrim" onClick={() => setRuleOpen(false)}>
          <div className="skill-pop" onClick={(e) => e.stopPropagation()}>
            <div className="skill-pop-text">{RULE3_TEXT}</div>
            <button className="btn btn-soft" onClick={() => setRuleOpen(false)}>Понятно</button>
          </div>
        </div>
      )}
    </>
  );
}
