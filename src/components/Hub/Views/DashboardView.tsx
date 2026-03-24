import { MessageSquare, Users, Cpu, Zap, ArrowUpRight, Clock, Globe } from 'lucide-react';

export const DashboardView = () => {
  const recentChats = [
    { id: 1, title: 'React component architecture', time: '2 min ago', model: 'gemma3:1b', messages: 8 },
    { id: 2, title: 'CSS grid layout debugging', time: '1 hr ago', model: 'gemma3:1b', messages: 14 },
    { id: 3, title: 'Electron IPC best practices', time: '3 hrs ago', model: 'gemma3:1b', messages: 6 },
  ];

  const agents = [
    { id: 1, name: 'Code Architect', status: 'Active', color: 'bg-purple-500', messages: 124 },
    { id: 2, name: 'UX Reviewer', status: 'Standby', color: 'bg-blue-500', messages: 45 },
    { id: 3, name: 'Writer', status: 'Standby', color: 'bg-amber-500', messages: 31 },
  ];

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#FCFCFD]">
      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-1">Good Evening, Rhishav</h1>
          <p className="text-[15px] text-gray-400 font-medium">Here's what's happening with your AI workspace.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Chats', value: '28', icon: MessageSquare, color: 'text-purple-600 bg-purple-50', trend: '+3 today' },
            { label: 'Active Agents', value: '1', icon: Users, color: 'text-blue-600 bg-blue-50', trend: '2 standby' },
            { label: 'Model', value: 'gemma3:1b', icon: Cpu, color: 'text-emerald-600 bg-emerald-50', trend: 'Ollama · Local' },
            { label: 'Tokens Used', value: '12.4k', icon: Zap, color: 'text-amber-600 bg-amber-50', trend: 'This session' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200/80 transition-all duration-200 group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={18} />
                </div>
                <ArrowUpRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <p className="text-[22px] font-bold text-gray-900 leading-none mb-1">{stat.value}</p>
              <p className="text-[12px] text-gray-400 font-medium">{stat.label}</p>
              <p className="text-[11px] text-gray-400 mt-2 font-medium">{stat.trend}</p>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-5 gap-6">
          {/* Recent Chats — 3 cols */}
          <div className="col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-gray-900">Recent Conversations</h2>
              <button className="text-[12px] font-semibold text-purple-600 hover:text-purple-700 transition-colors">View All →</button>
            </div>
            <div className="space-y-2.5">
              {recentChats.map(chat => (
                <div key={chat.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200/80 transition-all duration-200 cursor-pointer group flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                    <MessageSquare size={17} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-gray-800 truncate leading-tight">{chat.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                        <Clock size={11} /> {chat.time}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {chat.messages} msgs
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 shrink-0">
                    {chat.model}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Agents — 2 cols */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-gray-900">Your Agents</h2>
              <button className="text-[12px] font-semibold text-purple-600 hover:text-purple-700 transition-colors">Manage →</button>
            </div>
            <div className="space-y-2.5">
              {agents.map(agent => (
                <div key={agent.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200/80 transition-all duration-200 cursor-pointer group flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${agent.color} flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0`}>
                    {agent.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-semibold text-gray-800 truncate leading-tight">{agent.name}</h3>
                    <span className="text-[11px] text-gray-400 font-medium">{agent.messages} messages</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    agent.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {agent.status}
                  </span>
                </div>
              ))}
              
              {/* Quick Add */}
              <button className="w-full bg-transparent border border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer group">
                <span className="text-[13px] font-semibold text-gray-400 group-hover:text-purple-600">+ Create Agent</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-[16px] font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: MessageSquare, label: 'New Chat', desc: 'Start a conversation', color: 'text-purple-600 bg-purple-50 border-purple-100' },
              { icon: Globe, label: 'Open Browser', desc: 'Research side-by-side', color: 'text-blue-600 bg-blue-50 border-blue-100' },
              { icon: Users, label: 'Invoke Agent', desc: 'Run a custom workflow', color: 'text-amber-600 bg-amber-50 border-amber-100' },
            ].map((action, i) => (
              <button key={i} className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-md hover:border-gray-200/80 transition-all duration-200 group cursor-pointer">
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
