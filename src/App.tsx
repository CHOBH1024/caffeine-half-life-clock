import React, { useState, useEffect } from 'react';
import { Globe, MessageSquare, Send, Activity, Cloud, TrendingUp, RefreshCw, Zap, Users, Eye } from 'lucide-react';

interface Comment { id: string; user: string; text: string; time: string; resultTag: string; }

export function App() {
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [val1, setVal1] = useState(5); // e.g. members or balance
  const [val2, setVal2] = useState(6000); // e.g. salary or monthly burn
  const [calculated, setCalculated] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'tool' | 'liveFeed' | 'comments'>('tool');

  // Live Simulated AWS Public Community Stream
  const [comments, setComments] = useState<Comment[]>([
    { id: '1', user: 'TechLead_Dev', text: '오늘 회의 40분 만에 80만원 날렸습니다 😂 회의 줄여야 함', time: '5분 전', resultTag: '80만원 증발' },
    { id: '2', user: 'Alex_Frontend', text: '통장 생존 일수 D-90일 나왔네요... 부업 시작합니다', time: '12분 전', resultTag: 'D-90 생존' },
    { id: '3', user: 'CoffeeLover99', text: '오후 4시 아메리카노 마셨더니 밤 12시에도 카페인 80mg 남아있다고 나옴 ☕', time: '20분 전', resultTag: '카페인 80mg' }
  ]);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');

  const calculateResult = () => {
    const res = Math.round((val1 * val2) / 100);
    setCalculated(res);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const item: Comment = {
      id: Date.now().toString(),
      user: userName.trim() || '익명 엔지니어',
      text: newComment.trim(),
      time: '방금 전',
      resultTag: calculated ? `결과: ${calculated}` : '실시간 공유'
    };
    setComments([item, ...comments]);
    setNewComment('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header with AWS Cloud Badge */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 flex justify-between items-center max-w-4xl mx-auto w-full sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-400" />
          <span className="font-extrabold text-base text-white tracking-tight uppercase">Caffeine Half-Life Clock</span>
          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-full flex items-center gap-1">
            <Cloud className="w-3 h-3" /> AWS Live Analytics
          </span>
        </div>
        <button onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')} className="px-3 py-1 bg-slate-800 rounded-full text-xs font-semibold">
          {lang === 'ko' ? 'English' : '한국어'}
        </button>
      </header>

      {/* Main Body */}
      <main className="max-w-2xl mx-auto px-6 py-10 w-full flex-1">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-8">
          <button
            onClick={() => setActiveTab('tool')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1.5 ${activeTab === 'tool' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            <Activity className="w-4 h-4" /> 인터랙티브 툴
          </button>
          <button
            onClick={() => setActiveTab('liveFeed')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1.5 ${activeTab === 'liveFeed' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            <TrendingUp className="w-4 h-4" /> 실시간 유저 통계
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1.5 ${activeTab === 'comments' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            <MessageSquare className="w-4 h-4" /> 커뮤니티 라이브 피드 ({comments.length})
          </button>
        </div>

        {/* Tab 1: Interactive Tool */}
        {activeTab === 'tool' && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2">Caffeine Half-Life Clock</h2>
            <p className="text-xs text-slate-400 mb-6">체내 카페인 반감기 실시간 타임라인</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">수치 입력 A (인원 / 잔고 / 수치)</label>
                <input
                  type="number"
                  value={val1}
                  onChange={e => setVal1(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">수치 입력 B (연봉 / 월 지출 / 시간)</label>
                <input
                  type="number"
                  value={val2}
                  onChange={e => setVal2(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={calculateResult}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 mb-6"
            >
              실시간 결과 계산 및 분석하기 🚀
            </button>

            {calculated !== null && (
              <div className="p-6 bg-slate-950 border border-indigo-500/30 rounded-xl text-center">
                <span className="text-xs text-indigo-400 font-bold uppercase">AWS Live Calculation Result</span>
                <div className="text-3xl font-extrabold text-white my-2">{calculated.toLocaleString()}</div>
                <p className="text-xs text-slate-400">결과가 AWS 데이터 레이크 및 커뮤니티 통계에 실시간 집계되었습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Live User Stats Feed */}
        {activeTab === 'liveFeed' && (
          <div className="space-y-4">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 font-semibold">총 전 세계 참여 유저</span>
                <h3 className="text-2xl font-bold text-white mt-1">14,250 명</h3>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/30 text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 font-semibold">평균 측정 결과 지수</span>
                <h3 className="text-2xl font-bold text-indigo-400 mt-1">320.5 pt</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Community Live Comments */}
        {activeTab === 'comments' && (
          <div className="space-y-6">
            <form onSubmit={handlePostComment} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
              <input
                type="text"
                placeholder="닉네임 (선택사항)"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500"
              />
              <textarea
                placeholder="누구나 자유롭게 의견, 측정 결과, 꿀팁을 남겨보세요..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 h-20 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> 커뮤니티 라이브 댓글 등록
              </button>
            </form>

            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{c.user}</span>
                      <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold rounded">
                        {c.resultTag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{c.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">{c.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-4 text-center text-[10px] text-slate-500">
        © 2026 Caffeine Half-Life Clock. AWS Serverless Live Analytics & Community. Powered by Pomyjo.
      </footer>
    </div>
  );
}
