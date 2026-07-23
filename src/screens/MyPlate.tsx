import { useMemo, useState } from 'react';
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
  const { profile, introduced, log, windows, ironCovered, ironTotal, markAllergenDay, showToast,
    ageMonths, readiness, toggleReadiness, answerFollowUp, activeId } = useStore();
  const [scanOpen, setScanOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [panel, setPanel] = useState<null | 'iron' | 'foods' | 'allerg'>(null);
  const [schedOpen, setSchedOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt?: string } | null>(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [todayFood, setTodayFood] = useState<Food | null>(null);

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
  const allergensCovered = useMemo(() =>
    new Set(FOODS.filter((f) => f.allergen && introduced.has(f.id)).map((f) => f.allergen)).size, [introduced]);

  // ── Блок «Сегодня»: одно самое важное действие дня ──
  const activeWin = windows.find((w) => w.day < 3 && w.reaction !== 'bad');
  const winFood = activeWin ? FOODS.find((f) => f.id === activeWin.id) : null;
  const age = Math.max(ageMonths ?? 6, 6);
  const todayIdea = useMemo(() => {
    // день в году — чтобы идея дня менялась сама, но не прыгала при каждом рендере
    const seed = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 864e5);
    if (ironCovered < Math.ceil(ironTotal / 2)) {
      const opts = FOODS.filter((f) => IRON_IDS.includes(f.id) && !introduced.has(f.id) && f.fromMonth <= age);
      if (opts.length) return { f: opts[seed % opts.length], why: 'Железо — фокус прикорма: запасы малыша тают после 6 месяцев.' };
    }
    const opts = FOODS.filter((f) => f.cat === weakest.cat && !introduced.has(f.id) && f.fromMonth <= age);
    if (opts.length) return { f: opts[seed % opts.length], why: `Группа «${weakest.cat}» пока отстаёт — расширим вкусовой опыт.` };
    return null;
  }, [introduced, ironCovered, ironTotal, weakest, age]);

  const todayStr = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── Приветствие: время суток + точный возраст ──
  const hello = useMemo(() => {
    const h = new Date().getHours();
    return h < 5 ? 'Тихой ночи 🌙' : h < 11 ? 'Доброе утро ☀️' : h < 17 ? 'Добрый день 🌤' : 'Добрый вечер 🌙';
  }, []);
  const ageText = useMemo(() => {
    if (!profile || ageMonths == null) return '';
    const bd = new Date(profile.birthDate);
    const now = new Date();
    let days = now.getDate() - bd.getDate();
    if (days < 0) days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    if (ageMonths >= 24) return `${Math.floor(ageMonths / 12)} г ${ageMonths % 12} мес`;
    if (ageMonths >= 12) return `${Math.floor(ageMonths / 12)} г ${ageMonths % 12} мес`;
    return days > 0 ? `${ageMonths} мес ${days} дн` : `${ageMonths} мес`;
  }, [profile, ageMonths]);

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

  const introducedCount = introduced.size;

  return (
    <>
      {profile && (
        <div className="hello st0">
          <div className="hello-t">{hello}</div>
          <div className="hello-s">{profile.name} · {ageText}</div>
        </div>
      )}

      <button className="ask-row st1" onClick={() => setSearchOpen(true)}>
        🔍 <span>Спросите: давится, запор, мало ест…</span>
      </button>

      {/* ═══ СЕГОДНЯ ═══ */}
      {notReady ? (
        <div className="card ready-card st2">
          <div className="eyebrow" style={{ color: 'var(--terra)' }}>Скоро прикорм · готовность</div>
          <div className="h-card" style={{ marginTop: 2 }}>{readyCount} из {READINESS.length} признаков</div>
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
      ) : fuEntry && fuFood?.food ? (
        <div className="card today-card st2">
          <div className="td-eyebrow">Сегодня · {todayStr}</div>
          <div className="fu-head">
            <span className="fu-e">{fuFood.food.e}</span>
            <div className="grow">
              <div className="h-card" style={{ margin: 0 }}>Как прошло с «{fuFood.label ?? fuFood.food.n}»?</div>
              <div className="sub" style={{ marginTop: 2 }}>Вы отметили «наблюдаю» ({fuEntry.date}). Если всё спокойно — закроем вопрос.</div>
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
        <div className="card today-card st2">
          <div className="td-eyebrow">Сегодня · {todayStr}</div>
          <div className="td-row">
            <span className="td-e">{winFood.e}</span>
            <div className="grow">
              <div className="h-card" style={{ margin: 0 }}>{winFood.n}: день {activeWin.day} из 3</div>
              <div className="sub" style={{ marginTop: 2 }}>Дайте утром привычную малую порцию и понаблюдайте. Реакции нет — вечером отметьте день.</div>
            </div>
          </div>
          <div className="td-actions">
            <button className="btn btn-primary td-btn" onClick={() => { markAllergenDay(activeWin.id); showToast('🗓', winFood.n, `День ${Math.min(activeWin.day + 1, 3)} из 3`); }}>
              ✓ День прошёл спокойно
            </button>
            <button className="btn btn-soft td-btn" onClick={() => setTodayFood(winFood)}>Карточка</button>
          </div>
        </div>
      ) : todayIdea ? (
        <div className="card today-card st2">
          <div className="td-eyebrow">Сегодня · {todayStr}</div>
          <div className="td-row">
            <span className="td-e">{todayIdea.f.e}</span>
            <div className="grow">
              <div className="h-card" style={{ margin: 0 }}>Идея дня: {todayIdea.f.n.toLowerCase()}</div>
              <div className="sub" style={{ marginTop: 2 }}>{todayIdea.why}</div>
            </div>
          </div>
          <div className="td-actions">
            <button className="btn btn-primary td-btn" onClick={() => setTodayFood(todayIdea.f)}>Как подать →</button>
          </div>
        </div>
      ) : null}

      {/* ═══ ДЕЙСТВИЯ ═══ */}
      {!notReady && (
        <div className="act-row st3">
          <button className="act-main" onClick={() => setLogOpen(true)}>
            <span className="act-plus">+</span> Записать пробу
          </button>
          <button className="act-side" onClick={() => setScanOpen(true)} aria-label="Проверить тарелку по фото">
            📸<span>тарелка</span>
          </button>
        </div>
      )}

      {/* ═══ ПЛАН: один умный вход ═══ */}
      {showP30 ? (
        <button className="card next-card st4" onClick={() => setPlan30Open(true)}>
          <div className="row">
            <div className="next-e">🗓</div>
            <div className="grow">
              <div className="eyebrow" style={{ color: 'var(--accent)' }}>Мой план · день {p30.cur!.d} из 30</div>
              <div className="h-card" style={{ margin: '2px 0 0' }}>{p30.cur!.t}</div>
              <div className="sub">План новичка: что и когда вводить — по шагам</div>
            </div>
            <span style={{ color: 'var(--text2)' }}>›</span>
          </div>
        </button>
      ) : (
        <button className="card next-card st4" onClick={goCatalog}>
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
      <div className="seg-row st5">
        <button className={`seg ${panel === 'iron' ? 'on' : ''}`} onClick={() => setPanel(panel === 'iron' ? null : 'iron')}>
          <span className="seg-e">🥩</span><b>{ironCovered}<i>/{ironTotal}</i></b><span>железо</span>
        </button>
        <button className={`seg ${panel === 'foods' ? 'on' : ''}`} onClick={() => setPanel(panel === 'foods' ? null : 'foods')}>
          <span className="seg-e">🌈</span><b>{introducedCount}<i>/{FOODS.length}</i></b><span>продукты</span>
        </button>
        <button className={`seg ${panel === 'allerg' ? 'on' : ''}`} onClick={() => setPanel(panel === 'allerg' ? null : 'allerg')}>
          <span className="seg-e">🥜</span><b>{allergensCovered}<i>/{BIG_ALLERGENS.size}</i></b><span>аллергены</span>
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
            <div className="sub" style={{ marginTop: 6 }}>Задача первого года — попробовать всего понемногу. Идея дня наверху всегда подсказывает отстающую группу.</div>
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
          <div key={w.id} className={`allerg-win ${safe ? 'safe' : ''}`}>
            <div style={{ fontSize: 22 }}>{f.e}</div>
            <div className="grow">
              <div className="fmap-n">{f.n}</div>
              <div className="fm-d">{status}</div>
              <div className="aw-days">{[1, 2, 3].map((d) => <i key={d} className={d <= w.day ? 'on' : ''} />)}</div>
            </div>
            {!safe && w.reaction !== 'bad' && (
              <button className="aw-check" onClick={() => { markAllergenDay(w.id); showToast('🗓', f.n, `День ${Math.min(w.day + 1, 3)} из 3`); }} aria-label="Отметить день">✓</button>
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
              <div className="fl-e">{f?.e ?? '🥣'}</div>
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
      <button className="fmap-status" onClick={() => setSchedOpen((v) => !v)}>
        <div className="fs-item"><span className="fs-e">⚖️</span><b>Объёмы порций</b><span>по возрасту</span></div>
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
      {searchOpen && <SearchSheet onClose={() => setSearchOpen(false)} />}
      {logOpen && <LogPicker onClose={() => setLogOpen(false)} />}
      {diaryOpen && <DiaryView onClose={() => setDiaryOpen(false)} />}
      {todayFood && <ProductSheet food={todayFood} onClose={() => setTodayFood(null)} />}
    </>
  );
}
