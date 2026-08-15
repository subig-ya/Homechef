import React, { useEffect, useRef, useState } from 'react';
import API from '../../api/axios';
import { Send, Loader2, MessageSquareText, X } from 'lucide-react';

const getToken = () => ({ Authorization: `Bearer ${localStorage.getItem('homechef_token')}` });

const formatTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ROLE_LABELS = { HOMECHEF: 'HomeChef', ADMIN: 'Admin', USER: 'Customer' };

// Reusable 1:1 chat. Give it a conversationId, or give it otherUser so it
// auto-creates the conversation. Works for any two registered accounts.
const ChatPanel = ({ conversationId, otherUser, onClose }) => {
  const [cid, setCid] = useState(conversationId || null);
  const [messages, setMessages] = useState([]);
  const [meId, setMeId] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let poll;

    const start = async () => {
      if (!cid) {
        if (!otherUser?.id) {
          setLoading(false);
          return;
        }
        try {
          const res = await API.post('/chat/conversations', { otherUserId: otherUser.id }, { headers: getToken() });
          if (!cancelled) setCid(res.data.data._id);
        } catch (err) {
          if (!cancelled) {
            setError(err.response?.data?.message || 'Unable to start a chat. Please log in first.');
            setLoading(false);
          }
        }
        return;
      }

      const fetchMessages = async () => {
        try {
          const res = await API.get(`/chat/conversations/${cid}/messages`, { headers: getToken() });
          setMeId(res.data.data.me);
          setMessages(res.data.data.messages || []);
        } catch {
          /* keep showing what we have while polling */
        }
      };

      try {
        await fetchMessages();
        if (cancelled) return;
        setLoading(false);
        poll = setInterval(fetchMessages, 3000);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Unable to load messages.');
          setLoading(false);
        }
      }
    };

    start();
    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
    };
  }, [cid]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !cid) return;
    setSending(true);
    setError('');
    try {
      const res = await API.post(`/chat/conversations/${cid}/messages`, { text: trimmed }, { headers: getToken() });
      setMessages((prev) => [...prev, res.data.data]);
      setText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const name = otherUser?.name || 'Chat';
  const avatar = otherUser?.profileImage;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#F3E3E8] bg-[#FFF9F5] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {avatar ? (
            <img src={avatar} alt="" className="h-9 w-9 rounded-full border border-[#F0DCE4] object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FDE7EF] text-xs font-bold text-[#C45B7C]">
              {(name || '?').charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#381E39]">{name}</p>
            {otherUser?.role && (
              <p className="text-[11px] text-[#A98990]">{ROLE_LABELS[otherUser.role] || otherUser.role}</p>
            )}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-full p-2 text-[#76534A] hover:bg-[#FCECEF]" aria-label="Close chat">
            <X size={17} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#FFFDFC] px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-[#A98990]">
            <Loader2 size={14} className="mr-2 animate-spin" /> Loading chat…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessageSquareText size={22} className="text-[#D8B5C0]" />
            <p className="text-xs text-[#A98990]">No messages yet. Say hello to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const mine = msg.senderId === meId;
            return (
              <div key={msg._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                    mine
                      ? 'rounded-br-sm bg-[#4B254B] text-white'
                      : 'rounded-bl-sm border border-[#F0DCE4] bg-white text-[#381E39]'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`mt-0.5 text-right text-[10px] ${mine ? 'text-pink-200' : 'text-[#A98990]'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-[11px] font-semibold text-red-600">{error}</p>}

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-[#F3E3E8] bg-white p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={cid ? 'Type a message…' : 'Loading chat…'}
          disabled={!cid}
          className="flex-1 rounded-full border border-[#EAD3DC] bg-[#FFF9F5] px-4 py-2.5 text-sm text-[#381E39] outline-none focus:border-[#E25C80] focus:ring-2 focus:ring-[#E25C80]/20"
        />
        <button
          type="submit"
          disabled={!cid || !text.trim() || sending}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4B254B] text-white transition-colors hover:bg-[#391B39] disabled:opacity-40"
          aria-label="Send message"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
