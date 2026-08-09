import { useState, useMemo } from 'react';
import {
  Coffee, Timer, Moon, Brain, AlertTriangle, Sparkles, Droplets, TrendingDown, Clock,
  Plus, Trash2, Share2, Check, FlaskConical, BookOpen, ListChecks, HelpCircle,
} from 'lucide-react';
import { CommunityFeed } from './components/CommunityFeed';

// 카페인 데이터 (mg)
const DRINKS = [
  { name: '아메리카노 (Tall)', mg: 150, icon: '☕' },
  { name: '에스프레소 (샷)', mg: 63, icon: '⚡' },
  { name: '카페라떼 (Tall)', mg: 75, icon: '🥛' },
  { name: '콜드브루 (Tall)', mg: 200, icon: '🧊' },
  { name: '에너지 드링크', mg: 160, icon: '🔋' },
  { name: '콜라 (캔)', mg: 34, icon: '🥤' },
  { name: '녹차 (잔)', mg: 28, icon: '🍵' },
  { name: '홍차 (잔)', mg: 47, icon: '🫖' },
  { name: '초콜릿 (바)', mg: 20, icon: '🍫' },
  { name: '디카페인 커피', mg: 7, icon: '☕' },
];

// 개인 대사 특성에 따른 반감기 보정 계수 (참고용 추정치)
const METABOLISM_FACTORS = [
  { id: 'normal', label: '일반 성인', mult: 1, desc: '평균적인 카페인 대사 속도예요.' },
  { id: 'smoker', label: '흡연자', mult: 0.5, desc: '니코틴이 간 효소(CYP1A2)를 활성화해 대사가 훨씬 빨라져요.' },
  { id: 'pill', label: '경구 피임약 복용', mult: 1.4, desc: '에스트로겐이 카페인 분해 효소를 억제해 대사가 느려져요.' },
  { id: 'liver', label: '간 기능 저하', mult: 2, desc: '간의 분해 능력이 떨어져 카페인이 오래 머물러요.' },
  { id: 'pregnant', label: '임신 중 (후기)', mult: 2.5, desc: '호르몬 변화로 대사가 큰 폭으로 느려지는 시기예요.' },
];

const HALF_LIFE_HOURS = 5.7; // 카페인 반감기 평균 (일반 성인)
const SAFE_SLEEP_THRESHOLD = 50; // 수면 방해 임계값 (mg) — 취침 시점 기준
const DAILY_LIMIT = 400; // 1일 권장 상한 (mg)
const GRAPH_HOURS = 18;

interface Intake {
  mg: number;
  time: string;
}

function parseHM(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

function fmt(mins: number): string {
  const norm = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = Math.floor(norm % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function caffeineRemaining(mg: number, hours: number, halfLifeHours: number): number {
  if (hours < 0) return 0;
  return mg * Math.pow(0.5, hours / halfLifeHours);
}

function totalRemainingAt(atMin: number, intakes: Intake[], halfLifeHours: number): number {
  return intakes.reduce((sum, it) => {
    const h = ((atMin - parseHM(it.time) + 1440) % 1440) / 60;
    return sum + caffeineRemaining(it.mg, h, halfLifeHours);
  }, 0);
}

export function App() {
  const [drinkIdx, setDrinkIdx] = useState(0);
  const [customMg, setCustomMg] = useState<number>(150);
  const [drinkTime, setDrinkTime] = useState('14:00');
  const [bedTime, setBedTime] = useState('23:00');
  const [useCustom, setUseCustom] = useState(false);
  const [factorId, setFactorId] = useState('normal');
  const [extras, setExtras] = useState<Intake[]>([]);
  const [copied, setCopied] = useState(false);

  const drink = DRINKS[drinkIdx];
  const mg = useCustom ? customMg : drink.mg;
  const factor = METABOLISM_FACTORS.find(f => f.id === factorId) ?? METABOLISM_FACTORS[0];
  const effectiveHalfLife = HALF_LIFE_HOURS * factor.mult;

  const now = useMemo(() => new Date(), []);
  const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const bedMin = parseHM(bedTime);
  const nowMin = parseHM(nowStr);

  const addExtra = () => setExtras(e => (e.length >= 3 ? e : [...e, { mg: 100, time: nowStr }]));
  const removeExtra = (i: number) => setExtras(e => e.filter((_, idx) => idx !== i));
  const updateExtra = (i: number, patch: Partial<Intake>) =>
    setExtras(e => e.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const allIntakes: Intake[] = useMemo(
    () => [{ mg, time: drinkTime }, ...extras],
    [mg, drinkTime, extras]
  );
  const totalMg = allIntakes.reduce((s, i) => s + i.mg, 0);

  // 지금 이 순간 잔존량
  const nowRemaining = totalRemainingAt(nowMin, allIntakes, effectiveHalfLife);
  const halfLivesElapsed = totalMg > 0 && nowRemaining > 0.5
    ? Math.log2(totalMg / nowRemaining)
    : totalMg > 0 ? Math.log2(totalMg / 0.5) : 0;

  // 취침 시점 잔존량
  const atBed = totalRemainingAt(bedMin, allIntakes, effectiveHalfLife);
  const sleepSafe = atBed <= SAFE_SLEEP_THRESHOLD;
  const hoursToBedFromNow = ((bedMin - nowMin + 1440) % 1440) / 60;

  // 그래프: 지금부터 GRAPH_HOURS 시간 동안의 예측 곡선
  const curve = useMemo(() => {
    const pts: { h: number; mg: number }[] = [];
    for (let h = 0; h <= GRAPH_HOURS; h += 0.5) {
      pts.push({ h, mg: totalRemainingAt(nowMin + h * 60, allIntakes, effectiveHalfLife) });
    }
    return pts;
  }, [nowMin, allIntakes, effectiveHalfLife]);
  const maxY = Math.max(...curve.map(p => p.mg), 10) * 1.15;

  // 완전 소멸 예상 (지금으로부터, 1mg 미만이 될 때까지 수치 탐색)
  const clearHours = useMemo(() => {
    let h = 0;
    while (h < 72) {
      if (totalRemainingAt(nowMin + h * 60, allIntakes, effectiveHalfLife) < 1) return h;
      h += 0.25;
    }
    return h;
  }, [nowMin, allIntakes, effectiveHalfLife]);
  const clearTime = fmt(nowMin + clearHours * 60);

  // 권장 마지막 섭취 시각 — 선택한 음료 용량과 개인 대사 계수를 반영해 역산
  const hoursNeededSafe = mg > SAFE_SLEEP_THRESHOLD
    ? effectiveHalfLife * Math.log2(mg / SAFE_SLEEP_THRESHOLD)
    : 0;
  const lastDrinkOk = fmt(bedMin - hoursNeededSafe * 60);

  // SVG 좌표
  const W = 560, H = 200, PAD = 34;
  const px = (h: number) => PAD + (h / GRAPH_HOURS) * (W - PAD * 2);
  const py = (v: number) => H - PAD - (v / maxY) * (H - PAD * 2);
  const path = curve.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.h).toFixed(1)},${py(p.mg).toFixed(1)}`).join(' ');

  type Tier = 'safe' | 'caution' | 'danger';
  const tier: Tier = sleepSafe ? 'safe' : atBed > 150 ? 'danger' : 'caution';

  const sleepStatus = {
    safe: { text: '안전해요! 취침 시 카페인이 거의 소멸됨', color: 'text-emerald-400', bar: 'bg-emerald-500', chip: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', label: '안전 수면형' },
    caution: { text: '주의! 취침 시 카페인 잔존 → 수면 질 저하 가능', color: 'text-amber-400', bar: 'bg-amber-500', chip: 'bg-amber-500/15 text-amber-400 border border-amber-500/30', label: '주의 필요형' },
    danger: { text: '위험! 취침 시 카페인 다량 잔존 → 숙면 불가', color: 'text-rose-400', bar: 'bg-rose-500', chip: 'bg-rose-500/15 text-rose-400 border border-rose-500/30', label: '카페인 과다형' },
  }[tier];

  const scienceText: Record<Tier, string> = {
    safe: `카페인은 뇌의 아데노신 수용체를 막아 각성 효과를 내는데, 취침 시점에 혈중 농도가 충분히 낮아지면 수면을 유도하는 아데노신이 정상적으로 작용해요. 그 결과 입면 시간과 깊은 수면(서파수면) 비율이 정상 범위에 가깝게 유지될 가능성이 높습니다.`,
    caution: `카페인이 아데노신 수용체를 일부 계속 막고 있는 상태라, 잠들기까지 걸리는 시간이 평소보다 늘어나고 얕은 수면 비중이 높아질 수 있어요. 특히 새벽에 자주 깨는 '단편수면'으로 이어지기 쉽습니다.`,
    danger: `이 정도 농도의 카페인은 아데노신 수용체를 강하게 차단해 졸음 신호 자체를 억제해요. 잠들더라도 깊은 수면과 렘수면 비율이 크게 줄어들어, 자고 일어나도 피로가 풀리지 않는 얕은 수면에 빠지기 쉽습니다.`,
  };

  const actionSteps: Record<Tier, string[]> = {
    safe: [
      '지금 패턴이 잘 맞고 있어요 — 같은 섭취 시각을 유지해보세요.',
      '컨디션이 괜찮다면 오전~이른 오후 사이에서는 섭취량을 조금 늘려도 여유가 있어요.',
      '취침 1시간 전 스마트폰 사용을 줄이면 수면의 질을 한 단계 더 높일 수 있어요.',
    ],
    caution: [
      `내일부터는 마지막 섭취 시각을 ${lastDrinkOk} 이전으로 당겨보세요.`,
      '오후 카페인은 절반 용량이나 디카페인 블렌드로 바꿔보는 것도 방법이에요.',
      '취침 3시간 전부터는 물이나 허브차로 대체해 수분을 보충하세요.',
    ],
    danger: [
      `다음부터는 ${lastDrinkOk} 이전에 마지막 섭취를 마쳐보세요.`,
      '오후 낮잠은 피하는 게 좋아요 — 밤에 졸음 압력이 더 줄어들 수 있어요.',
      '취침 전 가벼운 스트레칭이나 미온수 샤워로 몸에 이완 신호를 줘보세요.',
      '내일은 카페인 섭취를 오전 시간대에 몰아서 시도해보세요.',
    ],
  };

  const handleShare = async () => {
    const text = `☕ 카페인 반감기 진단: ${sleepStatus.label}\n취침 시 잔존 카페인 ${Math.round(atBed)}mg · 완전 소멸 ${clearTime}\n${typeof window !== 'undefined' ? window.location.href : ''}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'CAFFEINE HALF-LIFE LAB', text, url: window.location.href });
        return;
      } catch {
        // 사용자가 공유를 취소한 경우 — 클립보드 복사로 대체
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fadeIn = (delayMs: number) => ({ animation: 'fadeInUp 0.6s ease-out both', animationDelay: `${delayMs}ms` });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-amber-950/20 to-slate-950 pointer-events-none" />

      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
              ☕
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                CAFFEINE HALF-LIFE LAB
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">v3.0 PERSONAL</span>
              </h1>
              <p className="text-[11px] text-slate-400">개인 맞춤 혈중 카페인 시뮬레이터 · 대사 속도 반영</p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-300">
            ⏰ 현재 {nowStr}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 relative z-10 space-y-6">
        {/* 입력 카드 */}
        <div style={fadeIn(0)} className="bg-slate-900/70 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-lg font-black text-white mb-5 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-400" /> 카페인 섭취 입력
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">음료 선택</label>
              <div className="grid grid-cols-2 gap-2">
                {DRINKS.map((d, i) => (
                  <button
                    key={d.name}
                    onClick={() => { setDrinkIdx(i); setUseCustom(false); }}
                    className={`px-3 py-2.5 rounded-xl text-left border text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                      !useCustom && drinkIdx === i
                        ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="mr-1.5">{d.icon}</span>
                    {d.name.split(' (')[0]}
                    <span className="block text-[10px] text-slate-500 mt-0.5">{d.mg}mg</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>카페인 용량</span>
                  <strong className="text-amber-400">{mg} mg</strong>
                </div>
                <input
                  type="range" min="5" max="400" step="5"
                  value={mg}
                  onChange={e => { setCustomMg(Number(e.target.value)); setUseCustom(true); }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">슬라이더로 직접 조절 가능</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5" /> 섭취 시각
                  </label>
                  <input
                    type="time" value={drinkTime} onChange={e => setDrinkTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5" /> 취침 시각
                  </label>
                  <input
                    type="time" value={bedTime} onChange={e => setBedTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 체질 · 추가 섭취 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-5 border-t border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5" /> 체질 · 복용 상태
              </label>
              <select
                value={factorId}
                onChange={e => setFactorId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                {METABOLISM_FACTORS.map(f => (
                  <option key={f.id} value={f.id}>{f.label} · 반감기 {(HALF_LIFE_HOURS * f.mult).toFixed(1)}h</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{factor.desc} 정확한 진단이 아닌 참고용 추정치예요.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> 오늘 추가로 마신 카페인
                </label>
                {extras.length < 3 && (
                  <button onClick={addExtra} className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 transition-colors">
                    <Plus className="w-3 h-3" /> 추가
                  </button>
                )}
              </div>
              {extras.length === 0 ? (
                <p className="text-[10px] text-slate-500 leading-relaxed">커피 외에 콜라·차·에너지드링크가 더 있다면 추가해서 합산할 수 있어요.</p>
              ) : (
                <div className="space-y-2">
                  {extras.map((ex, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl p-2">
                      <input
                        type="number" min={5} max={400} value={ex.mg}
                        onChange={e => updateExtra(i, { mg: Number(e.target.value) })}
                        className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-slate-500 shrink-0">mg</span>
                      <input
                        type="time" value={ex.time}
                        onChange={e => updateExtra(i, { time: e.target.value })}
                        className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                      />
                      <button onClick={() => removeExtra(i)} className="shrink-0 text-slate-500 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 현재 상태 카드 */}
        <div style={fadeIn(80)} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" /> 지금 내 몸 속
            </span>
            <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mt-2">
              {Math.round(nowRemaining)} <span className="text-base">mg</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">약 {halfLivesElapsed.toFixed(1)}번의 반감기 경과</p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5" /> 오늘 총 섭취량
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">
              {totalMg} <span className="text-base">mg</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{allIntakes.length}회 · 상한 {DAILY_LIMIT}mg 대비 {Math.round((totalMg / DAILY_LIMIT) * 100)}%</p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5" /> 완전 소멸 예상
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">
              {clearTime}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">지금으로부터 약 {clearHours.toFixed(1)}시간 후</p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 안전한 마지막 섭취
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">
              {lastDrinkOk}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{useCustom ? '커스텀' : drink.name.split(' (')[0]} {mg}mg · 반감기 {effectiveHalfLife.toFixed(1)}h 기준</p>
          </div>
        </div>

        {/* 그래프 카드 */}
        <div style={fadeIn(140)} className="bg-slate-900/70 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 hover:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-400" /> 혈중 카페인 예측 곡선
            </h3>
            <span className="text-[10px] text-slate-500">지금부터 {GRAPH_HOURS}시간 · 반감기 {effectiveHalfLife.toFixed(1)}h 기준</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {/* 그리드 */}
            {[0, 3, 6, 9, 12, 15, 18].map(h => (
              <g key={h}>
                <line x1={px(h)} y1={PAD} x2={px(h)} y2={H - PAD} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <text x={px(h)} y={H - 12} fontSize="10" fill="#64748b" textAnchor="middle">{fmt(nowMin + h * 60)}</text>
              </g>
            ))}
            {[0.25, 0.5, 0.75, 1].map(r => (
              <text key={r} x={PAD - 6} y={py(maxY * r) + 3} fontSize="9" fill="#64748b" textAnchor="end">
                {Math.round(maxY * r)}mg
              </text>
            ))}
            {/* 커브 */}
            <path d={path} fill="none" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round" />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            {/* 취침 시점 마커 */}
            {hoursToBedFromNow <= GRAPH_HOURS && (
              <>
                <line x1={px(hoursToBedFromNow)} y1={PAD - 6} x2={px(hoursToBedFromNow)} y2={H - PAD} stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 2" />
                <text x={px(hoursToBedFromNow)} y={PAD - 12} fontSize="9" fill="#818cf8" textAnchor="middle">🌙 취침</text>
                <circle cx={px(hoursToBedFromNow)} cy={py(atBed)} r="5" fill="#818cf8" />
              </>
            )}
            {/* 현재 시점 마커 */}
            <circle cx={px(0)} cy={py(nowRemaining)} r="5" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" />
            <text x={px(0) + 4} y={py(nowRemaining) - 10} fontSize="9" fill="#fbbf24" textAnchor="start">현재</text>
          </svg>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>지금 ({nowStr})</span>
            <span>{GRAPH_HOURS}시간 후</span>
          </div>
        </div>

        {/* 수면 진단 카드 */}
        <div style={fadeIn(200)} className={`bg-slate-900/70 border p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 ${tier === 'safe' ? 'border-emerald-800/60' : tier === 'danger' ? 'border-rose-800/60' : 'border-amber-800/60'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2 mb-1">
                <Moon className="w-4 h-4 text-indigo-400" /> 취침 시 카페인 진단
              </h3>
              <p className={`text-sm font-extrabold ${sleepStatus.color}`}>{sleepStatus.text}</p>
              <p className="text-xs text-slate-400 mt-1">
                취침 시점 예상 잔존량 <strong className="text-white">{Math.round(atBed)}mg</strong>
                {atBed > SAFE_SLEEP_THRESHOLD && (
                  <span className="text-slate-500"> (안전 기준 {SAFE_SLEEP_THRESHOLD}mg 초과)</span>
                )}
              </p>
            </div>
            <div className={`p-3 rounded-2xl ${tier === 'safe' ? 'bg-emerald-500/10 text-emerald-400' : tier === 'danger' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {tier === 'safe' ? <Sparkles className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
          </div>
          {/* 잔존량 바 */}
          <div className="mt-4 h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${sleepStatus.bar} transition-all duration-700 ease-out`}
              style={{ width: `${Math.min(100, (atBed / Math.max(totalMg, 1)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>0mg</span>
            <span>{totalMg}mg (오늘 총 섭취량)</span>
          </div>

          {/* 왜 이런 결과가? */}
          <div className="mt-5 pt-5 border-t border-slate-800/80">
            <p className="text-xs font-bold text-slate-300 mb-1.5">💡 왜 이런 결과가 나왔을까요?</p>
            <p className="text-xs text-slate-400 leading-relaxed">{scienceText[tier]}</p>
          </div>

          {/* 실천 가이드 */}
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <p className="text-xs font-bold text-slate-300 mb-2">✅ 지금 바로 해볼 수 있는 것</p>
            <ul className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
              {actionSteps[tier].map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-400 shrink-0">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 팁 카드 */}
        <div style={fadeIn(260)} className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-800/40 p-6 rounded-3xl">
          <h3 className="text-sm font-black text-white flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" /> 똑똑한 카페인 습관 TIP
          </h3>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <li>• 카페인 반감기는 <strong className="text-amber-400">평균 5.7시간</strong> — 오후 3시 커피는 밤 12시에도 절반 가까이 남아있어요.</li>
            <li>• 숙면을 원하면 취침 시점 잔존량을 <strong className="text-amber-400">50mg 이하</strong>로 맞추는 게 정석이에요.</li>
            <li>• 흡연·임신·피임약·간 기능에 따라 반감기가 <strong className="text-amber-400">2.5~14시간</strong>까지 크게 달라질 수 있어요.</li>
            <li>• 여러 잔을 마셨다면 각각의 잔존량이 개별적으로 줄어들며 누적돼요 — 합산 기준으로 관리해야 정확해요.</li>
            <li>• 1일 권장 상한은 <strong className="text-amber-400">400mg</strong> (임산부 200mg) — 카페인은 각성제일 뿐 에너지원이 아니에요.</li>
          </ul>
        </div>

        {/* 결과 공유 카드 */}
        <div style={fadeIn(320)} className="relative overflow-hidden rounded-3xl p-6 border border-amber-800/40 bg-gradient-to-br from-amber-500/10 via-slate-900/80 to-slate-900/80 backdrop-blur-xl">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black mb-2 ${sleepStatus.chip}`}>
                {sleepStatus.label}
              </span>
              <p className="text-sm text-slate-300">
                취침 시 잔존 카페인 <strong className="text-white">{Math.round(atBed)}mg</strong> · 완전 소멸 <strong className="text-white">{clearTime}</strong>
              </p>
            </div>
            <button
              onClick={handleShare}
              className="shrink-0 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-amber-500/20"
            >
              {copied ? <><Check className="w-4 h-4" /> 복사 완료!</> : <><Share2 className="w-4 h-4" /> 이 결과, 지금 공유하기</>}
            </button>
          </div>
        </div>

        {/* 커뮤니티 피드 */}
        <div style={fadeIn(380)}>
          <CommunityFeed resultType={sleepStatus.label} />
        </div>

        {/* SEO 본문: 가이드 1 */}
        <section style={fadeIn(420)} className="bg-slate-900/50 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-3">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" /> 카페인 반감기 계산기란 무엇인가
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            카페인 반감기 계산기는 내가 마신 커피나 에너지 음료 속 카페인이 시간이 지나면서 혈중에서 얼마나 남아있는지를 계산해주는 도구예요.
            카페인은 몸속에서 일정한 속도로 분해되는데, 이때 '혈중 농도가 절반으로 줄어드는 데 걸리는 시간'을 반감기(half-life)라고 부릅니다.
            성인 기준 카페인의 평균 반감기는 약 5~6시간이지만, 체질과 생활 습관에 따라 2.5시간에서 14시간 이상까지 크게 달라질 수 있어요.
            이 계산기는 섭취량, 섭취 시각, 그리고 흡연·임신·피임약 복용 같은 개인의 대사 특성을 입력받아 지금 이 순간 몸속에 남아있는 카페인의 양과
            완전히 빠져나가는 예상 시각, 그리고 숙면을 방해하지 않는 마지막 섭취 시각까지 한눈에 보여줍니다.
            단순히 "카페인을 줄이자"는 막연한 조언을 넘어, 나에게 맞는 구체적인 숫자와 타이밍을 제시해준다는 점에서 실질적인 수면 관리 도구로 활용할 수 있어요.
          </p>
        </section>

        {/* SEO 본문: 가이드 2 */}
        <section style={fadeIn(460)} className="bg-slate-900/50 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-amber-400" /> 카페인 반감기 계산기 실천 전략 5가지
          </h2>
          <ol className="space-y-3 text-sm text-slate-300 leading-relaxed">
            {[
              { title: '나만의 카페인 컷오프 시간 정하기', body: '계산기로 확인한 "안전한 마지막 섭취 시각"을 알람이나 캘린더에 등록해두면 매일 지키기 쉬운 습관으로 자리잡아요.' },
              { title: '대사 속도가 느리다면 오전에 몰아서 섭취하기', body: '임신, 피임약 복용, 간 기능 저하 등으로 반감기가 길다면 오후 카페인은 특히 조심해야 해요.' },
              { title: '오후엔 디카페인으로 서서히 전환하기', body: '오후 2~3시 이후엔 디카페인 커피나 허브차로 바꾸면 잔존량 걱정 없이 카페인 습관을 유지할 수 있어요.' },
              { title: '여러 잔의 카페인을 합산해서 관리하기', body: '커피 한 잔뿐 아니라 콜라, 초콜릿, 에너지 음료까지 하루 동안 섭취한 카페인을 모두 더해 400mg 상한선을 넘기지 않도록 확인하세요.' },
              { title: '잠들기 전 50mg 이하를 목표로 삼기', body: '취침 시점 혈중 카페인이 50~100mg를 넘으면 입면 시간이 늘어나고 깊은 수면(서파수면)이 줄어드는 경향이 있어요. "취침 시 잔존량" 결과를 이 기준 아래로 맞춰보세요.' },
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 text-xs font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                <span><strong className="text-white">{s.title}</strong> — {s.body}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* SEO 본문: FAQ */}
        <section style={fadeIn(500)} className="bg-slate-900/50 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" /> 자주 묻는 질문
          </h2>
          <div className="space-y-3">
            {[
              { q: '카페인 반감기는 사람마다 정말 다른가요?', a: '네, 유전적으로 카페인을 분해하는 CYP1A2 효소의 활성도가 사람마다 달라서 같은 커피 한 잔을 마셔도 누군가는 3시간, 누군가는 9시간 넘게 각성 효과가 지속돼요. 흡연, 임신, 간 기능, 특정 약물 복용 여부도 반감기에 큰 영향을 줍니다.' },
              { q: '계산기에서 나온 시간이 실제와 다를 수도 있나요?', a: '이 계산기는 평균적인 약동학 데이터를 기반으로 한 추정치예요. 실제 체내 카페인 농도는 식사 여부, 수분 섭취량, 스트레스, 복용 중인 약물 등 다양한 변수에 영향을 받기 때문에 참고용 지표로 활용하시고, 정확한 진단이 필요하다면 의료 전문가와 상담하세요.' },
              { q: '카페인이 완전히 빠져나가야만 잠들 수 있나요?', a: '꼭 그렇지는 않아요. 카페인이 소량 남아있어도 숙면에 큰 지장이 없는 사람도 있습니다. 다만 일반적으로 취침 시점 혈중 카페인이 50mg를 넘으면 입면 시간이 길어지고 깊은 수면 비율이 줄어드는 경향이 있다는 연구 결과가 있어, 이 계산기는 50mg를 기준선으로 삼고 있어요.' },
              { q: '카페인을 아예 끊는 게 숙면에 가장 좋은가요?', a: '반드시 그런 것은 아니에요. 오히려 갑자기 끊으면 두통이나 피로 같은 금단 증상이 나타날 수 있어요. 중요한 것은 섭취량 자체보다 "타이밍"입니다. 오전~이른 오후에 즐기고, 계산기가 알려주는 컷오프 시간 이후에는 자제하는 것이 카페인을 포기하지 않으면서도 숙면을 지키는 현실적인 방법이에요.' },
            ].map((f, i) => (
              <details key={i} className="group bg-slate-800/50 border border-slate-700 rounded-2xl p-4 open:border-amber-500/40 transition-colors">
                <summary className="text-sm font-bold text-white cursor-pointer list-none flex justify-between items-center gap-3">
                  {f.q}
                  <span className="text-amber-400 group-open:rotate-45 transition-transform duration-200 text-lg leading-none shrink-0">+</span>
                </summary>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        © 2026 CAFFEINE HALF-LIFE LAB · 개인 맞춤 반감기 시뮬레이터 v3.0 · 개인 건강 참고용 (의학적 조언 아님)
      </footer>
    </div>
  );
}
