import { useEffect, useMemo, useState } from 'react';
import { BIG_ALLERGENS, CATEGORIES, FOODS, IRON_IDS, resolveFoodRef } from '../data/foods';
import { PORTIONS, READINESS } from '../data/schedule';
import { PLAN30 } from '../data/plan30';
import { useStore } from '../state/store';
import { Plan30Sheet } from '../components/Plan30Sheet';
import { SearchSheet } from '../components/SearchSheet';
import { LogPicker } from '../components/LogPicker';
import { DiaryView } from '../components/DiaryView';
import { ProductSheet } from '../components/ProductSheet';
import { RULE3_TEXT } from '../data/glossary';
import { Lightbox } from '../components/Lightbox';
import { PlateScan } from '../components/PlateScan';
import { MAIN_PHOTOS } from '../data/mainPhotos';
import type { Food } from '../types';
import './MyPlate.css';

const RX_BADGE: Record<string, { cls: string; label: string }> = {
  ok: { cls: 'ok', label: '💚 без реакции' },
  wait: { cls: 'wait', label: '👀 наблюдаю' },
  skin: { cls: 'bad', label: '🌡 кожа' },
  tummy: { cls: 'bad', label: '💩 живот' },
};

function readPlan30Done(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem('bubka-plate-plan30') || '[]') as number[]); } catch { return new Set(); }
}

export function MyPlate({ goCatalog }: { goCatalog: () => void }) {
  const [plan30Open, setPlan30Open] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { introduced, log, windows, ironCovered, ironTotal, markAllergenDay, showToast,
    ageMonths, readiness, toggleReadiness, answerFollowUp, activeId } = useStore();
  const [scanOpen, setScanOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [panel, setPanel] = useState<null | 'iron' | 'foods' | 'allerg'>(null);
  const [schedOpen, setSchedOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt?: string } | null>(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [todayFood, setTodayFood] = useState<Food | null>(null);
  const [ideaShift, setIdeaShift] = useState(0);
  const [searchInit, setSearchInit] = useState<string | undefined>(undefined);

  useEffect(() => {
    const h = () => { setSearchInit(undefined); setSearchOpen(true); };
    window.addEventListener('bubka-search', h);
    return () => window.removeEventListener('bubka-search', h);
  }, []);

  const notReady = ageMonths != null && ageMonths < 6;
  const readyCount = READINESS.filter((r) => readiness.has(r.key)).length;

  // ── «Вопрос после пробы»: последняя запись «наблюдаю», по которой ещё не спросили ──
  const FU_SNOOZE = `bubka-plate-fu-snooze-${activeId ?? ''}`;
  const [fuTick, setFuTick] = useState(0);
  const fuIdx = useMemo(() => {
    const snoozedTo = Number(localStorage.getItem(FU_SNOOZE) || 0);
    if (Date.now() < snoozedTo) return -1;
    return log.findIndex((l) => l.rx === 'wait' && !l.fu && (!l.ts || Date.now() - l.ts > 4 * 3600e3));
  }, [log, FU_SNOOZE, fuTick]);
  const fuEntry = fuIdx >= 0 ? log[fuIdx] : null;
  const fuFood = fuEntry ? resolveFoodRef(fuEntry.id) : null;

  const fuAnswer = (rx: 'ok' | 'skin' | 'tummy') => {
    answerFollowUp(fuIdx, rx);
    if (rx === 'ok') showToast('💚', 'Отлично!', 'Записали: без реакции');
    else showToast('👀', 'Записали реакцию', 'Пауза с этим продуктом — и обсудите с врачом');
  };
  const fuSnooze = () => {
    localStorage.setItem(FU_SNOOZE, String(Date.now() + 24 * 3600e3));
    setFuTick((t) => t + 1);
    showToast('🕊', 'Хорошо, спросим завтра');
  };

  // ── Покрытие групп и метрики ──
  const coverage = useMemo(() =>
    CATEGORIES.map((cat) => {
      const ids = FOODS.filter((f) => f.cat === cat);
      const done = ids.filter((f) => introduced.has(f.id)).length;
      return { cat, done, total: ids.length, pct: Math.round((done / ids.length) * 100) };
    }), [introduced]);
  const weakest = [...coverage].sort((a, b) => a.pct - b.pct)[0];
  const introducedCount = introduced.size;
  const allergensCovered = useMemo(() =>
    new Set(FOODS.filter((f) => f.allergen && introduced.has(f.id)).map((f) => f.allergen)).size, [introduced]);

  // ── Блок «Сегодня»: одно самое важное действие дня ──
  const activeWin = windows.find((w) => w.day < 3 && w.reaction !== 'bad');
  const winFood = activeWin ? FOODS.find((f) => f.id === activeWin.id) : null;
  const age = Math.max(ageMonths ?? 6, 6);
  const todayIdea = useMemo(() => {
    // день в году — чтобы идея дня менялась сама, но не прыгала при каждом рендере
    const seed = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 864e5) + ideaShift;
    if (ironCovered < Math.ceil(ironTotal / 2)) {
      const opts = FOODS.filter((f) => IRON_IDS.includes(f.id) && !introduced.has(f.id) && f.fromMonth <= age);
      if (opts.length) return { f: opts[seed % opts.length], why: 'Железо — фокус прикорма: запасы малыша тают после 6 месяцев.' };
    }
    const opts = FOODS.filter((f) => f.cat === weakest.cat && !introduced.has(f.id) && f.fromMonth <= age);
    if (opts.length) return { f: opts[seed % opts.length], why: `Группа «${weakest.cat}» пока отстаёт — расширим вкусовой опыт.` };
    return null;
  }, [introduced, ironCovered, ironTotal, weakest, age, ideaShift]);

  // Сколько проб уже записано сегодня
  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return log.filter((l) => l.ts && new Date(l.ts).toDateString() === today).length;
  }, [log]);

  // Этапный прогресс продуктов и следующая веха
  const MILESTONES = [10, 20, 30, 50, 70, FOODS.length];
  const stageTarget = MILESTONES.find((m) => introducedCount < m) ?? FOODS.length;
  const toMilestone = stageTarget - introducedCount;

  const todayStr = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── План: один умный вход ──
  const p30 = useMemo(() => {
    const done = readPlan30Done();
    const all = PLAN30.flatMap((w) => w.days);
    const isD = (day: typeof all[number]) => done.has(day.d) || (day.pids.length > 0 && day.pids.every((p) => introduced.has(p)));
    const doneCount = all.filter(isD).length;
    const cur = all.find((day) => !isD(day));
    return { doneCount, cur };
  }, [introduced, plan30Open]);
  const showP30 = !!p30.cur && p30.doneCount < 30 && (ageMonths == null || ageMonths <= 8);

  return (
    <>
      {/* ═══ СЕГОДНЯ: hero-сцена ═══ */}
      {notReady ? (
        <div className="hero-day st0">
          <div className="hd-eyebrow">Скоро прикорм · {todayStr}</div>
          <div className="hd-title">Готовность: {readyCount} из {READINESS.length}</div>
          <div className="sub" style={{ marginTop: 4 }}>Прикорм начинают около 6 месяцев и когда малыш готов. Отметьте, что уже есть:</div>
          <div className="ready-list">
            {READINESS.map((r) => {
              const on = readiness.has(r.key);
              return (
                <button key={r.key} className={`ready-item ${on ? 'on' : ''}`} onClick={() => toggleReadiness(r.key)}>
                  <span className="ready-box">{on ? '✓' : ''}</span>
                  <span className="ready-e">{r.e}</span>
                  <span className="grow">{r.text}</span>
                </button>
              );
            })}
          </div>
          {readyCount === READINESS.length && (
            <div className="note" style={{ marginTop: 10 }}><span className="ne">🎉</span><span>Все признаки есть — можно знакомиться с первым овощем. Откройте план 30 дней ниже.</span></div>
          )}
        </div>
      ) : (
        <div className="hero-day st0">
          <div className="hd-eyebrow">Сегодня · {todayStr}</div>
          {todayCount > 0 && <div className="td-done">✓ Записано сегодня: {todayCount} {todayCount === 1 ? 'проба' : todayCount < 5 ? 'пробы' : 'проб'}</div>}

          {fuEntry && fuFood?.food ? (
            <div className="hd-swap" key={`fu-${fuEntry.id}`}>
              <div className="hd-row">
                {MAIN_PHOTOS[fuFood.food.id]
                  ? <img className="hd-pic" src={MAIN_PHOTOS[fuFood.food.id]} alt={fuFood.food.n} />
                  : <span className="hd-pic hd-pic-e">{fuFood.food.e}</span>}
                <div className="grow">
                  <div className="hd-title">Как прошло с «{fuFood.label ?? fuFood.food.n}»?</div>
                  <div className="hd-why">Вы отметили «наблюдаю» ({fuEntry.date}). Если всё спокойно — закроем вопрос.</div>
                </div>
              </div>
              <div className="fu-btns">
                <button className="fu-btn ok" onClick={() => fuAnswer('ok')}>💚 Всё хорошо</button>
                <button className="fu-btn" onClick={() => fuAnswer('skin')}>🌡 Кожа</button>
                <button className="fu-btn" onClick={() => fuAnswer('tummy')}>💩 Живот</button>
              </div>
              <button className="fu-later" onClick={fuSnooze}>Ещё наблюдаю — спросите завтра</button>
            </div>
          ) : activeWin && winFood ? (
            <div className="hd-swap" key={`win-${activeWin.id}-${activeWin.day}`}>
              <div className="hd-row">
                {MAIN_PHOTOS[winFood.id]
                  ? <img className="hd-pic" src={MAIN_PHOTOS[winFood.id]} alt={winFood.n} />
                  : <span className="hd-pic hd-pic-e">{winFood.e}</span>}
                <div className="grow">
                  <div className="hd-kicker">Ввод аллергена</div>
                  <div className="hd-title">{winFood.n}: день {activeWin.day} из 3</div>
                  <div className="hd-why">Утром — привычная малая порция. Спокойный день? Отметьте галочкой.</div>
                </div>
              </div>
              <div className="hd-cta-row">
                <button className="hd-cta" onClick={() => { markAllergenDay(activeWin.id); showToast('🗓', winFood.n, `День ${Math.min(activeWin.day + 1, 3)} из 3`); }}>✓ День прошёл спокойно</button>
                <button className="hd-ico" onClick={() => setTodayFood(winFood)} aria-label="Карточка продукта">📖</button>
              </div>
            </div>
          ) : todayIdea ? (
            <div className="hd-swap" key={todayIdea.f.id}>
              <div className="hd-row">
                {MAIN_PHOTOS[todayIdea.f.id]
                  ? <img className="hd-pic" src={MAIN_PHOTOS[todayIdea.f.id]} alt={todayIdea.f.n} />
                  : <span className="hd-pic hd-pic-e">{todayIdea.f.e}</span>}
                <div className="grow">
                  <div className="hd-kicker">{todayCount > 0 ? 'Ещё идея' : 'Идея дня'}</div>
                  <div className="hd-title">{todayIdea.f.n}</div>
                  <div className="hd-why">{todayIdea.why}</div>
                </div>
              </div>
              <div className="hd-cta-row">
                <button className="hd-cta" onClick={() => setTodayFood(todayIdea.f)}>Как подать →</button>
                <button className="hd-ico" onClick={() => setIdeaShift((v) => v + 1)} aria-label="Другая идея">🔀</button>
                <button className="hd-ico" onClick={() => { setSearchInit(todayIdea.f.n.split(' (')[0]); setSearchOpen(true); }} aria-label="Рецепты">🍲</button>
              </div>
            </div>
          ) : (
            <div className="hd-swap" key="alldone">
              <div className="hd-row">
                <span className="hd-pic hd-pic-e">🏆</span>
                <div className="grow">
                  <div className="hd-title">Всё введено — вы великолепны!</div>
                  <div className="hd-why">Дальше — разнообразие и общий стол. Загляните в рецепты.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ ДЕЙСТВИЯ ═══ */}
      {!notReady && (
        <>
          <button className="act-main st1" onClick={() => setLogOpen(true)}>
            <span className="act-plus">+</span> Записать пробу
          </button>
          <button className="scan-row st2" onClick={() => setScanOpen(true)}>
            <span className="scan-e">📸</span>
            <span className="grow">
              <b>Проверить тарелку по фото</b>
              <span>ИИ оценит нарезку, возраст и баланс за 5 секунд</span>
            </span>
            <span style={{ color: 'var(--text2)' }}>›</span>
          </button>
        </>
      )}

      {/* ═══ ПЛАН: один умный вход ═══ */}
      {showP30 ? (
        <button className="card next-card st3" onClick={() => setPlan30Open(true)}>
          <div className="row">
            <div className="next-e">🗓</div>
            <div className="grow">
              <div className="eyebrow" style={{ color: 'var(--accent)' }}>Мой план · день {p30.cur!.d} из 30</div>
              <div className="h-card" style={{ margin: '2px 0 0' }}>{p30.cur!.t}</div>
              <div className="sub">План новичка: что и когда вводить — по шагам</div>
              <div className="plan-bar"><i style={{ width: `${Math.round((p30.doneCount / 30) * 100)}%` }} /></div>
            </div>
            <span style={{ color: 'var(--text2)' }}>›</span>
          </div>
        </button>
      ) : (
        <button className="card next-card st3" onClick={goCatalog}>
          <div className="row">
            <div className="next-e">🌟</div>
            <div className="grow">
              <div className="eyebrow" style={{ color: 'var(--accent)' }}>Что ввести дальше</div>
              <div className="h-card" style={{ margin: '2px 0 0' }}>{weakest.cat}</div>
              <div className="sub">{ironCovered < ironTotal ? 'и добавьте железо — мясо, желток, чечевицу' : 'группа покрыта меньше всего'}</div>
            </div>
            <span style={{ color: 'var(--text2)' }}>›</span>
          </div>
        </button>
      )}

      {/* ═══ ПРОГРЕСС: три сегмента, у каждого своя панель ═══ */}
      <div className="section-t">Прогресс малыша</div>
      <div className="seg-row st4">
        <button className={`seg ${panel === 'iron' ? 'on' : ''}`} onClick={() => setPanel(panel === 'iron' ? null : 'iron')}>
          <span className={`seg-chev ${panel === 'iron' ? 'up' : ''}`}>▾</span>
          <span className="seg-e">🥩</span><b>{ironCovered}<i>/{ironTotal}</i></b><span>источники железа</span>
        </button>
        <button className={`seg ${panel === 'foods' ? 'on' : ''}`} onClick={() => setPanel(panel === 'foods' ? null : 'foods')}>
          <span className={`seg-chev ${panel === 'foods' ? 'up' : ''}`}>▾</span>
          <span className="seg-e">🌈</span><b>{introducedCount}<i>/{stageTarget}</i></b><span>продуктов · веха</span>
        </button>
        <button className={`seg ${panel === 'allerg' ? 'on' : ''}`} onClick={() => setPanel(panel === 'allerg' ? null : 'allerg')}>
          <span className={`seg-chev ${panel === 'allerg' ? 'up' : ''}`}>▾</span>
          <span className="seg-e">🥜</span><b>{allergensCovered}<i>/{BIG_ALLERGENS.size}</i></b><span>из девятки</span>
        </button>
      </div>

      {panel === 'iron' && (
        <div className="rise">
          <div className="fmap-iron">
            <div className="eyebrow" style={{ color: 'var(--terra)' }}>Фокус после 6 месяцев</div>
            <div className="row" style={{ marginTop: 4 }}>
              <div className="grow">
                <div className="fmap-big">{ironCovered} из {ironTotal}</div>
                <div className="sub" style={{ color: 'var(--text)', marginTop: 2 }}>источника железа в рационе</div>
              </div>
              <div style={{ fontSize: 34 }}>🥩</div>
            </div>
            <div className="sub" style={{ marginTop: 8 }}>Запасы железа истощаются к 6 мес — ради этого и вводят прикорм.</div>
            {(() => {
              const todo = FOODS.filter((f) => IRON_IDS.includes(f.id) && !introduced.has(f.id) && f.fromMonth <= age).slice(0, 6);
              return todo.length > 0 && (
                <div className="p30-chips" style={{ marginTop: 10 }}>
                  {todo.map((f) => <button key={f.id} className="tag tag-link" onClick={() => setTodayFood(f)}>{f.e} {f.n}</button>)}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {panel === 'foods' && (
        <div className="rise">
          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 4 }}>Покрытие групп</div>
            {coverage.map((c) => (
              <div key={c.cat} className="fmap-row">
                <div className="grow">
                  <div className="fmap-n">{c.cat}</div>
                  <div className="fmap-bar"><i className={c.pct < 50 ? 'low' : ''} style={{ width: `${c.pct}%` }} /></div>
                </div>
                <div className="fm-cnt">{c.done}/{c.total}</div>
              </div>
            ))}
            <div className="sub" style={{ marginTop: 6 }}>{toMilestone > 0
              ? `До вехи «${stageTarget} продуктов» осталось ${toMilestone} 🎈 Идея дня наверху всегда подсказывает отстающую группу.`
              : 'Весь каталог пройден — вы великолепны! 🎉'}</div>
          </div>
        </div>
      )}

      {panel === 'allerg' && (
        <div className="rise">
          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              Большая девятка аллергенов
              <button className="skill-i" onClick={() => setRuleOpen(true)} aria-label="Правило 3 дней">?</button>
            </div>
            <div className="al-grid">
              {[...BIG_ALLERGENS].map((a) => {
                const foods = FOODS.filter((f) => f.allergen === a);
                const win = windows.find((w) => foods.some((f) => f.id === w.id));
                const bad = win?.reaction === 'bad';
                const done = !bad && foods.some((f) => introduced.has(f.id));
                const inWork = !bad && !done && win && win.day < 3;
                const openFood = foods.find((f) => win?.id === f.id) ?? foods.find((f) => !introduced.has(f.id)) ?? foods[0];
                return (
                  <button key={a} className={`al-tile ${bad ? 'bad' : done ? 'done' : ''}`} onClick={() => openFood && setTodayFood(openFood)}>
                    <span className="al-e">{foods[0]?.e ?? '🥜'}</span>
                    <span className="al-n">{a}</span>
                    <span className="al-st">{bad ? '⚠️ пауза' : done ? '✓ введён' : inWork ? `день ${win!.day}/3` : 'не начат'}</span>
                  </button>
                );
              })}
            </div>
            <div className="sub" style={{ marginTop: 10 }}>Новый аллерген — утром, с малой дозы, 3 дня подряд. Чем раньше девятка в рационе (до года), тем ниже риск аллергии.</div>
          </div>
        </div>
      )}

      {/* ═══ АКТИВНЫЕ ОКНА АЛЛЕРГЕНОВ ═══ */}
      {windows.length > 0 && (
        <div className="section-t" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>Ввод аллергенов · правило 3 дней
          <button className="skill-i" onClick={() => setRuleOpen(true)} aria-label="Что это">?</button>
        </div>
      )}
      {windows.map((w) => {
        const f = FOODS.find((x) => x.id === w.id)!;
        const safe = w.day >= 3 && w.reaction !== 'bad';
        const status = w.reaction === 'bad' ? '⚠️ была реакция — пауза, к врачу'
          : safe ? '✓ 3 дня без реакции — введён' : `день ${w.day} из 3 · реакции нет`;
        return (
          <div key={w.id} className={`allerg-win tappable ${safe ? 'safe' : ''}`} onClick={() => setTodayFood(f)}
            role="button" tabIndex={0}>
            <div style={{ fontSize: 22 }}>{f.e}</div>
            <div className="grow">
              <div className="fmap-n">{f.n} <span className="aw-open">карточка ›</span></div>
              <div className="fm-d">{status}</div>
              <div className="aw-days">{[1, 2, 3].map((d) => <i key={d} className={d <= w.day ? 'on' : ''} />)}</div>
              {!safe && w.reaction !== 'bad' && <div className="aw-hint">Сегодня: дать утром малую порцию → вечером отметить ✓</div>}
            </div>
            {!safe && w.reaction !== 'bad' && (
              <button className="aw-check" onClick={(e) => { e.stopPropagation(); markAllergenDay(w.id); showToast('🗓', f.n, `День ${Math.min(w.day + 1, 3)} из 3`); }} aria-label="Отметить день">✓</button>
            )}
          </div>
        );
      })}

      {/* ═══ ДНЕВНИК: последние записи ═══ */}
      <div className="section-t">Дневник прикорма</div>
      {log.length === 0 && (
        <div className="note"><span className="ne">🥄</span><span>Здесь появятся пробы малыша. Начните с «+ Записать пробу».</span></div>
      )}
      {log.slice(0, 3).map((l, i) => {
        const ref = resolveFoodRef(l.id);
        const f = ref.food;
        const name = ref.label ?? f?.n ?? l.id;
        const b = RX_BADGE[l.rx];
        return (
          <div key={i} className="fl-card">
            <div className="fl-row">
              {f && MAIN_PHOTOS[f.id]
                ? <img className="fl-pic" src={MAIN_PHOTOS[f.id]} alt={name} />
                : <div className="fl-e">{f?.e ?? '🥣'}</div>}
              <div className="grow"><div className="fl-n">{name}</div><div className="fl-d">{l.date}</div></div>
              <span className={`rx ${b.cls}`}>{b.label}</span>
            </div>
            {(l.note || l.photo) && (
              <div className="fl-extra">
                {l.photo && <img className="fl-photo tappable" src={l.photo} alt="момент" onClick={() => setLightbox({ src: l.photo!, alt: name + ' · первая проба' })} />}
                {l.note && <div className="fl-note">{l.note}</div>}
              </div>
            )}
          </div>
        );
      })}
      {log.length > 0 && (
        <button className="diary-more" onClick={() => setDiaryOpen(true)}>
          Все записи ({log.length}) и выписка для врача ›
        </button>
      )}

      {/* ═══ СПРАВОЧНОЕ ═══ */}
      <button className="ref-row" onClick={() => setSchedOpen((v) => !v)}>
        ⚖️ <span className="grow">Объёмы порций по возрасту</span>
        <span className="fs-chev" style={{ transform: schedOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      {schedOpen && (
        <div className="card rise">
          {PORTIONS.map((p) => (
            <div key={p.months} className="portion-row">
              <div className="portion-m">{p.months}</div>
              <div className="grow"><div className="portion-p">{p.portion}</div><div className="fm-d">{p.meals}</div></div>
            </div>
          ))}
          <div className="sub" style={{ marginTop: 8 }}>Ориентир. Молоко или смесь — по требованию сверх прикорма. Аппетит малыша важнее граммов.</div>
        </div>
      )}

      <div className="trust">Собрано по современным рекомендациям ВОЗ, AAP, NHS и данным исследований.<br />Приложение — помощник, а не замена консультации врача.</div>

      {scanOpen && <PlateScan onClose={() => setScanOpen(false)} goSafety={goCatalog} />}
      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

      {ruleOpen && (
        <div className="skill-pop-scrim" onClick={() => setRuleOpen(false)}>
          <div className="skill-pop" onClick={(e) => e.stopPropagation()}>
            <div className="skill-pop-text">{RULE3_TEXT}</div>
            <button className="btn btn-soft" onClick={() => setRuleOpen(false)}>Понятно</button>
          </div>
        </div>
      )}
      {plan30Open && <Plan30Sheet onClose={() => setPlan30Open(false)} />}
      {searchOpen && <SearchSheet key={searchInit ?? ''} initial={searchInit} onClose={() => { setSearchOpen(false); setSearchInit(undefined); }} />}
      {logOpen && <LogPicker onClose={() => setLogOpen(false)} />}
      {diaryOpen && <DiaryView onClose={() => setDiaryOpen(false)} />}
      {todayFood && <ProductSheet food={todayFood} onClose={() => setTodayFood(null)} />}
    </>
  );
}
