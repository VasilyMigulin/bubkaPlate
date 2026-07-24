import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FOODS, photosOf } from '../data/foods';
import { MAIN_PHOTOS } from '../data/mainPhotos';
import { useStore } from '../state/store';
import type { Food, LogEntry } from '../types';

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

interface MonthData {
  key: string;
  label: string;
  entries: LogEntry[];
  newFoods: Food[];
  photos: string[];
  days: number;
  calmShare: number;
  brave: Food[];      // аллергены, впервые введённые в этом месяце
  fav: { f: Food; n: number } | null; // любимчик: больше всего спокойных проб
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
    map.set(`${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`,
      [...(map.get(`${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`) ?? []), l]);
  });
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, entries]) => {
      const [y, m] = key.split('-').map(Number);
      const start = new Date(y, m, 1).getTime();
      const end = new Date(y, m + 1, 1).getTime();
      const newIds = [...new Set(entries.map((l) => l.id.split(':')[0]))]
        .filter((b) => firstTry[b] >= start && firstTry[b] < end);
      const newFoods = newIds.map((b) => FOODS.find((f) => f.id === b)!).filter(Boolean);
      const calm = entries.filter((l) => l.rx === 'ok').length;
      const okCount: Record<string, number> = {};
      entries.forEach((l) => { if (l.rx === 'ok') { const b = l.id.split(':')[0]; okCount[b] = (okCount[b] ?? 0) + 1; } });
      const favEntry = Object.entries(okCount).sort((a, b) => b[1] - a[1])[0];
      const favFood = favEntry ? FOODS.find((f) => f.id === favEntry[0]) : undefined;
      return {
        key,
        label: `${MONTHS_RU[m]} ${y}`,
        entries,
        newFoods,
        photos: entries.flatMap((l) => photosOf(l)),
        days: new Set(entries.map((l) => new Date(l.ts!).getDate())).size,
        calmShare: entries.length ? Math.round((calm / entries.length) * 100) : 0,
        brave: newFoods.filter((f) => f.allergen),
        fav: favFood && favEntry[1] >= 2 ? { f: favFood, n: favEntry[1] } : null,
      };
    });
}

function roundedImage(x: CanvasRenderingContext2D, img: HTMLImageElement, dx: number, dy: number, size: number, r: number) {
  x.save(); x.beginPath(); x.roundRect(dx, dy, size, size, r); x.clip();
  const s = Math.min(img.width, img.height);
  x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, dx, dy, size, size);
  x.restore();
}
const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

const CONFETTI = ['🎉', '💛', '🥕', '⭐', '🥦', '🍓', '✨', '🫐'];

/** Фильм месяца — сторис: интро → цифры → вкусы → фото → смелый шаг → любимчик → финал. */
export function MonthFilm({ onClose }: { onClose: () => void }) {
  const { log, profile, showToast } = useStore();
  const months = useMemo(() => buildMonths(log), [log]);
  const [sel, setSel] = useState(0);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const m = months[sel];

  type Slide = 'intro' | 'stats' | 'foods' | 'photos' | 'brave' | 'fav' | 'finale';
  const slides = useMemo<Slide[]>(() => {
    if (!m) return ['intro'];
    const out: Slide[] = ['intro', 'stats'];
    if (m.newFoods.length) out.push('foods');
    if (m.photos.length) out.push('photos');
    if (m.brave.length) out.push('brave');
    if (m.fav) out.push('fav');
    out.push('finale');
    return out;
  }, [m]);

  const go = (dir: 1 | -1) => {
    const n = step + dir;
    if (n < 0) return;
    if (n >= slides.length) { onClose(); return; }
    setStep(n);
  };

  const share = async () => {
    if (!m || busy) return;
    setBusy(true);
    try {
      const W = 1080, H = 1350;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
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
      const stats: [string, string][] = [
        [`${m.newFoods.length}`, 'новых продуктов'],
        [`${m.entries.length}`, 'проб записано'],
        [`${m.calmShare}%`, 'прошли спокойно'],
      ];
      stats.forEach(([v, t], i) => {
        const bx = 60 + i * 330;
        x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(bx, 300, 300, 190, 28); x.fill();
        x.fillStyle = '#2E2B27'; x.font = '800 64px -apple-system, sans-serif'; x.fillText(v, bx + 34, 396);
        x.fillStyle = '#8C8579'; x.font = '650 28px -apple-system, sans-serif'; x.fillText(t, bx + 34, 448);
      });
      const ph = m.photos.slice(0, 4);
      if (ph.length) {
        const imgs = await Promise.all(ph.map(loadImg));
        const size = ph.length === 1 ? 640 : 310;
        imgs.forEach((img, i) => roundedImage(x, img, 60 + (i % 2) * (size + 20), 540 + Math.floor(i / 2) * (size + 20), size, 36));
      } else {
        x.font = '96px -apple-system, sans-serif';
        x.fillText(m.newFoods.slice(0, 8).map((f) => f.e).join(' ') || '🥦 🥕 🍌', 60, 640);
        x.fillStyle = '#2E2B27'; x.font = '650 40px -apple-system, sans-serif';
        m.newFoods.slice(0, 5).forEach((f, i) => x.fillText(`· ${f.n}`, 64, 730 + i * 58));
      }
      x.fillStyle = '#8C8579'; x.font = '650 32px -apple-system, sans-serif';
      x.fillText('Дневник прикорма — bubka plate 💛', 60, H - 60);
      const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.9));
      const file = new File([blob], `bubka-film-${m.key}.jpg`, { type: 'image/jpeg' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${m.label}: ${m.newFoods.length} новых вкусов у ${profile?.name ?? 'малыша'} 💛` });
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
        showToast('🎬', 'Картинка сохранена', 'Можно отправить в чат или сторис');
      }
    } catch { /* отменили шеринг */ }
    setBusy(false);
  };

  const slide = slides[step];
  const tone = slide === 'intro' ? 'sage' : slide === 'stats' ? 'sand' : slide === 'foods' ? 'terra'
    : slide === 'photos' ? 'plain' : slide === 'brave' ? 'sage' : slide === 'fav' ? 'terra' : 'sage';

  return createPortal(
    <div className={`mfs mfs-${tone}`}>
      {/* прогресс-полоски и закрытие */}
      <div className="mfs-bars">
        {slides.map((_, i) => <i key={i} className={i < step ? 'done' : i === step ? 'cur' : ''} />)}
      </div>
      <button className="mfs-close" onClick={onClose} aria-label="Закрыть">✕</button>

      {/* тап-зоны: слева назад, справа вперёд */}
      <div className="mfs-tap left" onClick={() => go(-1)} />
      <div className="mfs-tap right" onClick={() => go(1)} />

      {!m ? (
        <div className="mfs-slide" key="empty">
          <div className="mfs-big-e">🎥</div>
          <h2>Скоро будет что вспомнить</h2>
          <p>Фильм собирается из записей дневника: пробуйте, записывайте, добавляйте фото — в конце месяца здесь будет тёплая история вашего пути.</p>
        </div>
      ) : slide === 'intro' ? (
        <div className="mfs-slide" key={`i${sel}`}>
          <div className="mfs-kicker">🎬 Фильм месяца</div>
          <h1>{m.label}</h1>
          <p className="mfs-lead">{profile?.name ?? 'Малыш'} и {m.newFoods.length ? `${m.newFoods.length} новых вкусов` : 'новые вкусы'}</p>
          {months.length > 1 && (
            <div className="mfs-months">
              {months.map((mm, i) => (
                <button key={mm.key} className={`chip ${i === sel ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); setSel(i); setStep(0); }}>{mm.label}</button>
              ))}
            </div>
          )}
          <div className="mfs-hint">тапни, чтобы смотреть →</div>
        </div>
      ) : slide === 'stats' ? (
        <div className="mfs-slide" key="s">
          <div className="mfs-kicker">Месяц в цифрах</div>
          <div className="mfs-nums">
            <div><b>{m.newFoods.length}</b><span>новых продуктов</span></div>
            <div><b>{m.entries.length}</b><span>проб записано</span></div>
            <div><b>{m.days}</b><span>дней с пробами</span></div>
            <div><b>{m.calmShare}%</b><span>прошли спокойно</span></div>
          </div>
        </div>
      ) : slide === 'foods' ? (
        <div className="mfs-slide" key="f">
          <div className="mfs-kicker">Новые вкусы</div>
          <div className="mfs-emoji-rain">{m.newFoods.slice(0, 12).map((f, i) => <span key={f.id} style={{ animationDelay: `${i * 0.07}s` }}>{f.e}</span>)}</div>
          <div className="mfs-foodlist">
            {m.newFoods.slice(0, 8).map((f) => (
              <span key={f.id} className="mfs-food">
                {MAIN_PHOTOS[f.id] ? <img src={MAIN_PHOTOS[f.id]} alt={f.n} /> : <i>{f.e}</i>}
                {f.n}
              </span>
            ))}
            {m.newFoods.length > 8 && <span className="mfs-food">и ещё {m.newFoods.length - 8}…</span>}
          </div>
        </div>
      ) : slide === 'photos' ? (
        <div className="mfs-slide" key="p">
          <div className="mfs-kicker">Моменты месяца</div>
          <div className={`mfs-photos n${Math.min(m.photos.length, 4)}`}>
            {m.photos.slice(0, 4).map((p, i) => <img key={i} src={p} alt="момент" style={{ animationDelay: `${i * 0.1}s` }} />)}
          </div>
          {m.photos.length > 4 && <p className="mfs-lead">и ещё {m.photos.length - 4} в дневнике</p>}
        </div>
      ) : slide === 'brave' ? (
        <div className="mfs-slide" key="b">
          <div className="mfs-kicker">Самый смелый шаг</div>
          <div className="mfs-big-e">🛡</div>
          <h2>{m.brave.map((f) => f.n).join(', ')}</h2>
          <p>{m.brave.length === 1 ? 'Настоящий аллерген — и вы справились. Это большое дело.' : `${m.brave.length} аллергена за месяц — вы очень смелые!`}</p>
        </div>
      ) : slide === 'fav' ? (
        <div className="mfs-slide" key="v">
          <div className="mfs-kicker">Любимчик месяца</div>
          {m.fav && (MAIN_PHOTOS[m.fav.f.id]
            ? <img className="mfs-fav-pic" src={MAIN_PHOTOS[m.fav.f.id]} alt={m.fav.f.n} />
            : <div className="mfs-big-e">{m.fav.f.e}</div>)}
          <h2>{m.fav?.f.n}</h2>
          <p>{m.fav?.n} спокойных проб — кажется, это любовь 💛</p>
        </div>
      ) : (
        <div className="mfs-slide" key="fin">
          {CONFETTI.map((e, i) => <span key={i} className="mfs-conf" style={{ left: `${8 + i * 12}%`, animationDelay: `${i * 0.25}s` }}>{e}</span>)}
          <div className="mfs-big-e">🎉</div>
          <h2>Отличный месяц!</h2>
          <p>{profile?.name ?? 'Малыш'} растёт, пробует и удивляет. Сохраните этот месяц на память — или похвастайтесь семье.</p>
          <button className="btn btn-primary mfs-share" onClick={(e) => { e.stopPropagation(); share(); }} disabled={busy}>
            {busy ? 'Собираем картинку…' : '📤 Поделиться фильмом'}
          </button>
        </div>
      )}

      <style>{`
        .mfs { position:fixed; inset:0; z-index:60; max-width:440px; margin:0 auto; overflow:hidden;
          display:flex; align-items:center; justify-content:center; animation:viewin .3s ease; }
        .mfs-sage { background:linear-gradient(165deg, var(--accent-soft), var(--bg) 80%); }
        .mfs-sand { background:linear-gradient(165deg, var(--sand-soft), var(--bg) 80%); }
        .mfs-terra { background:linear-gradient(165deg, var(--terra-soft), var(--bg) 80%); }
        .mfs-plain { background:var(--bg); }
        .mfs-bars { position:absolute; top:calc(10px + env(safe-area-inset-top)); left:14px; right:56px; display:flex; gap:5px; z-index:3; }
        .mfs-bars i { flex:1; height:3.5px; border-radius:999px; background:color-mix(in srgb, var(--text) 14%, transparent); }
        .mfs-bars i.done { background:var(--accent); }
        .mfs-bars i.cur { background:var(--accent); opacity:.55; }
        .mfs-close { position:absolute; top:calc(20px + env(safe-area-inset-top)); right:14px; width:34px; height:34px;
          border:none; border-radius:50%; background:var(--card); box-shadow:var(--shadow); font-size:14px; z-index:4; cursor:pointer; }
        .mfs-tap { position:absolute; top:0; bottom:0; width:38%; z-index:2; }
        .mfs-tap.left { left:0; } .mfs-tap.right { right:0; width:62%; }
        .mfs-slide { position:relative; z-index:1; padding:32px 30px; text-align:center; max-width:100%;
          animation:mfsin .45s cubic-bezier(.22,.9,.3,1) both; pointer-events:none; }
        .mfs-slide .chip, .mfs-slide .mfs-share { pointer-events:auto; }
        @keyframes mfsin { from { opacity:0; transform:translateY(16px) scale(.98); } to { opacity:1; transform:none; } }
        .mfs-kicker { font-size:12px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; color:var(--accent); margin-bottom:14px; }
        .mfs h1 { font-size:40px; font-weight:820; letter-spacing:-.02em; }
        .mfs h2 { font-size:26px; font-weight:800; letter-spacing:-.02em; margin-top:6px; }
        .mfs p, .mfs-lead { font-size:15px; color:var(--text2); line-height:1.55; margin-top:10px; }
        .mfs-hint { margin-top:36px; font-size:12px; font-weight:700; color:var(--text2); opacity:.7; }
        .mfs-months { display:flex; flex-wrap:wrap; gap:7px; justify-content:center; margin-top:18px; }
        .mfs-big-e { font-size:74px; margin-bottom:8px; animation:mfspop .5s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes mfspop { from { transform:scale(.3); opacity:0; } to { transform:none; opacity:1; } }
        .mfs-nums { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:6px; }
        .mfs-nums div { background:var(--card); border-radius:20px; padding:22px 12px; box-shadow:var(--shadow); animation:mfsin .5s ease both; }
        .mfs-nums div:nth-child(2) { animation-delay:.08s; } .mfs-nums div:nth-child(3) { animation-delay:.16s; } .mfs-nums div:nth-child(4) { animation-delay:.24s; }
        .mfs-nums b { font-size:34px; font-weight:820; display:block; }
        .mfs-nums span { font-size:12px; color:var(--text2); display:block; margin-top:4px; }
        .mfs-emoji-rain { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; font-size:34px; margin-bottom:16px; }
        .mfs-emoji-rain span { animation:mfspop .5s cubic-bezier(.34,1.56,.64,1) both; }
        .mfs-foodlist { display:flex; flex-wrap:wrap; gap:7px; justify-content:center; }
        .mfs-food { display:inline-flex; align-items:center; gap:7px; background:var(--card); border-radius:999px;
          padding:6px 13px 6px 6px; font-size:12.5px; font-weight:700; box-shadow:var(--shadow); }
        .mfs-food img { width:26px; height:26px; border-radius:50%; object-fit:cover; }
        .mfs-food i { font-style:normal; font-size:17px; padding-left:4px; }
        .mfs-photos { display:grid; gap:10px; }
        .mfs-photos.n1 { grid-template-columns:1fr; } .mfs-photos.n2 { grid-template-columns:1fr 1fr; }
        .mfs-photos.n3, .mfs-photos.n4 { grid-template-columns:1fr 1fr; }
        .mfs-photos img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:22px; box-shadow:var(--shadow-lg); animation:mfsin .5s ease both; }
        .mfs-fav-pic { width:130px; height:130px; border-radius:50%; object-fit:cover; box-shadow:var(--shadow-lg); animation:mfspop .5s cubic-bezier(.34,1.56,.64,1) both; }
        .mfs-share { margin-top:22px; width:100%; }
        .mfs-conf { position:absolute; top:-40px; font-size:26px; animation:mfsfall 2.6s linear infinite; }
        @keyframes mfsfall { to { transform:translateY(110vh) rotate(340deg); } }
      `}</style>
    </div>,
    document.body,
  );
}
