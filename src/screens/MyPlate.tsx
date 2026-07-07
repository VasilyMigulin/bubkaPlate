import { useMemo, useState } from 'react';
import { CATEGORIES, FOODS } from '../data/foods';
import { useStore } from '../state/store';
import { PlateScan } from '../components/PlateScan';
import './MyPlate.css';

const RX_BADGE: Record<string, { cls: string; label: string }> = {
  ok: { cls: 'ok', label: '💚 без реакции' },
  wait: { cls: 'wait', label: '👀 наблюдаю' },
  skin: { cls: 'bad', label: '🌡 кожа' },
  tummy: { cls: 'bad', label: '💩 живот' },
};

export function MyPlate({ goCatalog }: { goCatalog: () => void }) {
  const { introduced, log, windows, ironCovered, ironTotal, markAllergenDay, showToast } = useStore();
  const [scanOpen, setScanOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

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
      <button className="plate-cta" onClick={() => setScanOpen(true)}>
        <div className="pc-ico">📸</div>
        <div className="grow">
          <b>Проверить тарелку по фото</b>
          <span>ИИ оценит нарезку, возраст и баланс за 5 секунд</span>
        </div>
        <span className="pc-arrow">›</span>
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

      <div className="section-t">Ввод аллергенов · правило 3 дней</div>
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
        const f = FOODS.find((x) => x.id === l.id);
        const b = RX_BADGE[l.rx];
        return (
          <div key={i} className="fl-row">
            <div className="fl-e">{f?.e ?? '🥣'}</div>
            <div className="grow"><div className="fl-n">{f?.n ?? l.id}</div><div className="fl-d">{l.date}</div></div>
            <span className={`rx ${b.cls}`}>{b.label}</span>
          </div>
        );
      })}
      <button className="btn btn-soft" style={{ marginTop: 4 }} onClick={() => showToast('📄', 'PDF для аллерголога', 'Дневник и реакции готовы к отправке')}>
        📄 Сводка для аллерголога (PDF)
      </button>

      <div className="section-t">План на неделю</div>
      <div className="card next-card" style={{ background: 'var(--accent-soft)' }}>
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>Автоплан · bubka+ ✨</div>
        <div className="h-card">Неделя 3: жёлтые овощи + первое железо</div>
        <div className="sub" style={{ marginTop: 6 }}>Учитывает, что уже введено, напоминает повторять и добавляет новое раз в 2–3 дня утром. Со списком покупок.</div>
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => showToast('✨', 'bubka+', '7 дней бесплатно — скоро')}>Открыть план · 7 дней бесплатно</button>
      </div>

      {scanOpen && <PlateScan onClose={() => setScanOpen(false)} goSafety={goCatalog} />}
    </>
  );
}
