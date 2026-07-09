// Иконка продукта для «главного фото». Цельные фрукты/овощи — реальный эмодзи;
// приготовленные блюда и продукты без эмодзи — своя векторная иллюстрация на тарелке
// (тарелка даёт читаемость на любом фоне и единый «съедобный» вид).
import type { Food } from '../types';

const CUSTOM = new Set([
  // фрукты/овощи без выразительного эмодзи
  'prune', 'fig', 'pomegranate', 'beet', 'chickpea', 'sesame', 'persimmon', 'tofu', 'peas', 'lentils',
  // мясо и рыба — как еда, не как животное
  'turkey', 'rabbit', 'liver', 'beef', 'salmon', 'cod',
  // каши — миска с крупой
  'rice', 'oats', 'buckwheat', 'millet', 'corn_porr',
  // молочное
  'cottage',
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

// Тарелка-подложка — читаемость на любом фоне.
function plate(children: React.ReactNode) {
  return (
    <>
      <circle cx="50" cy="52" r="37" fill="#FBF9F5" stroke="#E6E0D5" strokeWidth="2" />
      <circle cx="50" cy="52" r="28" fill="#EFE9DE" />
      {children}
    </>
  );
}

// Каша в миске: цвет крупы + крупинки.
function porridge(base: string, grain: string, id: string): React.ReactNode {
  return plate(
    <>
      <ellipse cx="50" cy="52" rx="27" ry="19" fill={base} />
      <ellipse cx="43" cy="46" rx="7" ry="4" fill="#fff" opacity="0.35" />
      {[[38, 50], [50, 47], [58, 53], [45, 56], [56, 44], [62, 49], [42, 42]].map(([x, y], i) => (
        <circle key={`${id}${i}`} cx={x} cy={y} r="2" fill={grain} opacity="0.7" />
      ))}
    </>,
  );
}

// Ломтик мяса на тарелке.
function meat(light: string, deep: string, gid: string, fat = false): React.ReactNode {
  return plate(
    <>
      <path d="M30 50 C30 40 44 36 54 38 C68 40 72 50 70 58 C68 68 54 70 44 68 C34 66 30 58 30 50Z" fill={deep} />
      <path d="M30 50 C30 40 44 36 54 38 C68 40 72 50 70 58 C68 68 54 70 44 68 C34 66 30 58 30 50Z" fill={`url(#${gid})`} />
      {fat && <path d="M40 44 q10 -3 22 2" stroke="#EBD8C8" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.85" />}
      <path d="M38 52 q12 -3 24 1" stroke={light} strokeWidth="2" fill="none" opacity="0.45" strokeLinecap="round" />
      <ellipse cx="42" cy="48" rx="5" ry="3" fill="#fff" opacity="0.22" />
      <defs><radialGradient id={gid} cx="0.38" cy="0.32" r="0.85"><stop offset="0" stopColor={light} /><stop offset="1" stopColor={deep} /></radialGradient></defs>
    </>,
  );
}

// Филе рыбы на тарелке (с прожилками).
function fish(light: string, deep: string, gid: string): React.ReactNode {
  return plate(
    <>
      <path d="M32 52 C36 42 50 38 62 42 C72 45 74 54 70 60 C64 68 46 68 38 62 C33 58 31 56 32 52Z" fill={deep} />
      <path d="M32 52 C36 42 50 38 62 42 C72 45 74 54 70 60 C64 68 46 68 38 62 C33 58 31 56 32 52Z" fill={`url(#${gid})`} />
      <path d="M40 50 q14 -4 26 2 M40 56 q14 -3 26 2 M40 62 q12 -2 22 1" stroke={light} strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round" />
      <ellipse cx="44" cy="47" rx="5" ry="3" fill="#fff" opacity="0.28" />
      <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={light} /><stop offset="1" stopColor={deep} /></linearGradient></defs>
    </>,
  );
}

const ICONS: Record<string, React.ReactNode> = {
  // ── каши (миска с крупой) ──
  rice: porridge('#F3EEE2', '#D8CDB4', 'rice'),
  oats: porridge('#EADDBE', '#C9B488', 'oats'),
  buckwheat: porridge('#D8BE97', '#9E7B4E', 'bw'),
  millet: porridge('#EFD79A', '#CBA857', 'ml'),
  corn_porr: porridge('#F2D583', '#D9AE3E', 'cp'),

  // ── мясо (ломтик на тарелке) ──
  beef: meat('#CE6E64', '#9E453E', 'gbeef', true),
  turkey: meat('#F0C9B4', '#D6A184', 'gturk'),
  rabbit: meat('#EEC0B2', '#D2988A', 'grab'),
  liver: meat('#8E4042', '#5A2224', 'gliv'),

  // ── рыба (филе на тарелке) ──
  salmon: fish('#F3A882', '#DB6E4E', 'gsal'),
  cod: fish('#F2ECDE', '#CEC4AE', 'gcod'),

  // ── творог (комочки в миске) ──
  cottage: plate(
    <>
      <ellipse cx="50" cy="54" rx="26" ry="17" fill="#F5F0E4" />
      {[[40, 52], [50, 49], [59, 54], [46, 57], [56, 50], [50, 56]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 4 : 5} fill="#FCFBF6" stroke="#E7DEC9" strokeWidth="1" />
      ))}
    </>,
  ),

  // ── фрукты/овощи без эмодзи (на тарелке для читаемости) ──
  prune: plate(
    <>
      <ellipse cx="50" cy="52" rx="20" ry="24" fill="#4A2C4E" />
      <ellipse cx="50" cy="52" rx="20" ry="24" fill="url(#pr)" />
      <path d="M50 30 Q46 52 50 76" stroke="#3A2340" strokeWidth="2.5" fill="none" opacity="0.5" />
      <ellipse cx="43" cy="44" rx="5" ry="7" fill="#fff" opacity="0.18" />
      <defs><radialGradient id="pr" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stopColor="#7A4E7E" /><stop offset="1" stopColor="#3E2442" /></radialGradient></defs>
    </>,
  ),
  fig: plate(
    <>
      <path d="M50 30 C44 30 42 38 42 42 C32 47 30 62 37 72 C44 82 56 82 63 72 C70 62 68 47 58 42 C58 38 56 30 50 30Z" fill="#6E4B6E" />
      <path d="M50 44 C43 48 41 62 46 71 C49 77 51 77 54 71 C59 62 57 48 50 44Z" fill="#C76B7A" />
      <circle cx="50" cy="62" r="2.5" fill="#F2C0A0" />
      <path d="M45 32 q5 4 10 0" stroke="#6B8E4E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </>,
  ),
  pomegranate: plate(
    <>
      <circle cx="50" cy="55" r="23" fill="#B83A3A" />
      <circle cx="50" cy="55" r="23" fill="url(#pg)" />
      <path d="M44 33 l6 6 l6 -6" stroke="#8A2E2E" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="43" cy="47" rx="5" ry="7" fill="#fff" opacity="0.25" />
      <defs><radialGradient id="pg" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stopColor="#E06060" /><stop offset="1" stopColor="#9E2E2E" /></radialGradient></defs>
    </>,
  ),
  beet: plate(
    <>
      <path d="M40 30 q4 12 9 17" stroke="#6E8E4A" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M56 28 q-2 14 -7 19" stroke="#5E8040" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M50 42 C36 42 32 58 43 72 C48 79 52 79 57 72 C68 58 64 42 50 42Z" fill="url(#bt)" />
      <defs><radialGradient id="bt" cx="0.4" cy="0.4" r="0.8"><stop offset="0" stopColor="#B84E74" /><stop offset="1" stopColor="#7A2646" /></radialGradient></defs>
    </>,
  ),
  persimmon: plate(
    <>
      <ellipse cx="50" cy="56" rx="24" ry="21" fill="url(#ps)" />
      <g fill="#7E9E4E">
        {[0, 72, 144, 216, 288].map((a, i) => (
          <ellipse key={i} cx="50" cy="38" rx="8" ry="4.5" transform={`rotate(${a} 50 40)`} />
        ))}
      </g>
      <ellipse cx="43" cy="50" rx="5" ry="6" fill="#fff" opacity="0.28" />
      <defs><radialGradient id="ps" cx="0.4" cy="0.42" r="0.8"><stop offset="0" stopColor="#F5A94E" /><stop offset="1" stopColor="#D9741E" /></radialGradient></defs>
    </>,
  ),
  tofu: plate(
    <>
      <path d="M32 46 L50 37 L68 46 L68 64 L50 73 L32 64 Z" fill="#F4F1E8" stroke="#D9D2C0" strokeWidth="1.5" />
      <path d="M32 46 L50 55 L68 46 L50 37 Z" fill="#FCFBF6" stroke="#D9D2C0" strokeWidth="1.5" />
      <path d="M50 55 L68 46 L68 64 L50 73 Z" fill="#E4DECC" />
      <path d="M32 46 L50 55 L50 73 L32 64 Z" fill="#EDE8D8" />
    </>,
  ),
  chickpea: plate(
    <>
      {[[40, 58, 13], [60, 56, 14], [50, 44, 12]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="url(#cp)" />
          <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.28} fill="#fff" opacity="0.4" />
        </g>
      ))}
      <defs><radialGradient id="cp" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#EBD3A0" /><stop offset="1" stopColor="#C8A66E" /></radialGradient></defs>
    </>,
  ),
  sesame: plate(
    <>
      {[[38, 60, -20], [52, 64, 5], [64, 56, 24], [44, 50, -8], [58, 48, 12], [50, 40, 0]].map(([x, y, rot], i) => (
        <ellipse key={i} cx={x} cy={y} rx="7" ry="4.5" fill={i % 2 ? '#E7D8B0' : '#D3BE88'} stroke="#B8A472" strokeWidth="0.8" transform={`rotate(${rot} ${x} ${y})`} />
      ))}
    </>,
  ),
  peas: plate(
    <>
      <path d="M28 46 C40 36 60 36 72 46 C68 58 58 64 50 64 C42 64 32 58 28 46Z" fill="#7CA34E" />
      {[38, 50, 62].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="50" r="9" fill="#9BC46A" />
          <circle cx={x - 2} cy="48" r="3" fill="#fff" opacity="0.45" />
        </g>
      ))}
    </>,
  ),
  lentils: plate(
    <>
      {[[38, 58, -15], [60, 56, 18], [49, 46, 4], [50, 64, -5], [40, 48, 10]].map(([x, y, rot], i) => (
        <g key={i} transform={`rotate(${rot} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx="12" ry="7.5" fill={i % 2 ? '#D98E5E' : '#C87E4E'} stroke="#A8623A" strokeWidth="1" />
          <ellipse cx={x - 3} cy={y - 2} rx="3" ry="1.6" fill="#fff" opacity="0.4" />
        </g>
      ))}
    </>,
  ),
};
