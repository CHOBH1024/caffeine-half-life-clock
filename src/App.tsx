import React, { useState } from 'react';
import { Globe, MessageSquare, Share2, Eye, TrendingUp, Users, Send, Sparkles, Zap, Activity } from 'lucide-react';

interface ResultShare { id: string; user: string; archetype: string; emoji: string; time: string; note: string; }
interface Comment { id: string; user: string; text: string; time: string; }

export function App() {
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [tab, setTab] = useState<'survey' | 'publicFeed' | 'comments'>('survey');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult] = useState<any>(null);

  // Live Community Data
  const [publicShares, setPublicShares] = useState<ResultShare[]>([
    { id: '1', user: 'Alex_Engineer', archetype: '극단적 과몰입 스퍼터', emoji: '🔥', time: '3분 전', note: '마감 직전 초반 스퍼트 유형 나왔네요!' },
    { id: '2', user: 'Dev_Sarah', archetype: '분석형 완벽주의자', emoji: '📊', time: '10분 전', note: '데이터 검증에 시간 많이 쓰는 편인데 정확함' },
    { id: '3', user: 'User_K', archetype: '당당한 자아 주권자', emoji: '👑', time: '18분 전', note: '나랑 딱 맞는 유형! 공유합니다' }
  ]);

  const [comments, setComments] = useState<Comment[]>([
    { id: '1', user: 'CodeMaster', text: '이 결과 너무 신기하네요! 이전 접속자들 진단표도 볼 수 있어서 재밌음', time: '5분 전' },
    { id: '2', user: 'Frontend_Pro', text: '진단결과 다른 분들이랑 비교해보니까 내 유형이 특이한 편이네요 ㅋㅋㅋ', time: '15분 전' }
  ]);

  const [newComment, setNewComment] = useState('');
  const [nickname, setNickname] = useState('');
  const [shareNote, setShareNote] = useState('');

  const questions = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    textKo: `${i + 1}번 문항: 진단 상태 및 심리적 행동 패턴을 측정합니다.`,
    textEn: `Item ${i + 1}: Behavioral & diagnostic assessment.`
  }));

  const handleAnswer = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setResult({
        nameKo: "분석형 완벽주의자 (Analytical Perfectionist)",
        nameEn: "Analytical Perfectionist",
        emoji: "📊",
        descKo: "데이터와 정밀성을 추구하며 완벽한 결과를 위해 최선을 다하는 유형입니다.",
        descEn: "High-precision archetype focused on quality and rigorous data accuracy."
      });
    }
  };

  const handleShareResult = () => {
    if (!result) return;
    const shareItem: ResultShare = {
      id: Date.now().toString(),
      user: nickname.trim() || '익명 탐험가',
      archetype: result.nameKo,
      emoji: result.emoji,
      time: '방금 전',
      note: shareNote.trim() || '내 진단 결과를 커뮤니티 피드에 공유합니다!'
    };
    setPublicShares([shareItem, ...publicShares]);
    setShareNote('');
    setTab('publicFeed');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const item: Comment = {
      id: Date.now().toString(),
      user: nickname.trim() || '익명 개발자',
      text: newComment.trim(),
      time: '방금 전'
    };
    setComments([item, ...comments]);
    setNewComment('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 flex justify-between items-center max-w-4xl mx-auto w-full sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-400" />
          <span className="font-extrabold text-base text-white tracking-tight uppercase">caffeine-half-life-clock</span>
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
            <Globe className="w-3 h-3" /> Live Connected
          </span>
        </div>
        <button onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')} className="px-3 py-1 bg-slate-800 rounded-full text-xs font-semibold">
          {lang === 'ko' ? 'English' : '한국어'}
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-6 py-8 w-full flex-1">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-6">
          <button onClick={() => setTab('survey')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1 ${tab === 'survey' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            <Activity className="w-3.5 h-3.5" /> 진단하기
          </button>
          <button onClick={() => setTab('publicFeed')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1 ${tab === 'publicFeed' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            <Eye className="w-3.5 h-3.5" /> 접속자 진단 결과 피드 ({publicShares.length})
          </button>
          <button onClick={() => setTab('comments')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1 ${tab === 'comments' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            <MessageSquare className="w-3.5 h-3.5" /> 라이브 댓글 ({comments.length})
          </button>
        </div>

        {/* Tab 1: Survey & Share */}
        {tab === 'survey' && (
          <div>
            {!result ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>진단 문항 {currentIdx + 1} / 20</span>
                  <span>{Math.round(((currentIdx + 1) / 20) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((currentIdx + 1) / 20) * 100}%` }} />
                </div>
                <h2 className="text-lg font-bold text-white mb-6">{questions[currentIdx].textKo}</h2>
                <div className="grid gap-2.5">
                  {[5, 4, 3, 2, 1].map((s, i) => (
                    <button key={i} onClick={handleAnswer} className="p-3.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-xs text-left text-slate-200 transition">
                      {s === 5 ? "매우 그렇다 (Strongly Agree)" : s === 4 ? "그렇다 (Agree)" : s === 3 ? "보통이다 (Neutral)" : s === 2 ? "그렇지 않다 (Disagree)" : "전혀 그렇지 않다 (Strongly Disagree)"}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-2xl text-center space-y-6">
                <div className="text-6xl">{result.emoji}</div>
                <div>
                  <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-full">진단 결과</span>
                  <h1 className="text-2xl font-bold text-white my-2">{result.nameKo}</h1>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">{result.descKo}</p>
                </div>

                {/* Online Result Share Box */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-left space-y-3">
                  <h3 className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" /> 이 결과를 다른 접속자들과 실시간 공유하기
                  </h3>
                  <input
                    type="text"
                    placeholder="닉네임 (선택사항)"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="공유 한마디 메모 (예: 내 성향과 딱 들어맞네요!)"
                    value={shareNote}
                    onChange={e => setShareNote(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                  <button onClick={handleShareResult} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition">
                    라이브 피드에 내 진단 결과 등록하기 🚀
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Public Diagnostics Feed */}
        {tab === 'publicFeed' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
              <span className="text-slate-400">실시간 유저 진단 참여 수</span>
              <strong className="text-indigo-400 font-bold">12,480 건</strong>
            </div>

            <div className="space-y-3">
              {publicShares.map(s => (
                <div key={s.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3">
                  <div className="text-3xl">{s.emoji}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-white">{s.user}</span>
                      <span className="text-[10px] text-slate-500">{s.time}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold rounded">
                      {s.archetype}
                    </span>
                    <p className="text-xs text-slate-300 mt-2">{s.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Community Comments */}
        {tab === 'comments' && (
          <div className="space-y-6">
            <form onSubmit={handleAddComment} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
              <input
                type="text"
                placeholder="닉네임 (선택사항)"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
              <textarea
                placeholder="자유롭게 진단 후기, 의견, 질문을 공유해보세요..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white h-20 resize-none"
              />
              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> 라이브 댓글 작성하기
              </button>
            </form>

            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-white block mb-1">{c.user}</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{c.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-500">{c.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-4 text-center text-[10px] text-slate-500">
        © 2026 caffeine-half-life-clock. Live Online Community Connected. Powered by Pomyjo.
      </footer>
    </div>
  );
}
