import { useState } from 'react';
import { createPortal } from 'react-dom';
import { PLAN30 } from '../data/plan30';
import { SCHEDULE } from '../data/schedule';
import { FOODS } from '../data/foods';
import { ProductSheet } from './ProductSheet';
import { useStore } from '../state/store';
import { Paywall, isPremium } from './Paywall';
import type { Food } from '../types';

const P30_KEY = 'bubka-plate-plan30';

function readDone(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(P30_KEY) || '[]') as number[]); } catch { return new Set(); }
}

/** «Первые 30 дней прикорма» — пошаговый календарь для новичка. */
export function Plan30Sheet({ onClose }: { onClose: () => void }) {
  const { introduced, showToast } = useStore();
  const [done, setDone] = useState<Set<number>>(readDone);
  const [foodOpen, setFoodOpen] = useState<Food | null>(null);
  const [prem, setPrem] = useState(isPremium());
  const [pwOpen, setPwOpen] = useState(false);
  const [view, setView] = useState<'days' | 'weeks'>('days');

  const allDays = PLAN30.flatMap((w) => w.days);
  // день считается пройденным: отмечен вручную ИЛИ все его продукты уже введены
  const isDone = (d: number, pids: string[]) =>
    done.has(d) || (pids.length > 0 && pids.every((p) => introduced.has(p)));
  const doneCount = allDays.filter((day) => isDone(day.d, day.pids)).length;
  const current = allDays.find((day) => !isDone(day.d, day.pids))?.d ?? 31;

  const toggle = (d: number) => setDone((prev) => {
    const n = new Set(prev);
    if (n.has(d)) n.delete(d); else { n.add(d); if (doneCount + 1 === 30) showToast('🎉', '30 дней позади!', 'Вы прошли самый волнительный месяц'); }
    localStorage.setItem(P30_KEY, JSON.stringify([...n]));
    return n;
  });

  return createPortal(
    <>
    <div className="article-view">
      <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="p30-head">
        <h2>🗓 Первые 30 дней</h2>
        <div className="sub" style={{ marginTop: 4 }}>Пошаговый ориентир на самый волнительный месяц. Темп можно замедлять — это не гонка.</div>
        <div className="p30-bar"><div className="p30-fill" style={{ width: `${(doneCount / 30) * 100}%` }} /></div>
        <div className="p30-count">{doneCount} из 30 · {doneCount === 0 ? 'начнём с кабачка!' : doneCount >= 30 ? 'месяц пройден 🎉' : `сейчас день ${current}`}</div>
        <div className="p30-tabs">
          <button className={`chip ${view === 'days' ? 'on' : ''}`} onClick={() => setView('days')}>📅 По дням</button>
          <button className={`chip ${view === 'weeks' ? 'on' : ''}`} onClick={() => setView('weeks')}>🗺 Схема по неделям</button>
        </div>
      </div>
      {view === 'weeks' ? (
        <div className="p30-body">
          <div className="sub" style={{ margin: '0 2px 10px' }}>Общая логика первого полугодия прикорма — куда всё движется после первых 30 дней.</div>
          <div className="sched">
            {SCHEDULE.map((w, i) => (
              <div key={i} className="sched-week">
                <div className="sched-line">
                  <div className="sched-badge">{w.week}</div>
                  <div className="sched-focus">{w.focus}</div>
                </div>
                <div className="sched-foods">
                  {w.foods.map((id) => {
                    const f = FOODS.find((x) => x.id === id);
                    return f ? <button key={id} className="sched-chip" onClick={() => setFoodOpen(f)}>{f.e} {f.n}</button> : null;
                  })}
                </div>
                <div className="sched-note">{w.note}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div className="p30-body">
        {PLAN30.map((w, wi) => {
          const weekLocked = !prem && wi > 0;
          return (
          <div key={w.title}>
            <div className="section-t">{w.title}{weekLocked && <span className="p30-lock"> ✨ bubka+</span>}</div>
            <div className="sub" style={{ margin: '-4px 2px 10px' }}>{w.sub}</div>
            {weekLocked ? (
              <button className="p30-locked-week" onClick={() => setPwOpen(true)}>
                {w.days.map((day) => (
                  <span key={day.d} className="p30-locked-day">{day.d} · {day.t}</span>
                ))}
                <span className="p30-unlock">✨ Открыть полный план с bubka+</span>
              </button>
            ) : w.days.map((day) => {
              const dDone = isDone(day.d, day.pids);
              const isCur = day.d === current;
              return (
                <div key={day.d} className={`p30-day ${dDone ? 'done' : ''} ${isCur ? 'cur' : ''}`}>
                  <button className="p30-check" onClick={() => toggle(day.d)} aria-label="Отметить день">
                    {dDone ? '✓' : day.d}
                  </button>
                  <div className="grow">
                    <div className="p30-t">{day.t}{day.allergen && <span className="p30-al"> аллерген</span>}{isCur && <span className="p30-cur-tag">сегодня</span>}</div>
                    <div className="p30-note">{day.note}</div>
                    {day.pids.length > 0 && (
                      <div className="p30-chips">
                        {day.pids.map((pid) => {
                          const f = FOODS.find((x) => x.id === pid);
                          return f ? (
                            <button key={pid} className="tag tag-link" onClick={() => setFoodOpen(f)}>{f.e} {f.n}</button>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          );
        })}
        <div className="note" style={{ marginTop: 8 }}>
          <span className="ne">🧭</span>
          <span>План — ориентир, а не экзамен. Пропустили день, поменяли порядок овощей, малыш болел — просто продолжайте со своего места. Дни отмечаются сами, когда продукт появляется в дневнике.</span>
        </div>
      </div>
      )}

      <style>{`
        .p30-tabs { display:flex; gap:7px; margin-top:12px; }
        .p30-head { padding:64px 20px 4px; }
        .p30-head h2 { font-size:24px; font-weight:750; letter-spacing:-.02em; }
        .p30-bar { height:8px; border-radius:999px; background:var(--elev); margin-top:12px; overflow:hidden; }
        .p30-fill { height:100%; border-radius:999px; background:var(--accent); transition:width .4s ease; }
        .p30-count { font-size:12px; font-weight:700; color:var(--text2); margin-top:6px; }
        .p30-body { padding:8px 18px calc(30px + env(safe-area-inset-bottom)); }
        .p30-day { display:flex; gap:12px; background:var(--card); border-radius:16px; padding:12px 14px; box-shadow:var(--shadow);
          margin-bottom:8px; border:1.5px solid transparent; }
        .p30-day.cur { border-color:var(--accent); background:var(--accent-soft); }
        .p30-day.done { opacity:.72; }
        .p30-check { flex:none; width:34px; height:34px; border-radius:50%; border:1.5px solid var(--hairline); background:var(--bg);
          font-family:inherit; font-size:13px; font-weight:800; color:var(--text2); cursor:pointer; }
        .p30-day.done .p30-check { background:var(--accent); border-color:var(--accent); color:#fff; }
        .p30-t { font-size:14px; font-weight:700; }
        .p30-al { font-size:9.5px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; color:#C77B2E;
          background:color-mix(in srgb, #E8963C 16%, transparent); border-radius:6px; padding:2px 6px; margin-left:6px; vertical-align:middle; }
        .p30-cur-tag { font-size:9.5px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; color:#fff;
          background:var(--accent); border-radius:999px; padding:2px 8px; margin-left:6px; vertical-align:middle; }
        .p30-note { font-size:12.5px; color:var(--text2); line-height:1.45; margin-top:4px; }
        .p30-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
        .p30-lock { font-size:11px; font-weight:800; color:var(--terra); }
        .p30-locked-week { display:flex; flex-direction:column; gap:7px; width:100%; text-align:left; border:none; font-family:inherit;
          background:var(--card); border-radius:16px; padding:14px; box-shadow:var(--shadow); margin-bottom:8px; cursor:pointer; }
        .p30-locked-day { font-size:12.5px; color:var(--text2); filter:blur(0px); opacity:.65; }
        .p30-unlock { margin-top:6px; font-size:13px; font-weight:800; color:var(--accent); }
      `}</style>
    </div>
    {foodOpen && <ProductSheet food={foodOpen} onClose={() => setFoodOpen(null)} />}
    <Paywall open={pwOpen} onClose={() => setPwOpen(false)} onSuccess={() => setPrem(true)} />
    </>,
    document.body,
  );
}
