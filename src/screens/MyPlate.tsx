import { useMemo, useState } from 'react';
import { CATEGORIES, FOODS , resolveFoodRef } from '../data/foods';
import { PORTIONS, READINESS, SCHEDULE } from '../data/schedule';
import { useStore } from '../state/store';
import { Plan30Sheet } from '../components/Plan30Sheet';
import { RULE3_TEXT } from '../data/glossary';
import { Lightbox } from '../components/Lightbox';
import { PlateScan } from '../components/PlateScan';
import './MyPlate.css';

const RX_BADGE: Record<string, { cls: string; label: string }> = {
  ok: { cls: 'ok', label: '💚 без реакции' },
  wait: { cls: 'wait', label: '👀 наблюдаю' },
  skin: { cls: 'bad', label: '🌡 кожа' },
  tummy: { cls: 'bad', label: '💩 живот' },
};

export function MyPlate({ goCatalog }: { goCatalog: () => void }) {
  const [plan30Open, setPlan30Open] = useState(false);
  const { introduced, log, windows, ironCovered, ironTotal, markAllergenDay, showToast,
    ageMonths, readiness, toggleReadiness, resetAll } = useStore();
  const [scanOpen, setScanOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [schedOpen, setSchedOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt?: string } | null>(null);
  const [ruleOpen, setRuleOpen] = useState(false);

  const notReady = ageMonths != null && ageMonths < 6;
  const readyCount = READINESS.filter((r) => readiness.has(r.key)).length;

  const coverage = useMemo(() =>
    CATEGORIES.map((cat) => {
      const ids = FOODS.filter((f) => f.cat === cat);
      const done = ids.filter((f) => introduced.has(f.id)).length;
      return { cat, done, total: ids.length, pct: Math.round((done / ids.length) * 100) };
    }), [introduced]);

  const weakest = [...coverage].sort((a, b) => a.pct - b.pct)[0];
  const introducedCount = introduced.size;

  return (
    <>
      {notReady && (
        <div className="card ready-card">
          <div className="eyebrow" style={{ color: 'var(--terra)' }}>Скоро прикорм · готовность</div>
          <div className="h-card" style={{ marginTop: 2 }}>{readyCount} из {READINESS.length} признаков</div>
          <div className="sub" style={{ marginTop: 4 }}>Прикорм начинают около 6 месяцев и когда малыш готов. Отметьте, что уже есть:</div>
          <div className="ready-list">
            {READINESS.map((r) => {
              const on = readiness.has(r.key);
              return (
                <button key={r.key} className={`ready-item ${on ? 'on' : ''}`} onClick={() => toggleReadiness(r.key)}>
                  <span className="ready-box">{on ? '✓' : ''}</span>
                  <span className="ready-e">{r.e}</span>
                  <span className="grow">{r.text}</span>
                </button>
              );
            })}
          </div>
          {readyCount === READINESS.length && (
            <div className="note" style={{ marginTop: 10 }}><span className="ne">🎉</span><span>Все признаки есть — можно знакомиться с первым овощем. Загляните в «Схему введения» ниже.</span></div>
          )}
        </div>
      )}

      <button className="plate-cta" onClick={() => setScanOpen(true)}>
        <div className="pc-ico">📸</div>
        <div className="grow">
          <b>Проверить тарелку по фото</b>
          <span>ИИ оценит нарезку, возраст и баланс за 5 секунд</span>
        </div>
        <span className="pc-arrow">›</span>
      </button>

      <button className="card next-card" onClick={() => setPlan30Open(true)}>
        <div className="row">
          <div className="next-e">🗓</div>
          <div className="grow">
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>План новичка</div>
            <div className="h-card" style={{ margin: '2px 0 0' }}>Первые 30 дней прикорма</div>
            <div className="sub">Что и когда вводить — по шагам</div>
          </div>
          <span style={{ color: 'var(--text2)' }}>›</span>
        </div>
      </button>

      <button className="card next-card" onClick={goCatalog}>
        <div className="row">
          <div className="next-e">🌟</div>
          <div className="grow">
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>Что ввести дальше</div>
            <div className="h-card" style={{ margin: '2px 0 0' }}>{weakest.cat}</div>
            <div className="sub">{ironCovered < ironTotal ? 'и добавьте железо — мясо, желток, чечевицу' : 'группа покрыта меньше всего'}</div>
          </div>
          <span style={{ color: 'var(--text2)' }}>›</span>
        </div>
      </button>

      <button className="fmap-status" onClick={() => setMapOpen((v) => !v)}>
        <div className="fs-item"><span className="fs-e">🥩</span><b>{ironCovered}/{ironTotal}</b><span>железо</span></div>
        <div className="fs-item"><span className="fs-e">🌈</span><b>{introducedCount}/{FOODS.length}</b><span>продуктов</span></div>
        <span className="fs-chev" style={{ transform: mapOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {mapOpen && (
        <div className="rise">
          <div className="fmap-iron">
            <div className="eyebrow" style={{ color: 'var(--terra)' }}>Фокус после 6 месяцев</div>
            <div className="row" style={{ marginTop: 4 }}>
              <div className="grow">
                <div className="fmap-big">{ironCovered} из {ironTotal}</div>
                <div className="sub" style={{ color: 'var(--text)', marginTop: 2 }}>источника железа в рационе</div>
              </div>
              <div style={{ fontSize: 34 }}>🥩</div>
            </div>
            <div className="sub" style={{ marginTop: 8 }}>Запасы железа истощаются к 6 мес — ради этого и вводят прикорм. Добавьте мясо, желток или чечевицу.</div>
          </div>
          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 4 }}>Покрытие групп</div>
            {coverage.map((c) => (
              <div key={c.cat} className="fmap-row">
                <div className="grow">
                  <div className="fmap-n">{c.cat}</div>
                  <div className="fmap-bar"><i className={c.pct < 50 ? 'low' : ''} style={{ width: `${c.pct}%` }} /></div>
                </div>
                <div className="fm-cnt">{c.done}/{c.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-t" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>Ввод аллергенов · правило 3 дней
        <button className="skill-i" onClick={() => setRuleOpen(true)} aria-label="Что это">?</button>
      </div>
      {windows.length === 0 && (
        <div className="note"><span className="ne">🥜</span><span>Новый аллерген вводят утром, малой дозой, 3 дня подряд. Начните из карточки продукта.</span></div>
      )}
      {windows.map((w) => {
        const f = FOODS.find((x) => x.id === w.id)!;
        const safe = w.day >= 3 && w.reaction !== 'bad';
        const status = w.reaction === 'bad' ? '⚠️ была реакция — пауза, к врачу'
          : safe ? '✓ 3 дня без реакции — введён' : `день ${w.day} из 3 · реакции нет`;
        return (
          <div key={w.id} className={`allerg-win ${safe ? 'safe' : ''}`}>
            <div style={{ fontSize: 22 }}>{f.e}</div>
            <div className="grow">
              <div className="fmap-n">{f.n}</div>
              <div className="fm-d">{status}</div>
              <div className="aw-days">{[1, 2, 3].map((d) => <i key={d} className={d <= w.day ? 'on' : ''} />)}</div>
            </div>
            {!safe && w.reaction !== 'bad' && (
              <button className="aw-check" onClick={() => { markAllergenDay(w.id); showToast('🗓', f.n, `День ${Math.min(w.day + 1, 3)} из 3`); }} aria-label="Отметить день">✓</button>
            )}
          </div>
        );
      })}

      <div className="section-t">Дневник прикорма</div>
      {log.map((l, i) => {
        const ref = resolveFoodRef(l.id);
        const f = ref.food;
        const name = ref.label ?? f?.n ?? l.id;
        const b = RX_BADGE[l.rx];
        return (
          <div key={i} className="fl-card">
            <div className="fl-row">
              <div className="fl-e">{f?.e ?? '🥣'}</div>
              <div className="grow"><div className="fl-n">{name}</div><div className="fl-d">{l.date}</div></div>
              <span className={`rx ${b.cls}`}>{b.label}</span>
            </div>
            {(l.note || l.photo) && (
              <div className="fl-extra">
                {l.photo && <img className="fl-photo tappable" src={l.photo} alt="момент" onClick={() => setLightbox({ src: l.photo!, alt: name + " · первая проба" })} />}
                {l.note && <div className="fl-note">{l.note}</div>}
              </div>
            )}
          </div>
        );
      })}
      <button className="btn btn-soft" style={{ marginTop: 4 }} onClick={() => showToast('📄', 'PDF для аллерголога', 'Дневник и реакции готовы к отправке')}>
        📄 Сводка для аллерголога (PDF)
      </button>

      <div className="section-t">Схема введения по неделям</div>
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
                return f ? <button key={id} className="sched-chip" onClick={goCatalog}>{f.e} {f.n}</button> : null;
              })}
            </div>
            <div className="sched-note">{w.note}</div>
          </div>
        ))}
      </div>

      <button className="fmap-status" onClick={() => setSchedOpen((v) => !v)}>
        <div className="fs-item"><span className="fs-e">⚖️</span><b>Объёмы порций</b><span>по возрасту</span></div>
        <span className="fs-chev" style={{ transform: schedOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      {schedOpen && (
        <div className="card rise">
          {PORTIONS.map((p) => (
            <div key={p.months} className="portion-row">
              <div className="portion-m">{p.months}</div>
              <div className="grow"><div className="portion-p">{p.portion}</div><div className="fm-d">{p.meals}</div></div>
            </div>
          ))}
          <div className="sub" style={{ marginTop: 8 }}>Ориентир. Молоко или смесь — по требованию сверх прикорма. Аппетит малыша важнее граммов.</div>
        </div>
      )}

      <button className="reset-link" onClick={() => { if (confirm('Сбросить профиль и данные? Пройдёте онбординг заново.')) resetAll(); }}>
        Сбросить профиль (демо)
      </button>

      {scanOpen && <PlateScan onClose={() => setScanOpen(false)} goSafety={goCatalog} />}

      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

      {ruleOpen && (
        <div className="skill-pop-scrim" onClick={() => setRuleOpen(false)}>
          <div className="skill-pop" onClick={(e) => e.stopPropagation()}>
            <div className="skill-pop-text">{RULE3_TEXT}</div>
            <button className="btn btn-soft" onClick={() => setRuleOpen(false)}>Понятно</button>
          </div>
        </div>
      )}
      {plan30Open && <Plan30Sheet onClose={() => setPlan30Open(false)} />}
    </>
  );
}
