import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FOODS } from '../data/foods';
import { MAIN_PHOTOS } from '../data/mainPhotos';
import { useStore } from '../state/store';
import { Lightbox } from './Lightbox';
import type { Food, LogEntry } from '../types';

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

interface MonthData {
  key: string;
  label: string;
  entries: LogEntry[];
  newFoods: Food[];
  photos: string[];
  days: number;
  calmShare: number; // доля проб без реакции
}

function buildMonths(log: LogEntry[]): MonthData[] {
  const firstTry: Record<string, number> = {};
  [...log].reverse().forEach((l) => {
    if (!l.ts) return;
    const b = l.id.split(':')[0];
    if (!firstTry[b] || l.ts < firstTry[b]) firstTry[b] = l.ts;
  });
  const map = new Map<string, LogEntry[]>();
  log.forEach((l) => {
    if (!l.ts) return;
    const d = new Date(l.ts);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    map.set(key, [...(map.get(key) ?? []), l]);
  });
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, entries]) => {
      const [y, m] = key.split('-').map(Number);
      const start = new Date(y, m, 1).getTime();
      const end = new Date(y, m + 1, 1).getTime();
      const newIds = [...new Set(entries.map((l) => l.id.split(':')[0]))]
        .filter((b) => firstTry[b] >= start && firstTry[b] < end);
      const calm = entries.filter((l) => l.rx === 'ok').length;
      return {
        key,
        label: `${MONTHS_RU[m]} ${y}`,
        entries,
        newFoods: newIds.map((b) => FOODS.find((f) => f.id === b)!).filter(Boolean),
        photos: entries.filter((l) => l.photo).map((l) => l.photo!),
        days: new Set(entries.map((l) => new Date(l.ts!).getDate())).size,
        calmShare: entries.length ? Math.round((calm / entries.length) * 100) : 0,
      };
    });
}

function roundedImage(x: CanvasRenderingContext2D, img: HTMLImageElement, dx: number, dy: number, size: number, r: number) {
  x.save();
  x.beginPath();
  x.roundRect(dx, dy, size, size, r);
  x.clip();
  const s = Math.min(img.width, img.height);
  x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, dx, dy, size, size);
  x.restore();
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

/** Фильм месяца: тёплый recap прикорма — статистика, новые продукты, фото-моменты, шеринг картинкой. */
export function MonthFilm({ onClose }: { onClose: () => void }) {
  const { log, profile, showToast } = useStore();
  const months = useMemo(() => buildMonths(log), [log]);
  const [sel, setSel] = useState(0);
  const [lightbox, setLightbox] = useState<{ src: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const m = months[sel];

  const share = async () => {
    if (!m || busy) return;
    setBusy(true);
    try {
      const W = 1080, H = 1350;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const x = c.getContext('2d')!;
      x.fillStyle = '#FBF9F6'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#E6EBE6'; x.beginPath(); x.arc(W - 60, 40, 260, 0, 7); x.fill();
      x.fillStyle = '#F2E7DF'; x.beginPath(); x.arc(40, H - 30, 200, 0, 7); x.fill();

      x.fillStyle = '#8C8579'; x.font = '700 34px -apple-system, sans-serif';
      x.fillText('🎬 ФИЛЬМ МЕСЯЦА', 64, 96);
      x.fillStyle = '#2E2B27'; x.font = '800 78px -apple-system, sans-serif';
      x.fillText(m.label, 60, 186);
      x.fillStyle = '#6E7F72'; x.font = '650 40px -apple-system, sans-serif';
      x.fillText(`${profile?.name ?? 'Малыш'} и ${m.newFoods.length ? m.newFoods.length + ' новых вкусов' : 'новые вкусы'}`, 62, 246);

      // статы
      const stats: [string, string][] = [
        [`${m.newFoods.length}`, 'новых продуктов'],
        [`${m.entries.length}`, 'проб записано'],
        [`${m.calmShare}%`, 'прошли спокойно'],
      ];
      stats.forEach(([v, t], i) => {
        const bx = 60 + i * 330;
        x.fillStyle = '#FFFFFF';
        x.beginPath(); x.roundRect(bx, 300, 300, 190, 28); x.fill();
        x.fillStyle = '#2E2B27'; x.font = '800 64px -apple-system, sans-serif';
        x.fillText(v, bx + 34, 396);
        x.fillStyle = '#8C8579'; x.font = '650 28px -apple-system, sans-serif';
        x.fillText(t, bx + 34, 448);
      });

      // фото-моменты (до 4) или эмодзи новых продуктов
      const ph = m.photos.slice(0, 4);
      if (ph.length) {
        const imgs = await Promise.all(ph.map(loadImg));
        const size = ph.length === 1 ? 640 : 310;
        imgs.forEach((img, i) => {
          const col = i % 2, row = Math.floor(i / 2);
          roundedImage(x, img, 60 + col * (size + 20), 540 + row * (size + 20), ph.length === 1 ? 640 : size, 36);
        });
      }
      const emY = ph.length === 0 ? 620 : ph.length <= 2 ? 940 : 1230;
      if (ph.length === 0) {
        x.font = '96px -apple-system, sans-serif';
        const ems = m.newFoods.slice(0, 8).map((f) => f.e).join(' ');
        x.fillText(ems || '🥦 🥕 🍌', 60, emY);
        x.fillStyle = '#2E2B27'; x.font = '650 40px -apple-system, sans-serif';
        m.newFoods.slice(0, 5).forEach((f, i) => x.fillText(`· ${f.n}`, 64, emY + 90 + i * 58));
      }

      x.fillStyle = '#8C8579'; x.font = '650 32px -apple-system, sans-serif';
      x.fillText('Дневник прикорма — bubka plate 💛', 60, H - 60);

      const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.9));
      const file = new File([blob], `bubka-film-${m.key}.jpg`, { type: 'image/jpeg' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${m.label}: ${m.newFoods.length} новых вкусов у ${profile?.name ?? 'малыша'} 💛` });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        showToast('🎬', 'Картинка сохранена', 'Можно отправить в чат или сторис');
      }
    } catch { /* пользователь отменил шеринг */ }
    setBusy(false);
  };

  return createPortal(
    <>
    <div className="article-view">
      <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="mf-head">
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>🎬 Фильм месяца</div>
        <h2>{m ? m.label : 'Скоро будет что вспомнить'}</h2>
        {months.length > 1 && (
          <div className="mf-tabs">
            {months.map((mm, i) => (
              <button key={mm.key} className={`chip ${i === sel ? 'on' : ''}`} onClick={() => setSel(i)}>{mm.label}</button>
            ))}
          </div>
        )}
      </div>
      <div className="mf-body">
        {!m ? (
          <div className="note"><span className="ne">🎥</span><span>Фильм собирается из записей дневника: пробуйте, записывайте и добавляйте фото моментов — в конце месяца здесь будет тёплый пересказ вашего пути.</span></div>
        ) : (
          <>
            <div className="mf-stats">
              <div className="mf-stat"><b>{m.newFoods.length}</b><span>новых<br />продуктов</span></div>
              <div className="mf-stat"><b>{m.entries.length}</b><span>проб<br />записано</span></div>
              <div className="mf-stat"><b>{m.days}</b><span>дней<br />с пробами</span></div>
              <div className="mf-stat"><b>{m.calmShare}%</b><span>прошли<br />спокойно</span></div>
            </div>

            {m.photos.length > 0 && (
              <>
                <div className="section-t">Моменты месяца</div>
                <div className="mf-grid">
                  {m.photos.slice(0, 9).map((p, i) => (
                    <img key={i} src={p} alt="момент" className="tappable" onClick={() => setLightbox({ src: p })} />
                  ))}
                </div>
              </>
            )}

            {m.newFoods.length > 0 && (
              <>
                <div className="section-t">Новые вкусы месяца</div>
                <div className="mf-foods">
                  {m.newFoods.map((f) => (
                    <span key={f.id} className="mf-food">
                      {MAIN_PHOTOS[f.id] ? <img src={MAIN_PHOTOS[f.id]} alt={f.n} /> : <i>{f.e}</i>}
                      {f.n}
                    </span>
                  ))}
                </div>
              </>
            )}

            <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={share} disabled={busy}>
              {busy ? 'Собираем картинку…' : '📤 Поделиться фильмом'}
            </button>
            <div className="sub" style={{ textAlign: 'center', marginTop: 8 }}>Соберём красивую карточку месяца — для семьи, чата с бабушками или сторис.</div>
          </>
        )}
      </div>

      <style>{`
        .mf-head { padding:64px 20px 4px; }
        .mf-head h2 { font-size:24px; font-weight:750; letter-spacing:-.02em; }
        .mf-tabs { display:flex; gap:7px; margin-top:10px; flex-wrap:wrap; }
        .mf-body { padding:12px 18px calc(30px + env(safe-area-inset-bottom)); }
        .mf-stats { display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; }
        .mf-stat { background:var(--card); border-radius:14px; box-shadow:var(--shadow); padding:11px 8px; text-align:center; }
        .mf-stat b { font-size:19px; display:block; }
        .mf-stat span { font-size:10px; color:var(--text2); line-height:1.3; display:block; margin-top:2px; }
        .mf-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:7px; }
        .mf-grid img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:14px; }
        .mf-foods { display:flex; flex-wrap:wrap; gap:7px; }
        .mf-food { display:inline-flex; align-items:center; gap:7px; background:var(--card); border-radius:999px;
          padding:6px 13px 6px 6px; font-size:12.5px; font-weight:700; box-shadow:var(--shadow); }
        .mf-food img { width:26px; height:26px; border-radius:50%; object-fit:cover; }
        .mf-food i { font-style:normal; font-size:17px; }
      `}</style>
    </div>
    {lightbox && <Lightbox src={lightbox.src} onClose={() => setLightbox(null)} />}
    </>,
    document.body,
  );
}
