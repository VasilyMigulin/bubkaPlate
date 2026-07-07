import { useStore } from '../state/store';

const RULES = [
  { e: '🍇', t: 'Виноград и черри — вдоль на 4 части', p: 'Круглое и скользкое — самая частая причина удушья до 4 лет.' },
  { e: '🥜', t: 'Орехи — только пастой', p: 'Цельные орехи запрещены до 4–5 лет. Пасту — тонким слоем, как аллерген.' },
  { e: '🍯', t: 'Мёд — строго после 12 месяцев', p: 'Риск детского ботулизма. Ни в каше, ни «на кончике ложки».' },
  { e: '🧂', t: 'Без соли и сахара до года', p: 'Почки не готовы к соли, сахар формирует привычки на всю жизнь.' },
  { e: '😮', t: 'Рвотный рефлекс ≠ удушье', p: 'Кряхтит и краснеет — рефлекс работает. Тихий и синеет — удушье: первая помощь и 103.' },
  { e: '🗓', t: 'Правило 3 дней для аллергенов', p: 'Новый аллерген — утром, малыми дозами, 3 дня подряд.' },
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
      <style>{`
        .rule { background:var(--card); border-radius:18px; padding:15px 16px; box-shadow:var(--shadow); margin-bottom:10px; display:flex; gap:12px; }
        .rule-e { font-size:24px; flex:none; }
        .rule b { font-size:14.5px; display:block; }
        .rule p { font-size:12.5px; color:var(--text2); line-height:1.5; margin-top:4px; }
      `}</style>
    </>
  );
}
