import { useState, useEffect, type FormEvent } from 'react';
import { MessageSquare, Share2, Send, Eye, Users } from 'lucide-react';

interface Comment {
  id: number;
  site: string;
  result_type: string | null;
  nickname: string;
  body: string;
  created_at: number;
}

// Vercel rewrites(/api/*)로 백엔드 프록시 — 상대경로 사용
const API = '/api';
const SITE = 'caffeine-half-life-clock';

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return '방금 전';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

interface CommunityFeedProps {
  resultType: string;
}

export function CommunityFeed({ resultType }: CommunityFeedProps) {
  const [tab, setTab] = useState<'feed' | 'comments'>('feed');
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nickname, setNickname] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch(`${API}/comments?site=${SITE}&limit=30`),
          fetch(`${API}/stats?site=${SITE}`),
        ]);
        if (!cRes.ok || !sRes.ok) throw new Error(`HTTP ${cRes.status}/${sRes.status}`);
        const c = await cRes.json();
        const s = await sRes.json();
        if (!alive) return;
        setComments(c.comments || []);
        if (s.total) setTotal(s.total);
        setError(null);
      } catch {
        if (alive) setError('커뮤니티 피드를 불러오지 못했습니다');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const refreshComments = async () => {
    const res = await fetch(`${API}/comments?site=${SITE}&limit=30`);
    if (res.ok) {
      const c = await res.json();
      setComments(c.comments || []);
    }
  };

  const addShare = async () => {
    const who = nickname.trim() || '익명 카페인러';
    const note = shareNote.trim() || '내 진단 결과를 커뮤니티에 공유합니다!';
    try {
      const res = await fetch(`${API}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: SITE, result_type: resultType, nickname: who, body: note }),
      });
      if (!res.ok) throw new Error('post failed');
      setShareNote('');
      await refreshComments();
    } catch {
      setError('공유에 실패했습니다');
    }
  };

  const addComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${API}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: SITE,
          nickname: nickname.trim() || '익명 카페인러',
          body: newComment.trim(),
        }),
      });
      if (!res.ok) throw new Error('post failed');
      setNewComment('');
      await refreshComments();
    } catch {
      setError('댓글 작성에 실패했습니다');
    }
  };

  return (
    <section className="bg-slate-900/70 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Share2 className="w-4 h-4 text-amber-400" /> 커뮤니티 & 진단 공유
        </h3>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-800/80 border border-slate-700 rounded-full px-3 py-1.5">
          <Users className="w-3.5 h-3.5 text-amber-400" />
          {total.toLocaleString()}건 참여 중
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="flex bg-slate-800/60 p-1 rounded-xl border border-slate-700 mb-5">
        <button
          onClick={() => setTab('feed')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1.5 ${tab === 'feed' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
        >
          <Eye className="w-3.5 h-3.5" /> 결과 피드 ({comments.length})
        </button>
        <button
          onClick={() => setTab('comments')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1.5 ${tab === 'comments' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
        >
          <MessageSquare className="w-3.5 h-3.5" /> 댓글 ({comments.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-xs text-slate-500">커뮤니티 피드 불러오는 중...</div>
      ) : tab === 'feed' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="닉네임 (선택사항)"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="flex-1 min-w-[120px] bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              placeholder="공유 한마디 메모..."
              value={shareNote}
              onChange={e => setShareNote(e.target.value)}
              className="flex-1 min-w-[160px] bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={addShare}
              className="px-4 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-amber-400 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> 내 결과 공유하기
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {comments.map(c => (
              <div key={c.id} className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl flex items-start gap-3">
                <div className="text-2xl">☕</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1 gap-2">
                    <span className="text-xs font-bold text-white truncate">{c.nickname}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(c.created_at)}</span>
                  </div>
                  {c.result_type && (
                    <span className="inline-block px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-full">
                      {c.result_type}
                    </span>
                  )}
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{c.body}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-slate-500 col-span-2 text-center py-6">첫 번째로 결과를 공유해보세요!</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <form onSubmit={addComment} className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl space-y-3">
            <input
              type="text"
              placeholder="닉네임 (선택사항)"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <textarea
              placeholder="자유롭게 진단 후기, 의견, 질문을 공유해보세요..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white h-20 resize-none focus:outline-none focus:border-amber-500"
            />
            <button type="submit" className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 hover:bg-amber-400 transition-colors">
              <Send className="w-3.5 h-3.5" /> 댓글 작성하기
            </button>
          </form>

          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl">
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span className="text-xs font-bold text-white">{c.nickname}</span>
                  <span className="text-[10px] text-slate-500">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{c.body}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
