import { useState, useEffect } from 'react';
import { History, Trash2, MessageSquare, Search, X } from 'lucide-react';
import { Conversation } from '../../../types/chat';
import { getConversations, deleteConversation } from '../../../lib/store';

interface HistoryViewProps {
  onOpenChat?: (conversationId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onOpenChat }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');

  const refresh = () => setConversations(getConversations());

  useEffect(() => { refresh(); }, []);

  // Re-check every 2s so Panel saves show up live
  useEffect(() => {
    const iv = setInterval(refresh, 2000);
    return () => clearInterval(iv);
  }, []);

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.model.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    deleteConversation(id);
    refresh();
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="w-full h-full bg-[#FCFCFD] overflow-y-auto custom-scrollbar p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">History</h1>
          <span className="text-[13px] text-gray-400 font-medium">{conversations.length} conversations</span>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-10 py-3 text-[14px] text-gray-800 placeholder-gray-400 outline-none focus:border-purple-300 focus:shadow-sm transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <History size={40} strokeWidth={1.5} className="mb-4 opacity-50" />
            <p className="text-[15px] font-semibold text-gray-500 mb-1">
              {search ? 'No matching conversations' : 'No conversations yet'}
            </p>
            <p className="text-[13px]">
              {search ? 'Try a different search term.' : 'Start a chat from the Panel or the Chat tab.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(conv => (
              <div
                key={conv.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200/80 transition-all duration-200 cursor-pointer group flex items-center gap-4"
                onClick={() => onOpenChat?.(conv.id)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  conv.source === 'panel'
                    ? 'bg-amber-50 border border-amber-100 group-hover:bg-amber-100'
                    : 'bg-purple-50 border border-purple-100 group-hover:bg-purple-100'
                }`}>
                  <MessageSquare size={17} className={conv.source === 'panel' ? 'text-amber-500' : 'text-purple-500'} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-gray-800 truncate leading-tight">{conv.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-gray-400 font-medium">{timeAgo(conv.updatedAt)}</span>
                    <span className="text-[11px] text-gray-400 font-medium">{conv.messages.length} msgs</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      conv.source === 'panel' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {conv.source === 'panel' ? 'Panel' : 'Desk'}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 shrink-0">
                  {conv.model}
                </span>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
