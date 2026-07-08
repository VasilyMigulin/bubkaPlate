// Иконка продукта для «главного фото». Реальный эмодзи, если он есть и узнаваем;
// для продуктов без хорошего эмодзи — векторная иллюстрация в том же стиле.
import type { Food } from '../types';

// id продуктов, для которых рисуем свою иконку (эмодзи нет или он невыразительный).
const CUSTOM = new Set([
  'prune', 'fig', 'pomegranate', 'beet', 'chickpea', 'sesame', 'persimmon', 'tofu', 'peas', 'lentils',
]);

export function hasCustomIcon(id: string) {
  return CUSTOM.has(id);
}

export function FoodIcon({ food, size = 64 }: { food: Food; size?: number }) {
  if (!CUSTOM.has(food.id)) {
    return <span style={{ fontSize: size * 0.82, lineHeight: 1 }}>{food.e}</span>;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      {ICONS[food.id]}
    </svg>
  );
}

const hl = <ellipse cx="40" cy="36" rx="7" ry="10" fill="#fff" opacity="0.28" />;

const ICONS: Record<string, React.ReactNode> = {
  // Чернослив — тёмно-фиолетовая слива-морщинка
  prune: (
    <>
      <ellipse cx="50" cy="54" rx="26" ry="30" fill="#4A2C4E" />
      <ellipse cx="50" cy="54" rx="26" ry="30" fill="url(#pr)" />
      <path d="M50 26 Q46 44 50 84" stroke="#3A2340" strokeWidth="3" fill="none" opacity="0.5" />
      <path d="M40 24 q6 4 10 0" stroke="#6B4A2E" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="40" cy="42" rx="6" ry="9" fill="#fff" opacity="0.18" />
      <defs><radialGradient id="pr" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stopColor="#7A4E7E" /><stop offset="1" stopColor="#3E2442" /></radialGradient></defs>
    </>
  ),
  // Инжир — каплевидный плод, разрез розовый
  fig: (
    <>
      <path d="M50 20 C42 20 40 30 40 34 C28 40 24 58 32 72 C40 86 60 86 68 72 C76 58 72 40 60 34 C60 30 58 20 50 20Z" fill="#6E4B6E" />
      <path d="M50 34 C40 40 38 58 44 70 C48 78 52 78 56 70 C62 58 60 40 50 34Z" fill="#C76B7A" opacity="0.85" />
      <circle cx="50" cy="58" r="3" fill="#F2C0A0" opacity="0.8" />
      <path d="M44 22 q6 5 12 0" stroke="#6B8E4E" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  ),
  // Гранат — красный плод с короной
  pomegranate: (
    <>
      <circle cx="50" cy="56" r="30" fill="#B83A3A" />
      <circle cx="50" cy="56" r="30" fill="url(#pg)" />
      <path d="M50 26 l-6 -8 l6 3 l6 -3 z" fill="#8A2E2E" />
      <path d="M44 20 l6 6 l6 -6" stroke="#8A2E2E" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {hl}
      <defs><radialGradient id="pg" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stopColor="#E06060" /><stop offset="1" stopColor="#9E2E2E" /></radialGradient></defs>
    </>
  ),
  // Свёкла — бордовый корнеплод с ботвой
  beet: (
    <>
      <path d="M38 22 q4 14 10 20" stroke="#6E8E4A" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M58 20 q-2 16 -8 22" stroke="#5E8040" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M50 40 C34 40 30 58 42 74 C48 82 52 82 58 74 C70 58 66 40 50 40Z" fill="#8E2E52" />
      <path d="M50 40 C34 40 30 58 42 74 C48 82 52 82 58 74 C70 58 66 40 50 40Z" fill="url(#bt)" />
      <path d="M50 74 q4 6 0 10" stroke="#6E2340" strokeWidth="3" fill="none" strokeLinecap="round" />
      <defs><radialGradient id="bt" cx="0.4" cy="0.4" r="0.8"><stop offset="0" stopColor="#B84E74" /><stop offset="1" stopColor="#7A2646" /></radialGradient></defs>
    </>
  ),
  // Нут — три бежевые горошины
  chickpea: (
    <>
      {[[38, 58, 15], [62, 56, 16], [50, 42, 14]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="#D8B87E" />
          <circle cx={x} cy={y} r={r} fill="url(#cp)" />
          <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.28} fill="#fff" opacity="0.35" />
          <path d={`M${x} ${y - r} q3 ${r} 0 ${r * 2}`} stroke="#B8965E" strokeWidth="1.5" fill="none" opacity="0.5" />
        </g>
      ))}
      <defs><radialGradient id="cp" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#EBD3A0" /><stop offset="1" stopColor="#C8A66E" /></radialGradient></defs>
    </>
  ),
  // Кунжут — горстка семечек-капель
  sesame: (
    <>
      {[[36, 60, -20], [50, 64, 5], [64, 58, 24], [43, 50, -8], [57, 50, 12], [50, 40, 0]].map(([x, y, rot], i) => (
        <ellipse key={i} cx={x} cy={y} rx="7" ry="4.5" fill={i % 2 ? '#EDE0C0' : '#DFCDA0'} transform={`rotate(${rot} ${x} ${y})`} />
      ))}
    </>
  ),
  // Хурма — приплюснутый оранжевый плод с чашечкой
  persimmon: (
    <>
      <ellipse cx="50" cy="58" rx="30" ry="26" fill="#E88A2E" />
      <ellipse cx="50" cy="58" rx="30" ry="26" fill="url(#ps)" />
      <g fill="#7E9E4E">
        {[0, 72, 144, 216, 288].map((a, i) => (
          <ellipse key={i} cx="50" cy="34" rx="9" ry="5" transform={`rotate(${a} 50 36)`} />
        ))}
      </g>
      <circle cx="50" cy="36" r="4" fill="#6E8E42" />
      {hl}
      <defs><radialGradient id="ps" cx="0.4" cy="0.42" r="0.8"><stop offset="0" stopColor="#F5A94E" /><stop offset="1" stopColor="#D9741E" /></radialGradient></defs>
    </>
  ),
  // Тофу — белый кубик
  tofu: (
    <>
      <path d="M28 44 L50 34 L72 44 L72 66 L50 76 L28 66 Z" fill="#F2EFE6" />
      <path d="M28 44 L50 54 L72 44 L50 34 Z" fill="#FBFAF5" />
      <path d="M50 54 L72 44 L72 66 L50 76 Z" fill="#E4DECF" />
      <path d="M28 44 L50 54 L50 76 L28 66 Z" fill="#EDE8DA" />
    </>
  ),
  // Горошек — зелёный стручок с горошинами
  peas: (
    <>
      <path d="M26 40 C40 30 60 30 74 40 C70 52 58 58 50 58 C42 58 30 52 26 40Z" fill="#7CA34E" />
      <path d="M28 42 C42 34 58 34 72 42" stroke="#5E8038" strokeWidth="2.5" fill="none" />
      {[36, 50, 64].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="46" r="8" fill="#9BC46A" />
          <circle cx={x - 2} cy="44" r="2.5" fill="#fff" opacity="0.4" />
        </g>
      ))}
    </>
  ),
  // Чечевица — линзочки
  lentils: (
    <>
      {[[38, 58, -15], [60, 56, 18], [49, 46, 4], [50, 64, -5]].map(([x, y, rot], i) => (
        <g key={i} transform={`rotate(${rot} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx="13" ry="8" fill={i % 2 ? '#D98E5E' : '#C87E4E'} />
          <ellipse cx={x} cy={y} rx="13" ry="8" fill="none" stroke="#A8623A" strokeWidth="1" opacity="0.5" />
          <ellipse cx={x - 3} cy={y - 2} rx="3" ry="1.6" fill="#fff" opacity="0.35" />
        </g>
      ))}
    </>
  ),
};
