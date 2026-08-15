import React, { useCallback, useEffect, useState } from 'react';
import API from '../../../api/axios';
import ChatPanel from '../../../components/chat/ChatPanel';
import { Loader2, MessageSquareText, ChevronLeft, Mail } from 'lucide-react';

const getToken = () => ({ Authorization: `Bearer ${localStorage.getItem('homechef_token')}` });

const ROLE_LABELS = { HOMECHEF: 'HomeChef', ADMIN: 'Admin', USER: 'Customer' };

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const ChatSection = () => {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await API.get('/chat/conversations', { headers: getToken() });
      setConversations(res.data.data || []);
    } catch {
      /* keep current list */
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
    const poll = setInterval(load, 5000);
    return () => clearInterval(poll);
  }, [load]);

  const selectedConversation = conversations.find((c) => c._id === selected) || null;

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[#F0DCE4] bg-[#FFFDFC] shadow-sm lg:h-[600px]">
      <div className="flex items-center justify-between border-b border-[#F3E3E8] bg-[#FFF9F5] px-5 py-3">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold text-[#381E39]">
          <Mail size={16} className="text-[#C45B7C]" /> Messages
        </h3>
        <span className="rounded-full bg-[#FDE7EF] px-2.5 py-1 text-[11px] font-bold text-[#C45B7C]">
          {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)} unread
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <div
          className={`min-h-0 overflow-y-auto border-[#F3E3E8] lg:border-r ${
            selectedConversation ? 'hidden lg:block' : 'block'
          }`}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center py-16 text-xs text-[#A98990]">
              <Loader2 size={14} className="mr-2 animate-spin" /> Loading conversations…
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
              <MessageSquareText size={24} className="text-[#D8B5C0]" />
              <p className="text-sm font-semibold text-[#381E39]">No conversations yet</p>
              <p className="text-xs leading-relaxed text-[#76534A]">
                When a customer messages you from your public profile, the chat appears here. You can also start chats
                from your own public profile page.
              </p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const other = conversation.otherUser || {};
              const active = selected === conversation._id;
              return (
                <button
                  key={conversation._id}
                  onClick={() => setSelected(conversation._id)}
                  className={`flex w-full items-center gap-3 border-b border-[#F7E9ED] px-4 py-3 text-left transition-colors ${
                    active ? 'bg-[#FCECEF]' : 'bg-[#FFFDFC] hover:bg-[#FFF9F5]'
                  }`}
                >
                  {other.profileImage ? (
                    <img src={other.profileImage} alt="" className="h-10 w-10 shrink-0 rounded-full border border-[#F0DCE4] object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE7EF] text-xs font-bold text-[#C45B7C]">
                      {(other.name || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[#381E39]">{other.name || 'Unknown user'}</p>
                      <span className="shrink-0 text-[10px] text-[#A98990]">{timeAgo(conversation.lastMessageAt)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-[#76534A]">
                        {conversation.lastMessage || (other.role ? `${ROLE_LABELS[other.role] || other.role} — say hello` : 'No messages yet')}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#E25C80] px-1.5 text-[10px] font-bold text-white">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Active chat */}
        <div className={`min-h-0 ${selectedConversation ? 'block' : 'hidden lg:block'}`}>
          {selectedConversation ? (
            <div className="flex h-full flex-col">
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1 border-b border-[#F3E3E8] px-4 py-2 text-xs font-semibold text-[#76534A] hover:text-[#C45B7C] lg:hidden"
              >
                <ChevronLeft size={14} /> All conversations
              </button>
              <div className="min-h-0 flex-1">
                <ChatPanel
                  conversationId={selectedConversation._id}
                  otherUser={{
                    id: selectedConversation.otherUser?._id,
                    name: selectedConversation.otherUser?.name,
                    profileImage: selectedConversation.otherUser?.profileImage,
                    role: selectedConversation.otherUser?.role
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
              <MessageSquareText size={26} className="text-[#D8B5C0]" />
              <p className="text-sm font-semibold text-[#381E39]">Select a conversation</p>
              <p className="max-w-xs text-xs leading-relaxed text-[#76534A]">
                Pick a customer on the left to read and reply to their messages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSection;
