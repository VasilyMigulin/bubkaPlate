import { createPortal } from 'react-dom';
import { CATEGORIES, FOODS } from '../data/foods';
import { useStore } from '../state/store';

const RX_TEXT: Record<string, string> = {
  ok: 'без реакции',
  wait: 'под наблюдением',
  skin: 'реакция: кожа (сыпь/покраснение)',
  tummy: 'реакция: живот или стул',
};

function ageLabel(m: number | null): string {
  if (m == null) return '';
  if (m < 12) return `${m} мес`;
  const y = Math.floor(m / 12);
  return m % 12 ? `${y} г ${m % 12} мес` : `${y} г`;
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('ru-RU'); } catch { return iso; }
}

/** Выписка для врача: сводка рациона и реакций к любому приёму — педиатр, аллерголог, гастроэнтеролог. */
export function DoctorReport({ onClose }: { onClose: () => void }) {
  const { profile, introduced, log, windows, ironCovered, ironTotal, ageMonths, showToast } = useStore();
  if (!profile) return null;

  const today = new Date().toLocaleDateString('ru-RU');
  const reactions = log.filter((l) => l.rx === 'skin' || l.rx === 'tummy');
  const nameOf = (id: string) => FOODS.find((f) => f.id === id.split(':')[0])?.n ?? id;

  const allergenFoods = FOODS.filter((f) => f.allergen);
  const aDone = allergenFoods.filter((f) => introduced.has(f.id) && !windows.some((w) => w.id === f.id && w.reaction === 'bad'));
  const aBad = allergenFoods.filter((f) => windows.some((w) => w.id === f.id && w.reaction === 'bad'));
  const aInWork = allergenFoods.filter((f) => windows.some((w) => w.id === f.id && w.day < 3 && w.reaction !== 'bad'));
  const aTodo = allergenFoods.filter((f) => !introduced.has(f.id) && !windows.some((w) => w.id === f.id));

  const byCat = CATEGORIES.map((cat) => ({
    cat,
    foods: FOODS.filter((f) => f.cat === cat && introduced.has(f.id)),
  })).filter((g) => g.foods.length > 0);

  const shareText = () => {
    const lines = [
      `Дневник прикорма — ${profile.name}`,
      `Дата рождения: ${fmtDate(profile.birthDate)} (${ageLabel(ageMonths)})`,
      `Составлено: ${today}`,
      '',
      `Введено продуктов: ${introduced.size} из ${FOODS.length}`,
      `Источников железа в рационе: ${ironCovered} из ${ironTotal}`,
      '',
      reactions.length
        ? 'Зафиксированные реакции:\n' + reactions.map((l) => `• ${nameOf(l.id)} — ${RX_TEXT[l.rx]} (${l.date})${l.note ? ` — ${l.note}` : ''}`).join('\n')
        : 'Реакций на продукты не зафиксировано.',
      '',
      aDone.length ? `Аллергены введены без реакции: ${aDone.map((f) => f.n).join(', ')}` : '',
      aBad.length ? `Аллергены с реакцией (на паузе): ${aBad.map((f) => f.n).join(', ')}` : '',
      aTodo.length ? `Аллергены ещё не вводились: ${aTodo.map((f) => f.n).join(', ')}` : '',
      '',
      'Составлено в приложении bubka plate. Не является медицинским документом.',
    ].filter((l) => l !== '');
    return lines.join('\n');
  };

  const doShare = async () => {
    const text = shareText();
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      showToast('📋', 'Скопировано', 'Текст выписки — в буфере обмена');
    } catch { /* пользователь отменил */ }
  };

  return createPortal(
    <div className="article-view doc-report">
      <button className="ps-back no-print" onClick={onClose} aria-label="Назад">‹</button>
      <div className="dr-body">
        <div className="dr-head">
          <div className="eyebrow" style={{ color: 'var(--accent)' }}>Выписка для врача</div>
          <h2>{profile.name}</h2>
          <div className="dr-meta">Дата рождения: {fmtDate(profile.birthDate)} · возраст {ageLabel(ageMonths)}</div>
          <div className="dr-meta">Составлено {today} · дневник прикорма</div>
        </div>

        <div className="dr-stats">
          <div className="dr-stat"><b>{introduced.size}</b><span>продуктов<br />введено</span></div>
          <div className="dr-stat"><b>{ironCovered}/{ironTotal}</b><span>источников<br />железа</span></div>
          <div className="dr-stat"><b>{reactions.length}</b><span>реакций<br />зафиксировано</span></div>
        </div>

        <div className="dr-sec">Реакции на продукты</div>
        {reactions.length === 0 && <div className="dr-empty">Реакций не зафиксировано — рацион переносится хорошо.</div>}
        {reactions.map((l, i) => (
          <div key={i} className="dr-rx">
            <b>{nameOf(l.id)}</b> — {RX_TEXT[l.rx]}
            <span className="dr-when"> · {l.date}</span>
            {l.note && <div className="dr-note">«{l.note}»</div>}
          </div>
        ))}

        <div className="dr-sec">Основные аллергены</div>
        {aBad.length > 0 && <div className="dr-line bad"><b>С реакцией, на паузе:</b> {aBad.map((f) => f.n).join(', ')}</div>}
        {aInWork.length > 0 && <div className="dr-line"><b>Вводятся сейчас (правило 3 дней):</b> {aInWork.map((f) => f.n).join(', ')}</div>}
        <div className="dr-line"><b>Введены без реакции:</b> {aDone.length ? aDone.map((f) => f.n).join(', ') : 'пока нет'}</div>
        {aTodo.length > 0 && <div className="dr-line"><b>Ещё не вводились:</b> {aTodo.map((f) => f.n).join(', ')}</div>}

        <div className="dr-sec">Введённые продукты по группам</div>
        {byCat.length === 0 && <div className="dr-empty">Продукты ещё не вводились.</div>}
        {byCat.map((g) => (
          <div key={g.cat} className="dr-line">
            <b>{g.cat} ({g.foods.length}):</b> {g.foods.map((f) => f.n).join(', ')}
          </div>
        ))}

        <div className="dr-sec">Последние записи дневника</div>
        {log.slice(0, 12).map((l, i) => (
          <div key={i} className="dr-logrow">
            <span className="grow">{nameOf(l.id)}</span>
            <span className="dr-when">{l.date}</span>
            <span className={`dr-tag ${l.rx === 'skin' || l.rx === 'tummy' ? 'bad' : ''}`}>{RX_TEXT[l.rx]}</span>
          </div>
        ))}

        <div className="dr-foot">Составлено в приложении bubka plate по записям родителя. Не является медицинским документом.</div>

        <div className="dr-actions no-print">
          <button className="btn btn-primary" onClick={() => window.print()}>🖨 Сохранить PDF или распечатать</button>
          <button className="btn btn-soft" onClick={doShare}>📤 Отправить текстом</button>
          <div className="sub" style={{ marginTop: 6, textAlign: 'center' }}>В окне печати выберите «Сохранить как PDF» — файл удобно показать или отправить врачу.</div>
        </div>
      </div>

      <style>{`
        .dr-body { padding:64px 20px calc(30px + env(safe-area-inset-bottom)); }
        .dr-head h2 { font-size:24px; font-weight:750; letter-spacing:-.02em; margin:2px 0 4px; }
        .dr-meta { font-size:12.5px; color:var(--text2); margin-top:2px; }
        .dr-stats { display:flex; gap:8px; margin:14px 0 4px; }
        .dr-stat { flex:1; background:var(--card); border-radius:14px; box-shadow:var(--shadow); padding:10px 8px; text-align:center; }
        .dr-stat b { font-size:19px; display:block; }
        .dr-stat span { font-size:10.5px; color:var(--text2); line-height:1.3; display:block; margin-top:2px; }
        .dr-sec { font-size:11px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--text2); margin:18px 0 8px; }
        .dr-empty { font-size:13px; color:var(--text2); }
        .dr-rx { background:var(--card); border-radius:12px; box-shadow:var(--shadow); padding:10px 12px; font-size:13px; margin-bottom:6px; }
        .dr-note { font-size:12.5px; color:var(--text2); margin-top:4px; }
        .dr-when { font-size:11.5px; color:var(--text2); }
        .dr-line { font-size:13px; line-height:1.55; margin-bottom:7px; }
        .dr-line.bad b { color:var(--danger); }
        .dr-logrow { display:flex; align-items:center; gap:8px; font-size:12.5px; padding:6px 0; border-bottom:1px solid var(--hairline); }
        .dr-tag { flex:none; font-size:10.5px; font-weight:700; color:var(--text2); }
        .dr-tag.bad { color:var(--danger); }
        .dr-foot { font-size:11px; color:var(--text2); margin-top:18px; line-height:1.5; }
        .dr-actions { margin-top:16px; display:flex; flex-direction:column; gap:8px; }
        @media print {
          body * { visibility:hidden; }
          .doc-report, .doc-report * { visibility:visible; }
          .doc-report { position:absolute; inset:0; height:auto; overflow:visible; animation:none; background:#fff; }
          .no-print { display:none !important; }
          .dr-body { padding:20px; }
          .dr-stat, .dr-rx { box-shadow:none; border:1px solid #ddd; }
        }
      `}</style>
    </div>,
    document.body,
  );
}
