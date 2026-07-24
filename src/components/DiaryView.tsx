import { useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveFoodRef } from '../data/foods';
import { MAIN_PHOTOS } from '../data/mainPhotos';
import { useStore } from '../state/store';
import { Lightbox } from './Lightbox';
import { DoctorReport } from './DoctorReport';

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((t0 - d0) / 864e5);
  return diff === 0 ? 'Сегодня' : diff === 1 ? 'Вчера' : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

const RX_BADGE: Record<string, { cls: string; label: string }> = {
  ok: { cls: 'ok', label: '💚 без реакции' },
  wait: { cls: 'wait', label: '👀 наблюдаю' },
  skin: { cls: 'bad', label: '🌡 кожа' },
  tummy: { cls: 'bad', label: '💩 живот' },
};

/** Полный дневник прикорма: все записи + выписка для врача. */
export function DiaryView({ onClose }: { onClose: () => void }) {
  const { log, introduced } = useStore();
  const [lightbox, setLightbox] = useState<{ src: string; alt?: string } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  return createPortal(
    <>
    <div className="article-view">
      <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="dv-head">
        <h2>📔 Дневник прикорма</h2>
        <div className="sub" style={{ marginTop: 4 }}>{log.length} записей · {introduced.size} продуктов введено</div>
        <button className="btn btn-soft" style={{ marginTop: 12 }} onClick={() => setReportOpen(true)}>
          📄 Выписка для врача
        </button>
      </div>
      <div className="dv-body">
        {log.length === 0 && (
          <div className="note"><span className="ne">🥄</span><span>Пока пусто. Запишите первую пробу с главного экрана — «+ Записать пробу».</span></div>
        )}
        {log.map((l, i) => {
          const ref = resolveFoodRef(l.id);
          const name = ref.label ?? ref.food?.n ?? l.id;
          const b = RX_BADGE[l.rx];
          const dayOf = (e: typeof l) => (e.ts ? dayLabel(e.ts) : e.date.split(',')[0]);
          const header = i === 0 || dayOf(log[i - 1]) !== dayOf(l) ? dayOf(l) : null;
          return (
            <div key={i}>
            {header && <div className="dv-day">{header}</div>}
            <div className="fl-card">
              <div className="fl-row">
                {ref.food && MAIN_PHOTOS[ref.food.id]
                  ? <img className="fl-pic" src={MAIN_PHOTOS[ref.food.id]} alt={name} />
                  : <div className="fl-e">{ref.food?.e ?? '🥣'}</div>}
                <div className="grow"><div className="fl-n">{name}</div><div className="fl-d">{l.date}</div></div>
                <span className={`rx ${b.cls}`}>{b.label}</span>
              </div>
              {(l.note || l.photo) && (
                <div className="fl-extra">
                  {l.photo && <img className="fl-photo tappable" src={l.photo} alt="момент" onClick={() => setLightbox({ src: l.photo!, alt: name })} />}
                  {l.note && <div className="fl-note">{l.note}</div>}
                </div>
              )}
            </div>
            </div>
          );
        })}
      </div>
      <style>{`
        .dv-head { padding:64px 20px 4px; }
        .dv-head h2 { font-size:24px; font-weight:750; letter-spacing:-.02em; }
        .dv-body { padding:10px 18px calc(30px + env(safe-area-inset-bottom)); }
      `}</style>
    </div>
    {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
    {reportOpen && <DoctorReport onClose={() => setReportOpen(false)} />}
    </>,
    document.body,
  );
}
