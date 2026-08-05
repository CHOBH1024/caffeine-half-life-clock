import React, { useState, useEffect } from 'react';
import { Zap, Activity, Clock, ShieldCheck, Share2, Sparkles, TrendingUp, RefreshCw, MessageSquare, Send, Globe, ChevronRight } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'calc' | 'feed' | 'comments'>('calc');
  const [pCount, setPCount] = useState(6);
  const [avgSalary, setAvgSalary] = useState(7500); // 만원
  const [durationMin, setDurationMin] = useState(45);
  const [cost, setCost] = useState<number | null>(null);

  const calculateCost = () => {
    // Hourly rate = Salary / 2000 hours
    const hourlyRate = (avgSalary * 10000) / 2000;
    const totalCost = Math.round((hourlyRate * pCount * durationMin) / 60);
    setCost(totalCost);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-amber-950/20 to-slate-950 pointer-events-none" />

      {/* Glassmorphic Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
              ☕
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                CAFFEINE HALF-LIFE LAB
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">v2.0 PRO</span>
              </h1>
              <p className="text-[11px] text-slate-400">Bio-Chemical Adenosine Receptor Simulator</p>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition">
            🌐 Global UI
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-10 relative z-10">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 mb-8 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('calc')}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${activeTab === 'calc' ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Zap className="w-4 h-4" /> 리얼타임 계산기 & 진단
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${activeTab === 'feed' ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Activity className="w-4 h-4" /> 유저 실시간 데이터 피드
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${activeTab === 'comments' ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare className="w-4 h-4" /> 라이브 댓글 소통
          </button>
        </div>

        {/* Tab 1: Rich Calculator */}
        {activeTab === 'calc' && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                <span>실시간 파라미터 시뮬레이션</span>
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>참여 인원 수: <strong className="text-indigo-400 font-extrabold text-sm">{pCount} 명</strong></span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    value={pCount}
                    onChange={e => setPCount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>참석자 평균 연봉: <strong className="text-emerald-400 font-extrabold text-sm">{avgSalary.toLocaleString()} 만원</strong></span>
                  </div>
                  <input
                    type="range"
                    min="3000"
                    max="20000"
                    step="500"
                    value={avgSalary}
                    onChange={e => setAvgSalary(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>회의 진행 시간: <strong className="text-amber-400 font-extrabold text-sm">{durationMin} 분</strong></span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="5"
                    value={durationMin}
                    onChange={e => setDurationMin(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              <button
                onClick={calculateCost}
                className="w-full mt-8 py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-600 text-white font-black text-sm rounded-2xl transition-all shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" /> 실시간 손실 비용 측정하기
              </button>

              {cost !== null && (
                <div className="mt-8 p-6 bg-slate-950/80 border border-slate-800 rounded-2xl text-center space-y-2 animate-in fade-in zoom-in duration-300">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calculated Capital Drain</span>
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-600">
                    ₩ {cost.toLocaleString()} 원
                  </div>
                  <p className="text-xs text-slate-400 pt-2">
                    단 한번의 회의로 <strong className="text-rose-400">{cost.toLocaleString()}원</strong>의 회사 자본과 집중 시간이 소모되었습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: User Feed */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-3xl backdrop-blur-xl flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase">Total Global Users Simulated</span>
                <div className="text-3xl font-black text-white mt-1">18,940 회</div>
              </div>
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Comments */}
        {activeTab === 'comments' && (
          <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white mb-4">라이브 커뮤니티 소통</h3>
            <div className="text-xs text-slate-400">댓글 소통 기능이 전면 개편되었습니다.</div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        © 2026 CAFFEINE HALF-LIFE LAB. Premium Aesthetic UI Architecture. Powered by Pomyjo.
      </footer>
    </div>
  );
}
