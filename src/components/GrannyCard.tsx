import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BIG_ALLERGENS, FOODS } from '../data/foods';
import { MAIN_PHOTOS } from '../data/mainPhotos';
import { useStore } from '../state/store';

const FORBIDDEN = [
  '🍯 Мёд — строго нельзя до года (риск ботулизма)',
  '🧂 Соль и сахар — не добавлять вообще',
  '🥜 Целые орехи и семечки — риск подавиться до 4–5 лет',
  '🍇 Виноград, черри, кругляши — только четвертинками вдоль',
  '🥛 Коровье молоко как питьё — не раньше года',
  '🌭 Колбаса, сосиски, копчёное, жареное — не для малыша',
];

function cutRules(age: number): string[] {
  if (age < 9) return [
    'Всё мягкое: разминается между пальцами',
    'Полоски размером с палец взрослого — малыш держит кулачком',
    'Никаких кругляшей и твёрдых кусочков',
  ];
  if (age < 12) return [
    'Мягкие кусочки размером примерно 1 см',
    'Виноград и черри — четвертинками вдоль, всегда',
    'Твёрдое (яблоко, морковь) — только тёртое или запечённое',
  ];
  return [
    'Небольшие кусочки с общего стола — без соли и сахара',
    'Кругляши по-прежнему четвертинками, орехи только молотые',
    'Есть — только сидя и под присмотром, не на ходу',
  ];
}

/** Памятка для бабушки и няни: что можно, что строго нельзя, как резать, куда звонить. */
export function GrannyCard({ onClose }: { onClose: () => void }) {
  const { profile, introduced, windows, ageMonths, ageMonthsReal, showToast } = useStore();
  const [busy, setBusy] = useState(false);
  const age = ageMonths ?? 6;

  const canEat = useMemo(() => FOODS.filter((f) => introduced.has(f.id)), [introduced]);
  const badFoods = useMemo(() => windows.filter((w) => w.reaction === 'bad')
    .map((w) => FOODS.find((f) => f.id === w.id)!).filter(Boolean), [windows]);
  const notIntroducedAllergens = useMemo(() => {
    const covered = new Set(FOODS.filter((f) => f.allergen && introduced.has(f.id)).map((f) => f.allergen));
    return [...BIG_ALLERGENS].filter((a) => !covered.has(a));
  }, [introduced]);
  const emNum = localStorage.getItem('bubka-plate-emergency') || '112';

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const W = 1080, H = 1500;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d')!;
      x.fillStyle = '#FBF9F6'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#E6EBE6'; x.beginPath(); x.arc(W - 40, 30, 220, 0, 7); x.fill();

      x.fillStyle = '#8C8579'; x.font = '700 34px -apple-system, sans-serif';
      x.fillText('👵 ПАМЯТКА ДЛЯ БАБУШКИ И НЯНИ', 60, 92);
      x.fillStyle = '#2E2B27'; x.font = '800 66px -apple-system, sans-serif';
      x.fillText(`${profile?.name ?? 'Малыш'} · ${ageMonthsReal ?? age} мес`, 60, 172);

      // главное правило
      x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(60, 210, W - 120, 120, 26); x.fill();
      x.fillStyle = '#53645A'; x.font = '750 38px -apple-system, sans-serif';
      x.fillText('Главное: новые продукты — только с мамой.', 90, 262);
      x.fillStyle = '#2E2B27'; x.font = '650 32px -apple-system, sans-serif';
      x.fillText('Угощать можно тем, что уже в списке «можно».', 90, 306);

      let y = 396;
      const section = (title: string, color: string) => {
        x.fillStyle = color; x.font = '800 34px -apple-system, sans-serif';
        x.fillText(title, 60, y); y += 14;
      };
      const line = (t: string) => { y += 44; x.fillStyle = '#2E2B27'; x.font = '600 30px -apple-system, sans-serif'; x.fillText(t, 76, y); };

      section('❌ СТРОГО НЕЛЬЗЯ', '#C46A5A');
      FORBIDDEN.forEach((f) => line(f));
      y += 58;

      if (badFoods.length) {
        section('⚠️ БЫЛА РЕАКЦИЯ — НЕ ДАВАТЬ', '#C46A5A');
        line(badFoods.map((f) => `${f.e} ${f.n}`).join('   '));
        y += 58;
      }

      section(`🔪 КАК РЕЗАТЬ В ${ageMonthsReal ?? age} МЕС`, '#53645A');
      cutRules(age).forEach((r) => line('• ' + r));
      y += 58;

      section('🚑 ЕСЛИ ЧТО-ТО НЕ ТАК', '#C46A5A');
      line(`Отёк губ, тяжёлое дыхание, вялость → скорая: ${emNum}`);
      line('И сразу звоните маме.');

      x.fillStyle = '#8C8579'; x.font = '650 30px -apple-system, sans-serif';
      x.fillText('Полная памятка и список «можно» — в приложении bubka plate 💛', 60, H - 56);

      const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.9));
      const file = new File([blob], 'bubka-babushka.jpg', { type: 'image/jpeg' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `Памятка: как кормить ${profile?.name ?? 'малыша'} 💛` });
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
        showToast('👵', 'Памятка сохранена', 'Отправьте бабушке в мессенджер');
      }
    } catch { /* отменили */ }
    setBusy(false);
  };

  return createPortal(
    <div className="article-view">
      <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="gc-head">
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>👵 Памятка для бабушки и няни</div>
        <h2>{profile?.name ?? 'Малыш'} · {ageMonthsReal ?? age} мес</h2>
        <div className="sub" style={{ marginTop: 4 }}>Покажите или отправьте тем, кто остаётся с малышом. Спокойнее будет всем.</div>
      </div>
      <div className="gc-body">
        <div className="gc-rule">
          <b>Главное правило</b>
          Новые продукты — только с мамой. Угощать можно тем, что уже в списке «можно» ниже.
        </div>

        <div className="section-t" style={{ color: 'var(--danger)' }}>❌ Строго нельзя</div>
        <ul className="gc-list">
          {FORBIDDEN.map((f) => <li key={f}>{f}</li>)}
        </ul>

        {badFoods.length > 0 && (
          <>
            <div className="section-t" style={{ color: 'var(--danger)' }}>⚠️ Была реакция — не давать</div>
            <div className="gc-chips">
              {badFoods.map((f) => <span key={f.id} className="gc-chip bad">{f.e} {f.n}</span>)}
            </div>
          </>
        )}

        <div className="section-t">🥜 Не вводить без мамы</div>
        <div className="sub" style={{ margin: '-4px 2px 8px' }}>Эти аллергены малыш ещё не пробовал — их первая проба только с родителями:</div>
        <div className="gc-chips">
          {notIntroducedAllergens.map((a) => <span key={a} className="gc-chip">{a}</span>)}
          {notIntroducedAllergens.length === 0 && <span className="sub">все главные аллергены уже введены 🎉</span>}
        </div>

        <div className="section-t">🔪 Как резать в {ageMonthsReal ?? age} мес</div>
        <ul className="gc-list">
          {cutRules(age).map((r) => <li key={r}>{r}</li>)}
        </ul>

        <div className="section-t">💚 Можно — уже в рационе ({canEat.length})</div>
        <div className="gc-chips">
          {canEat.slice(0, 24).map((f) => (
            <span key={f.id} className="gc-chip">
              {MAIN_PHOTOS[f.id] ? <img src={MAIN_PHOTOS[f.id]} alt={f.n} /> : f.e} {f.n}
            </span>
          ))}
          {canEat.length > 24 && <span className="gc-chip">и ещё {canEat.length - 24}…</span>}
        </div>

        <div className="gc-sos">
          🚑 Отёк губ или языка, тяжёлое дыхание, вялость — <b>скорая: {emNum}</b> и сразу звонок маме.
        </div>

        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={share} disabled={busy}>
          {busy ? 'Собираем памятку…' : '📤 Отправить памятку'}
        </button>
        <div className="sub" style={{ textAlign: 'center', marginTop: 8 }}>Уйдёт картинкой — удобно переслать в семейный чат.</div>
      </div>

      <style>{`
        .gc-head { padding:64px 20px 4px; }
        .gc-head h2 { font-size:24px; font-weight:750; letter-spacing:-.02em; }
        .gc-body { padding:12px 18px calc(30px + env(safe-area-inset-bottom)); }
        .gc-rule { background:var(--accent-soft); border:1.5px solid color-mix(in srgb, var(--accent) 30%, transparent);
          border-radius:16px; padding:13px 15px; font-size:13.5px; line-height:1.5; }
        .gc-rule b { display:block; margin-bottom:3px; }
        .gc-list { list-style:none; }
        .gc-list li { font-size:13px; line-height:1.5; padding:7px 0 7px 4px; border-bottom:1px solid var(--hairline); }
        .gc-chips { display:flex; flex-wrap:wrap; gap:7px; }
        .gc-chip { display:inline-flex; align-items:center; gap:6px; background:var(--card); border-radius:999px;
          padding:6px 12px; font-size:12px; font-weight:700; box-shadow:var(--shadow); }
        .gc-chip img { width:22px; height:22px; border-radius:50%; object-fit:cover; }
        .gc-chip.bad { background:color-mix(in srgb, var(--danger) 10%, var(--card)); color:var(--danger); }
        .gc-sos { margin-top:16px; background:color-mix(in srgb, var(--danger) 9%, transparent);
          border:1px solid color-mix(in srgb, var(--danger) 30%, transparent); border-radius:14px;
          padding:12px 14px; font-size:13px; line-height:1.5; }
      `}</style>
    </div>,
    document.body,
  );
}
