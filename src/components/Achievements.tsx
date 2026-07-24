import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BADGES, computeXP, earnedBadges, levelOf } from '../data/badges';
import { useStore } from '../state/store';

/** Достижения: уровень мамы-и-малыша + коллекция бейджей. */
export function Achievements({ onClose }: { onClose: () => void }) {
  const { log, introduced, windows, activeId, profile } = useStore();
  const ctx = useMemo(() => ({ log, introduced, windows }), [log, introduced, windows]);
  const earned = useMemo(() => new Set(earnedBadges(ctx).map((b) => b.id)), [ctx]);
  const xp = computeXP(ctx);
  const lvl = levelOf(xp);

  // всё увиденное — больше не «новое» на главной
  const SEEN_KEY = `bubka-plate-badges-seen-${activeId ?? ''}`;
  useEffect(() => {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...earned]));
  }, [earned, SEEN_KEY]);

  return createPortal(
    <div className="article-view">
      <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="ac-head">
        <div className="ac-level-e">{lvl.cur.e}</div>
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>Уровень {lvl.idx + 1} · {xp} XP</div>
        <h2>{lvl.cur.title}</h2>
        {lvl.next ? (
          <>
            <div className="ac-bar"><i style={{ width: `${lvl.pct}%` }} /></div>
            <div className="sub" style={{ marginTop: 6 }}>До «{lvl.next.title}» — ещё {lvl.next.xp - xp} XP. Опыт растёт с каждой записью в дневнике{profile ? `, ${profile.name} старается вместе с вами` : ''} 💛</div>
          </>
        ) : (
          <div className="sub" style={{ marginTop: 6 }}>Максимальный уровень. Вы — легенда прикорма!</div>
        )}
      </div>

      <div className="ac-body">
        <div className="section-t">Бейджи · {earned.size} из {BADGES.length}</div>
        <div className="ac-grid">
          {BADGES.map((b) => {
            const got = earned.has(b.id);
            return (
              <div key={b.id} className={`ac-tile ${got ? 'got' : ''}`}>
                <span className="ac-e">{got ? b.e : '🔒'}</span>
                <b>{b.title}</b>
                <i>{got ? 'Получен!' : b.hint}</i>
              </div>
            );
          })}
        </div>
        <div className="sub" style={{ marginTop: 14, lineHeight: 1.5 }}>
          Опыт считается честно — из ваших записей: проба +8, новый продукт +20, бейдж +40. Никаких покупок, только настоящий путь малыша.
        </div>
      </div>

      <style>{`
        .ac-head { padding:64px 20px 4px; text-align:center; }
        .ac-level-e { font-size:52px; margin-bottom:6px; }
        .ac-head h2 { font-size:24px; font-weight:780; letter-spacing:-.02em; }
        .ac-bar { height:9px; border-radius:999px; background:var(--elev); margin-top:12px; overflow:hidden; }
        .ac-bar i { display:block; height:100%; border-radius:999px; background:var(--accent); transition:width .5s ease; }
        .ac-body { padding:12px 18px calc(30px + env(safe-area-inset-bottom)); }
        .ac-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; }
        .ac-tile { display:flex; flex-direction:column; align-items:center; gap:3px; text-align:center;
          background:var(--card); border-radius:16px; padding:13px 8px 11px; box-shadow:var(--shadow); opacity:.55; }
        .ac-tile.got { opacity:1; border:1.5px solid color-mix(in srgb, var(--accent) 35%, transparent); }
        .ac-e { font-size:26px; }
        .ac-tile b { font-size:11px; font-weight:750; line-height:1.25; }
        .ac-tile i { font-style:normal; font-size:9.5px; color:var(--text2); line-height:1.3; }
        .ac-tile.got i { color:var(--accent); font-weight:700; }
      `}</style>
    </div>,
    document.body,
  );
}
