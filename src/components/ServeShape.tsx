// Векторные иллюстрации подачи по возрастам. Форма = как нарезано, цвет = продукт.
// В продакшне заменяются фотографиями; здесь дают консистентную систему без фотобанка.
import type { ShapeKey } from '../types';

const LABEL: Record<ShapeKey, string> = {
  puree: 'пюре', porridge: 'каша', stick: 'брусочки', halfmoon: 'дольки',
  wedge: 'дольки', floret: 'соцветия', cubes: 'кубики', dice: 'мелкие кубики',
  grated: 'тёртое', spread: 'намазка', flakes: 'хлопья', ball: 'тефтельки',
  coin: 'кружочки', scramble: 'крошкой', whole: 'целиком с ручкой', wait: 'рано',
  drink: 'напиток', oil: 'в блюда',
};

export function serveLabel(shape: ShapeKey) {
  return LABEL[shape];
}

export function ServeShape({ shape, color, size = 72 }: { shape: ShapeKey; color: [string, string]; size?: number }) {
  const [light, deep] = color;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      {/* тарелка */}
      <circle cx="40" cy="40" r="34" fill="var(--card)" stroke="var(--hairline)" strokeWidth="2" />
      <circle cx="40" cy="40" r="26" fill="var(--elev)" opacity="0.6" />
      <g>{renderShape(shape, light, deep)}</g>
    </svg>
  );
}

function renderShape(shape: ShapeKey, light: string, deep: string) {
  switch (shape) {
    case 'puree':
      return (
        <>
          <path d="M22 44a18 8 0 0 0 36 0z" fill={deep} />
          <ellipse cx="40" cy="44" rx="18" ry="7" fill={light} />
          <ellipse cx="35" cy="42" rx="4" ry="2" fill="#fff" opacity="0.35" />
        </>
      );
    case 'porridge':
      return (
        <>
          <path d="M22 44a18 8 0 0 0 36 0z" fill={deep} />
          <ellipse cx="40" cy="44" rx="18" ry="7" fill={light} />
          {[[33, 42], [42, 41], [46, 44], [36, 45]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill={deep} opacity="0.55" />
          ))}
        </>
      );
    case 'stick':
      return [0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={26 + i * 10} y="28" width="7" height="24" rx="3.5" fill={deep} />
          <rect x={27.5 + i * 10} y="30" width="2" height="18" rx="1" fill={light} opacity="0.7" />
        </g>
      ));
    case 'halfmoon':
      return [0, 1].map((i) => (
        <path key={i} d={`M${30 + i * 12} 30 a12 12 0 0 1 0 20 a7 12 0 0 0 0 -20z`} fill={i ? light : deep} />
      ));
    case 'wedge':
      return [0, 1, 2].map((i) => (
        <path key={i} d={`M${28 + i * 9} 50 L${33 + i * 9} 30 L${34 + i * 9} 50 z`} fill={i % 2 ? light : deep} />
      ));
    case 'floret':
      return [0, 1].map((i) => (
        <g key={i}>
          <rect x={35 + i * 7 - 2} y="40" width="4" height="10" rx="2" fill={light} />
          <circle cx={35 + i * 7} cy="36" r="8" fill={deep} />
          <circle cx={32 + i * 7} cy="34" r="3.5" fill={deep} />
          <circle cx={38 + i * 7} cy="35" r="3" fill={deep} />
        </g>
      ));
    case 'cubes':
      return [[30, 34], [46, 36], [38, 46]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width="11" height="11" rx="2.5" fill={deep} />
          <rect x={x + 1.5} y={y + 1.5} width="8" height="3" rx="1.5" fill={light} opacity="0.75" />
        </g>
      ));
    case 'dice':
      return [[30, 32], [42, 33], [50, 40], [33, 44], [44, 46]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="7" height="7" rx="1.8" fill={i % 2 ? light : deep} />
      ));
    case 'grated':
      return [0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={28 + i * 5} y={32 + (i % 2) * 4} width="3.4" height="16" rx="1.7" fill={i % 2 ? light : deep} transform={`rotate(${-12 + i * 5} ${30 + i * 5} 40)`} />
      ));
    case 'spread':
      return (
        <>
          <rect x="26" y="34" width="28" height="16" rx="4" fill="#E8D2A8" />
          <rect x="28" y="33" width="24" height="6" rx="3" fill={deep} opacity="0.85" />
          <rect x="30" y="34.5" width="10" height="2" rx="1" fill={light} opacity="0.6" />
        </>
      );
    case 'flakes':
      return [[30, 36], [44, 34], [38, 44], [48, 44]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} q4 -4 8 0 q2 5 -3 6 q-6 1 -5 -6z`} fill={i % 2 ? light : deep} />
      ));
    case 'ball':
      return [[33, 38], [47, 37], [40, 47]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="6.5" fill={deep} />
          <circle cx={x - 2} cy={y - 2} r="2" fill={light} opacity="0.6" />
        </g>
      ));
    case 'coin':
      return [[31, 40], [42, 36], [49, 44]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="7" fill={deep} />
          <circle cx={x} cy={y} r="3.5" fill={light} opacity="0.7" />
        </g>
      ));
    case 'scramble':
      return [[30, 36], [40, 34], [47, 38], [34, 44], [44, 45], [52, 43]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.6 + (i % 2)} fill={i % 2 ? light : deep} />
      ));
    case 'whole':
      return (
        <>
          <rect x="38" y="22" width="4" height="10" rx="2" fill="#8AA06E" />
          <ellipse cx="40" cy="44" rx="14" ry="16" fill={deep} />
          <ellipse cx="35" cy="39" rx="4" ry="6" fill={light} opacity="0.55" />
        </>
      );
    case 'wait':
      return (
        <>
          <circle cx="40" cy="40" r="14" fill="none" stroke={deep} strokeWidth="3" opacity="0.6" />
          <path d="M40 40 L40 31 M40 40 L47 43" stroke={deep} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        </>
      );
    case 'drink':
      return (
        <>
          <path d="M31 28 h18 l-2 26 a2 2 0 0 1 -2 2 h-10 a2 2 0 0 1 -2 -2 z" fill="none" stroke={deep} strokeWidth="2.5" />
          <path d="M33 40 h14 l-1.4 14 a2 2 0 0 1 -2 2 h-7.2 a2 2 0 0 1 -2 -2 z" fill={light} opacity="0.75" />
          <ellipse cx="40" cy="28" rx="9" ry="2.5" fill={deep} opacity="0.4" />
        </>
      );
    case 'oil':
      return (
        <>
          <path d="M40 26 C36 34 33 38 33 44 a7 7 0 0 0 14 0 c0 -6 -3 -10 -7 -18z" fill={deep} />
          <path d="M40 26 C36 34 33 38 33 44 a7 7 0 0 0 14 0 c0 -6 -3 -10 -7 -18z" fill={`url(#oil-${deep.slice(1)})`} />
          <ellipse cx="37" cy="42" rx="2.5" ry="4" fill="#fff" opacity="0.35" />
          <defs><radialGradient id={`oil-${deep.slice(1)}`} cx="0.4" cy="0.5" r="0.7"><stop offset="0" stopColor={light} /><stop offset="1" stopColor={deep} /></radialGradient></defs>
        </>
      );
    default:
      return null;
  }
}
