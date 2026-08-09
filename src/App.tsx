import { useState, useMemo } from 'react';
import { Coffee, Timer, Moon, Brain, AlertTriangle, Sparkles, Droplets, TrendingDown, Clock } from 'lucide-react';
import { CommunityFeed } from './components/CommunityFeed';

// 카페인 데이터 (mg)
const DRINKS = [
  { name: '아메리카노 (Tall)', mg: 150, icon: '☕', color: '#b45309' },
  { name: '에스프레소 (샷)', mg: 63, icon: '⚡', color: '#92400e' },
  { name: '카페라떼 (Tall)', mg: 75, icon: '🥛', color: '#a16207' },
  { name: '콜드브루 (Tall)', mg: 200, icon: '🧊', color: '#78350f' },
  { name: '에너지 드링크', mg: 160, icon: '🔋', color: '#0e7490' },
  { name: '콜라 (캔)', mg: 34, icon: '🥤', color: '#be123c' },
  { name: '녹차 (잔)', mg: 28, icon: '🍵', color: '#15803d' },
  { name: '홍차 (잔)', mg: 47, icon: '🫖', color: '#9a3412' },
  { name: '초콜릿 (바)', mg: 20, icon: '🍫', color: '#6b21a8' },
  { name: '디카페인 커피', mg: 7, icon: '☕', color: '#78716c' },
];

const HALF_LIFE_HOURS = 5.7; // 카페인 반감기 평균
const SAFE_SLEEP_THRESHOLD = 50; // 수면 방해 임계값 (mg)

function caffeineRemaining(mg: number, hours: number): number {
  return mg * Math.pow(0.5, hours / HALF_LIFE_HOURS);
}

export function App() {
  const [drinkIdx, setDrinkIdx] = useState(0);
  const [customMg, setCustomMg] = useState<number>(150);
  const [drinkTime, setDrinkTime] = useState('14:00');
  const [bedTime, setBedTime] = useState('23:00');
  const [useCustom, setUseCustom] = useState(false);

  const drink = DRINKS[drinkIdx];
  const mg = useCustom ? customMg : drink.mg;

  const now = useMemo(() => new Date(), []);
  const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const parseHM = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  const fmt = (mins: number) => {
    const h = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
    const m = ((mins % 1440) + 1440) % 1440 % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const drinkMin = parseHM(drinkTime);
  const bedMin = parseHM(bedTime);
  const nowMin = parseHM(nowStr);

  // 그래프: 섭취 후 0~12시간
  const hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const curve = hours.map(h => ({ h, mg: caffeineRemaining(mg, h) }));
  const maxY = mg * 1.1;

  // 취침 시점 남은 카페인
  const hoursToBed = ((bedMin - drinkMin + 1440) % 1440) / 60;
  const atBed = caffeineRemaining(mg, hoursToBed);
  const sleepSafe = atBed <= SAFE_SLEEP_THRESHOLD;

  // 현재 남은 카페인
  const hoursSince = ((nowMin - drinkMin + 1440) % 1440) / 60;
  const nowRemaining = caffeineRemaining(mg, hoursSince);

  // 완전 소멸 시각 (1mg 미만)
  const clearHours = Math.ceil(HALF_LIFE_HOURS * Math.log2(mg));
  const clearTime = fmt(drinkMin + clearHours * 60);

  // 권장 마지막 섭취 시각 (취침 6시간 전)
  const lastDrinkOk = fmt(bedMin - 6 * 60);

  // SVG 좌표
  const W = 560, H = 180, PAD = 34;
  const px = (h: number) => PAD + (h / 12) * (W - PAD * 2);
  const py = (v: number) => H - PAD - (v / maxY) * (H - PAD * 2);
  const path = curve.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.h).toFixed(1)},${py(p.mg).toFixed(1)}`).join(' ');

  const sleepStatus = sleepSafe
    ? { text: '안전해요! 취침 시 카페인이 거의 소멸됨', color: 'text-emerald-400', bar: 'bg-emerald-500', label: '안전 수면형' }
    : atBed > 150
      ? { text: '위험! 취침 시 카페인 다량 잔존 → 숙면 불가', color: 'text-rose-400', bar: 'bg-rose-500', label: '카페인 과다형' }
      : { text: '주의! 취침 시 카페인 잔존 → 수면 질 저하 가능', color: 'text-amber-400', bar: 'bg-amber-500', label: '주의 필요형' };

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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">v2.1 REAL</span>
              </h1>
              <p className="text-[11px] text-slate-400">혈중 카페인 농도 시뮬레이터 · 반감기 5.7h</p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-300">
            ⏰ 현재 {nowStr}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 relative z-10 space-y-6">
        {/* 입력 카드 */}
        <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
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
                    className={`px-3 py-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                      !useCustom && drinkIdx === i
                        ? 'bg-amber-500/15 border-amber-500/50 text-white'
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5" /> 취침 시각
                  </label>
                  <input
                    type="time" value={bedTime} onChange={e => setBedTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 현재 상태 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-3xl backdrop-blur-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" /> 지금 내 몸 속
            </span>
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mt-2">
              {Math.round(nowRemaining)} <span className="text-base">mg</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">섭취 {hoursSince.toFixed(1)}시간 후 잔존량</p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-3xl backdrop-blur-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5" /> 완전 소멸 예상
            </span>
            <div className="text-3xl font-black text-white mt-2">
              {clearTime}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">약 {clearHours}시간 후 (1mg 미만)</p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-3xl backdrop-blur-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 안전한 마지막 섭취
            </span>
            <div className="text-3xl font-black text-white mt-2">
              {lastDrinkOk}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">취침 6시간 전까지 마셔야 숙면 가능</p>
          </div>
        </div>

        {/* 그래프 카드 */}
        <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-400" /> 혈중 카페인 감소 곡선
            </h3>
            <span className="text-[10px] text-slate-500">반감기 {HALF_LIFE_HOURS}시간 기준</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {/* 그리드 */}
            {[0, 3, 6, 9, 12].map(h => (
              <g key={h}>
                <line x1={px(h)} y1={PAD} x2={px(h)} y2={H - PAD} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <text x={px(h)} y={H - 12} fontSize="10" fill="#64748b" textAnchor="middle">{h}h</text>
              </g>
            ))}
            {[0.25, 0.5, 0.75, 1].map(r => (
              <text key={r} x={PAD - 6} y={py(maxY * r) + 3} fontSize="9" fill="#64748b" textAnchor="end">
                {Math.round(mg * r)}mg
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
            <line x1={px(hoursToBed)} y1={PAD - 6} x2={px(hoursToBed)} y2={H - PAD} stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x={px(hoursToBed)} y={PAD - 12} fontSize="9" fill="#818cf8" textAnchor="middle">🌙 취침</text>
            <circle cx={px(hoursToBed)} cy={py(atBed)} r="5" fill="#818cf8" />
            {/* 현재 시점 마커 */}
            {hoursSince <= 12 && (
              <>
                <circle cx={px(hoursSince)} cy={py(nowRemaining)} r="5" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" />
                <text x={px(hoursSince)} y={py(nowRemaining) - 10} fontSize="9" fill="#fbbf24" textAnchor="middle">현재</text>
              </>
            )}
          </svg>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>섭취 직후</span>
            <span>12시간 후</span>
          </div>
        </div>

        {/* 수면 진단 카드 */}
        <div className={`bg-slate-900/70 border p-6 rounded-3xl backdrop-blur-xl ${sleepSafe ? 'border-emerald-800/60' : atBed > 150 ? 'border-rose-800/60' : 'border-amber-800/60'}`}>
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
            <div className={`p-3 rounded-2xl ${sleepSafe ? 'bg-emerald-500/10 text-emerald-400' : atBed > 150 ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {sleepSafe ? <Sparkles className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
          </div>
          {/* 잔존량 바 */}
          <div className="mt-4 h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${sleepStatus.bar} transition-all duration-500`}
              style={{ width: `${Math.min(100, (atBed / mg) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>0mg</span>
            <span>{mg}mg (섭취량)</span>
          </div>
        </div>

        {/* 팁 카드 */}
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-800/40 p-6 rounded-3xl">
          <h3 className="text-sm font-black text-white flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" /> 똑똑한 카페인 습관 TIP
          </h3>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <li>• 카페인 반감기는 <strong className="text-amber-400">평균 5.7시간</strong> — 오후 3시 커피는 밤 12시에도 절반이 남아요.</li>
            <li>• 숙면을 원하면 취침 <strong className="text-amber-400">6시간 전</strong>부터 카페인 금지가 정석.</li>
            <li>• 몸무게·간 효소·피임약 복용에 따라 반감기가 2.5~10시간까지 달라져요.</li>
            <li>• 1일 권장 상한은 <strong className="text-amber-400">400mg</strong> (임산부 200mg).</li>
            <li>• 카페인은 각성제일 뿐 에너지원이 아니에요 — 피로를 숨길 뿐!</li>
          </ul>
        </div>

        {/* 커뮤니티 피드 */}
        <CommunityFeed resultType={sleepStatus.label} />
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        © 2026 CAFFEINE HALF-LIFE LAB · 반감기 시뮬레이터 v2.1 · 개인 건강 참고용 (의학적 조언 아님)
      </footer>
    </div>
  );
}
