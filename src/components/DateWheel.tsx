const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

/** Дата рождения тремя нативными барабанами — на телефоне удобнее, чем input[type=date]. */
export function DateWheel({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const now = new Date();
  const [y, m, d] = value ? value.split('-').map(Number) : [0, 0, 0];
  const years: number[] = [];
  for (let yy = now.getFullYear(); yy >= now.getFullYear() - 4; yy--) years.push(yy);

  const set = (ny: number, nm: number, nd: number) => {
    if (!ny || !nm || !nd) { onChange(''); return; }
    const maxDay = new Date(ny, nm, 0).getDate();
    const day = Math.min(nd, maxDay);
    onChange(`${ny}-${String(nm).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  };

  return (
    <div className="dw">
      <select className="dw-sel" value={d || ''} onChange={(e) => set(y || now.getFullYear(), m || now.getMonth() + 1, Number(e.target.value))}>
        <option value="" disabled>День</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((dd) => <option key={dd} value={dd}>{dd}</option>)}
      </select>
      <select className="dw-sel grow" value={m || ''} onChange={(e) => set(y || now.getFullYear(), Number(e.target.value), d || 1)}>
        <option value="" disabled>Месяц</option>
        {MONTHS.map((mm, i) => <option key={mm} value={i + 1}>{mm}</option>)}
      </select>
      <select className="dw-sel" value={y || ''} onChange={(e) => set(Number(e.target.value), m || 1, d || 1)}>
        <option value="" disabled>Год</option>
        {years.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
      </select>
      <style>{`
        .dw { display:flex; gap:8px; width:100%; }
        .dw-sel { flex:1; appearance:none; -webkit-appearance:none; border:1.5px solid var(--hairline); background:var(--card);
          border-radius:14px; padding:14px 12px; font-family:inherit; font-size:16px; color:var(--text); outline:none;
          text-align:center; text-align-last:center; }
        .dw-sel:focus { border-color:var(--accent); }
        .dw-sel:invalid, .dw-sel option[value=""] { color:var(--text2); }
      `}</style>
    </div>
  );
}
