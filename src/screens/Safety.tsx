import { useStore } from '../state/store';

const RULES = [
  { e: '🍇', t: 'Виноград и черри — вдоль на 4 части', p: 'Круглое и скользкое — самая частая причина удушья до 4 лет.' },
  { e: '🥜', t: 'Орехи — только пастой', p: 'Цельные орехи запрещены до 4–5 лет. Пасту — тонким слоем, как аллерген.' },
  { e: '🍯', t: 'Мёд — строго после 12 месяцев', p: 'Риск детского ботулизма. Ни в каше, ни «на кончике ложки».' },
  { e: '🧂', t: 'Без соли и сахара до года', p: 'Почки не готовы к соли, сахар формирует привычки на всю жизнь.' },
  { e: '😮', t: 'Рвотный рефлекс ≠ удушье', p: 'Кряхтит и краснеет — рефлекс работает. Тихий и синеет — удушье: первая помощь и 103.' },
  { e: '🗓', t: 'Правило 3 дней для аллергенов', p: 'Новый аллерген — утром, малыми дозами, 3 дня подряд.' },
];

const FORBIDDEN = [
  { when: 'До 1 года', items: [
    'Коровье молоко как напиток — мешает усвоению железа',
    'Мёд — риск ботулизма',
    'Соль и сахар',
    'Соки и компоты вместо воды',
    'Грибы',
  ] },
  { when: 'До 2 лет', items: [
    'Чай и травяные настои — действие не изучено',
    'Полуфабрикаты, сосиски, колбасы',
    'Продукты с большим количеством сахара и соли',
  ] },
  { when: 'Всегда для малыша', items: [
    'Сырое и полусырое: стейки с кровью, роллы, рыба без термообработки, икра, сырые яйца',
    'Цельные орехи и семечки — до 3–5 лет',
    'Лесные грибы — до 10–12 лет',
  ] },
];

export function Safety() {
  const { showToast } = useStore();
  return (
    <>
      <div className="note alert" style={{ marginBottom: 12 }}>
        <span className="ne">🚨</span>
        <span><b>Главное правило:</b> малыш ест только сидя, только под присмотром, без игр и мультиков.</span>
      </div>
      {RULES.map((r, i) => (
        <div key={i} className="rule">
          <span className="rule-e">{r.e}</span>
          <div><b>{r.t}</b><p>{r.p}</p></div>
        </div>
      ))}
      <div className="note" style={{ cursor: 'pointer', marginTop: 4 }} onClick={() => showToast('🎓', 'Мини-курс', 'Первая помощь при удушье — 4 минуты')}>
        <span className="ne">🎓</span>
        <span><b>Мини-курс:</b> «Первая помощь при удушье» — 4 минуты. Посмотрите до первого прикорма ›</span>
      </div>

      <div className="section-t">Что нельзя малышу</div>
      {FORBIDDEN.map((g, i) => (
        <div key={i} className="card forbid-card">
          <div className="forbid-when">{g.when}</div>
          {g.items.map((it, j) => (
            <div key={j} className="forbid-item"><span className="forbid-x">✕</span><span>{it}</span></div>
          ))}
        </div>
      ))}

      <style>{`
        .rule { background:var(--card); border-radius:18px; padding:15px 16px; box-shadow:var(--shadow); margin-bottom:10px; display:flex; gap:12px; }
        .rule-e { font-size:24px; flex:none; }
        .rule b { font-size:14.5px; display:block; }
        .rule p { font-size:12.5px; color:var(--text2); line-height:1.5; margin-top:4px; }
        .forbid-card { padding:14px 16px; }
        .forbid-when { font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--danger); margin-bottom:10px; }
        .forbid-item { display:flex; gap:10px; font-size:13px; line-height:1.45; padding:5px 0; color:var(--text); }
        .forbid-x { flex:none; color:var(--danger); font-weight:700; }
      `}</style>
    </>
  );
}
