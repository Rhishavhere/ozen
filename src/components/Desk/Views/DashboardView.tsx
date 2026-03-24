import { useState, useEffect } from 'react';
import { MessageSquare, Users, Cpu, Zap, ArrowUpRight, Clock } from 'lucide-react';
import { Conversation } from '../../../types/chat';
import { getConversations, getSettings } from '../../../lib/store';

interface DashboardViewProps {
  onNavigate?: (tab: string) => void;
  onOpenChat?: (conversationId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenChat }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const settings = getSettings();

  useEffect(() => {
    setConversations(getConversations());
    // Refresh every 2s so Panel saves show up
    const iv = setInterval(() => setConversations(getConversations()), 2000);
    return () => clearInterval(iv);
  }, []);

  const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);

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

  // Get greeting based on time of day
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const recentChats = conversations.slice(0, 4);

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#FCFCFD]">
      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-1">
            {getGreeting()}, {settings.userName}
          </h1>
          <p className="text-[15px] text-gray-400 font-medium">Here's what's happening with your AI workspace.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Chats', value: String(conversations.length), icon: MessageSquare, color: 'text-purple-600 bg-purple-50', trend: `${totalMessages} messages` },
            { label: 'Panel Chats', value: String(conversations.filter(c => c.source === 'panel').length), icon: Zap, color: 'text-amber-600 bg-amber-50', trend: 'From @ozen' },
            { label: 'Model', value: settings.panelModel, icon: Cpu, color: 'text-emerald-600 bg-emerald-50', trend: 'Ollama · Local' },
            { label: 'Desk Chats', value: String(conversations.filter(c => c.source === 'desk').length), icon: Users, color: 'text-blue-600 bg-blue-50', trend: 'From this app' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200/80 transition-all duration-200 group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={18} />
                </div>
                <ArrowUpRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <p className="text-[22px] font-bold text-gray-900 leading-none mb-1 truncate">{stat.value}</p>
              <p className="text-[12px] text-gray-400 font-medium">{stat.label}</p>
              <p className="text-[11px] text-gray-400 mt-2 font-medium">{stat.trend}</p>
            </div>
          ))}
        </div>

        {/* Recent Conversations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-gray-900">Recent Conversations</h2>
            <button
              onClick={() => onNavigate?.('history')}
              className="text-[12px] font-semibold text-purple-600 hover:text-purple-700 transition-colors cursor-pointer"
            >
              View All →
            </button>
          </div>

          {recentChats.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare size={28} strokeWidth={1.5} className="mb-3 opacity-50" />
              <p className="text-[14px] font-semibold text-gray-500">No conversations yet</p>
              <p className="text-[12px] mt-1">Type 'ozen' anywhere or open the Chat tab to start.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentChats.map(chat => (
                <div key={chat.id} onClick={() => onOpenChat?.(chat.id)} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200/80 transition-all duration-200 cursor-pointer group flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    chat.source === 'panel'
                      ? 'bg-amber-50 border border-amber-100 group-hover:bg-amber-100'
                      : 'bg-purple-50 border border-purple-100 group-hover:bg-purple-100'
                  }`}>
                    <MessageSquare size={17} className={chat.source === 'panel' ? 'text-amber-500' : 'text-purple-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-gray-800 truncate leading-tight">{chat.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                        <Clock size={11} /> {timeAgo(chat.updatedAt)}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">{chat.messages.length} msgs</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        chat.source === 'panel' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {chat.source === 'panel' ? 'Panel' : 'Desk'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 shrink-0">
                    {chat.model}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-[16px] font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: MessageSquare, label: 'New Chat', desc: 'Start a conversation', color: 'text-purple-600 bg-purple-50 border-purple-100', tab: 'chat' },
              { icon: Clock, label: 'View History', desc: 'Browse past sessions', color: 'text-amber-600 bg-amber-50 border-amber-100', tab: 'history' },
              { icon: Cpu, label: 'Settings', desc: 'Change model & config', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', tab: 'settings' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => onNavigate?.(action.tab)}
                className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-md hover:border-gray-200/80 transition-all duration-200 group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mb-3 border`}>
                  <action.icon size={18} />
                </div>
                <h3 className="text-[14px] font-bold text-gray-800 mb-0.5">{action.label}</h3>
                <p className="text-[12px] text-gray-400 font-medium">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
