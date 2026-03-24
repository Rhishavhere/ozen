import { useState, useEffect } from 'react';
import { MessageSquare, Users, Cpu, Zap, Clock, Activity, BarChart2, Shield, Search } from 'lucide-react';
import { Conversation } from '../../../types/chat';
import { getConversations, getSettings, saveSettings } from '../../../lib/store';
import { getUsageStats, getTokenGraphData } from '../../../lib/rateLimit';
import wallpaper from '../../../assets/wallpaper.png';

interface DashboardViewProps {
  onNavigate?: (tab: string, state?: any) => void;
  onOpenChat?: (conversationId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [settings, setSettings] = useState(getSettings());
  const [stats, setStats] = useState(getUsageStats());
  const [tokenHistory, setTokenHistory] = useState(getTokenGraphData(10));

  useEffect(() => {
    setConversations(getConversations());
    const iv = setInterval(() => {
      setConversations(getConversations());
      setSettings(getSettings());
      setStats(getUsageStats());
      setTokenHistory(getTokenGraphData(10));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const handleProviderSwitch = (provider: 'groq' | 'ollama') => {
    saveSettings({ provider });
    setSettings({ ...settings, provider });
  };

  const isGroq = settings.provider === 'groq';
  const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`;
    onNavigate?.('browser', { url });
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

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const recentChats = conversations.slice(0, 4);

  // Exact limits provided by user
  const groqLimitsMap: Record<string, { rpm: string, rpd: string, tpm: string, tpd: string }> = {
    'llama-3.1-8b-instant': { rpm: "30", rpd: "14.4K", tpm: "6K", tpd: "500K" },
    'llama-3.3-70b-versatile': { rpm: "30", rpd: "1K", tpm: "12K", tpd: "100K" },
    'openai/gpt-oss-120b': { rpm: "30", rpd: "1K", tpm: "8K", tpd: "200K" }
  };
  
  const activeLimits = groqLimitsMap[settings.groqModel] || { rpm: "-", rpd: "-", tpm: "-", tpd: "-" };

  // Calculate live SVG graph points dynamically
  const maxTokens = Math.max(...tokenHistory, 500); // 500 ceiling minimum to keep visually pleasing
  const graphPoints = tokenHistory.map((val, i) => {
    const x = i * (100 / (tokenHistory.length - 1));
    const y = 100 - (val / maxTokens) * 100; // Invert Y (0 is top, 100 is bottom)
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#FCFCFD] font-sans pb-12">
      <div className="max-w-5xl mx-auto px-6 py-6 border-b border-transparent">
        
        {/* Search Hero Section */}
        <div className="w-full h-[200px] rounded-3xl mb-6 relative overflow-hidden flex flex-col items-center justify-center p-8 shadow-sm border border-gray-200/50">
          {/* Background Wallpaper */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${wallpaper})` }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/10 to-black/40" />

          {/* Foreground */}
          <div className="z-10 w-full max-w-2xl text-center">
            <h1 className="text-[26px] font-bold text-white tracking-tight mb-2 drop-shadow-sm">
              {getGreeting()}, {settings.userName}
            </h1>

            <form onSubmit={handleSearch} className="w-full relative shadow-lg mt-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Google..."
                className="w-full bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl pl-12 pr-4 py-3.5 text-[14px] text-gray-900 outline-none focus:ring-2 focus:ring-purple-400/50 focus:bg-white transition-all font-medium placeholder-gray-500 shadow-inner"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </form>
          </div>
        </div>

        {/* Engine Toggle & Compact Stats Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-gray-900">Workspace Overview</h2>
          <div className="flex bg-gray-50 border border-gray-200 rounded-xl p-1 shadow-sm shrink-0">
            <button
              onClick={() => handleProviderSwitch('groq')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all ${
                isGroq ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Zap size={14} className={isGroq ? "text-orange-500" : ""} /> Groq API
            </button>
            <button
              onClick={() => handleProviderSwitch('ollama')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all ${
                !isGroq ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Cpu size={14} className={!isGroq ? "text-emerald-500" : ""} /> Ollama
            </button>
          </div>
        </div>

        {/* ROW 1: LEGACY STATS (Restored per user review) */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Total Chats', value: String(conversations.length), icon: MessageSquare, color: 'text-purple-600 bg-purple-50', trend: `${totalMessages} total queries` },
            { label: 'Panel Chats', value: String(conversations.filter(c => c.source === 'panel').length), icon: Zap, color: 'text-amber-600 bg-amber-50', trend: 'Activated via @ozen' },
            { label: 'Desk Chats', value: String(conversations.filter(c => c.source === 'desk').length), icon: Users, color: 'text-blue-600 bg-blue-50', trend: 'Created from Desk UI' },
            { label: 'Platform Mode', value: isGroq ? 'Cloud' : 'Local', icon: Cpu, color: 'text-emerald-600 bg-emerald-50', trend: isGroq ? 'Powered by Groq' : 'Running on Ollama' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200/80 transition-all duration-200 group cursor-default">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={15} />
                </div>
              </div>
              <p className="text-[18px] font-bold text-gray-900 leading-none mb-1.5 truncate">{stat.value}</p>
              <p className="text-[12px] text-gray-400 font-medium">{stat.label}</p>
              <p className="text-[11px] text-gray-400 mt-2 font-medium">{stat.trend}</p>
            </div>
          ))}
        </div>

        {/* ROW 2: LIVE API TELEMETRY */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          
          {/* Card 1: Active Engine Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200/80 transition-all duration-200 relative overflow-hidden">
            {isGroq && <div className="absolute top-0 right-0 w-16 h-16 bg-linear-to-bl from-orange-100 to-transparent blur-xl opacity-60"></div>}
            <div className="flex items-start justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isGroq ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {isGroq ? <Zap size={15} /> : <Cpu size={15} />}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isGroq ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {isGroq ? 'ACTIVE' : 'ACTIVE'}
              </span>
            </div>
            <p className="text-[16px] font-bold text-gray-900 leading-tight mb-1 truncate">
              {isGroq ? settings.groqModel : settings.panelModel}
            </p>
            <p className="text-[12px] text-gray-400 font-medium">Model Engine</p>
          </div>

          {/* Card 2: Live Token Graph (Fully Dynamic spanning 2 columns) */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200/80 transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart2 size={15} className="text-blue-500" />
                <span className="text-[12px] font-bold text-gray-800">Live Token Velocity</span>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-sm">
                 <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                 LIVE
              </span>
            </div>
            <div className="w-full h-10 relative flex items-end mt-1.5">
               {/* Custom SVG line graph using realtime token points */}
               <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                 <defs>
                   <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                     <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                   </linearGradient>
                 </defs>
                 <polygon points={`0,100 ${graphPoints} 100,100`} fill="url(#blueGrad)" />
                 <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={graphPoints} />
                 
                 {/* Live dot indicator at the current minute (x=100) */}
                 <circle cx="100" cy={100 - (tokenHistory[tokenHistory.length - 1] / maxTokens) * 100} r="3.5" fill="#3b82f6" className="animate-pulse shadow-sm" />
               </svg>
            </div>
          </div>

          {/* Card 3: Hardware / Rate Limit Ceilings */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200/80 transition-all duration-200 flex flex-col justify-between">
             <div className="flex items-start justify-between mb-2">
               <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center border border-gray-100">
                 <Shield size={15} />
               </div>
               <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">LIMITS</span>
             </div>
             {isGroq ? (
               <div className="flex justify-between items-end">
                 <div>
                   <p className="text-[14px] font-bold text-gray-900 leading-none mb-1">{activeLimits.tpm} / {activeLimits.rpm}</p>
                   <p className="text-[11px] text-gray-400 font-medium">TPM / RPM Max</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[14px] font-bold text-gray-900 leading-none mb-1">{activeLimits.tpd} / {activeLimits.rpd}</p>
                   <p className="text-[11px] text-gray-400 font-medium">TPD / RPD Max</p>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col h-full justify-end pb-1">
                 <p className="text-[14px] font-bold text-gray-900 leading-none mb-1">Unlimited</p>
                 <p className="text-[11px] text-gray-400 font-medium">Running locally without caps.</p>
               </div>
             )}
          </div>

        </div>

        {/* Content Area: Recent Chats & Quick Actions */}
        <div className="grid grid-cols-3 gap-8">
          
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-gray-900">Recent Conversations</h2>
              <button
                onClick={() => onNavigate?.('history')}
                className="text-[12px] font-semibold text-purple-600 hover:text-purple-700 transition-colors cursor-pointer"
              >
                View History →
              </button>
            </div>

            {recentChats.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col items-center justify-center text-gray-400 h-40">
                <MessageSquare size={24} strokeWidth={1.5} className="mb-2 opacity-50" />
                <p className="text-[13px] font-semibold text-gray-500">No conversations yet</p>
                <p className="text-[11px] mt-1">Type '@ozen' anywhere or open Chat to start.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentChats.map(chat => (
                  <div key={chat.id} onClick={() => onOpenChat?.(chat.id)} className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-sm hover:border-gray-200 transition-all duration-200 cursor-pointer group flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      chat.source === 'panel'
                        ? 'bg-amber-50 border border-amber-100 group-hover:bg-amber-100'
                        : 'bg-purple-50 border border-purple-100 group-hover:bg-purple-100'
                    }`}>
                      <MessageSquare size={17} className={chat.source === 'panel' ? 'text-amber-500' : 'text-purple-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-semibold text-gray-800 truncate leading-tight group-hover:text-purple-600 transition-colors">{chat.title}</h3>
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
                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 shrink-0">
                      {chat.model}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-1">
            <h2 className="text-[16px] font-bold text-gray-900 mb-4">Actions & Metrics</h2>
            <div className="space-y-3">
              {[
                { icon: MessageSquare, label: 'New Session', desc: 'Start a new chat', color: 'text-purple-600 bg-purple-50 border-purple-100', tab: 'chat' },
                { icon: Clock, label: 'Search Archives', desc: 'Browse all past sessions', color: 'text-amber-600 bg-amber-50 border-amber-100', tab: 'history' },
                { icon: Cpu, label: 'Configuration', desc: 'Change models & engines', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', tab: 'settings' },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate?.(action.tab)}
                  className="w-full bg-white rounded-xl border border-gray-100 p-3 text-left hover:shadow-sm hover:border-gray-200 transition-all duration-200 group cursor-pointer flex items-center gap-3"
                >
                  <div className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center shrink-0 border`}>
                    <action.icon size={16} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-gray-800 mb-0.5 group-hover:text-purple-600 transition-colors">{action.label}</h3>
                    <p className="text-[11px] text-gray-400 font-medium">{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            
             {/* Realtime Raw Tracking Block */}
            <div className="mt-3 p-4 rounded-xl bg-gray-900 border border-gray-800 text-white flex flex-col justify-between shadow-lg relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-purple-500/20 to-transparent blur-2xl rounded-full"></div>
               <div className="flex items-center justify-between mb-2 opacity-80">
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider">LIVE TELEMETRY (1MIN)</p>
                  <Activity size={13} className="text-gray-400" />
               </div>
               <div className="flex items-end justify-between relative z-10">
                 <div>
                    <p className="text-[18px] font-bold leading-none">{stats.rpm} <span className="text-[11px] font-normal text-gray-400 -ml-1">Req</span></p>
                 </div>
                 <div className="w-px h-6 bg-gray-800"></div>
                 <div className="text-right">
                    <p className="text-[20px] font-bold leading-none">{(stats.tpm / 1000).toFixed(1)}k <span className="text-[12px] font-normal text-gray-400 -ml-1">Tok</span></p>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
