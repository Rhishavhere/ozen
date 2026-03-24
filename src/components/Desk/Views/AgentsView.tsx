import { Zap, Clock, Archive, MoreHorizontal, MessageSquare, Cpu } from 'lucide-react';

export const AgentsView = () => {
  const agents = [
    {
      id: 1,
      name: 'Code Architect',
      date: 'Active since Mar 24',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200',
      title: 'Senior TypeScript & React Developer',
      tags: ['React', 'Electron', 'Node.js'],
      provider: 'Ollama: gemma3:1b',
      cost: 'Local - $0.00',
      messages: 124,
      logoColor: 'bg-black text-white'
    },
    {
      id: 2,
      name: 'UX Reviewer',
      date: 'Last used Mar 22',
      status: 'Standby',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=400&h=200',
      title: 'Design systems and UI/UX flows',
      tags: ['UI/UX', 'Tailwind', 'Design'],
      provider: 'OpenAI: GPT-4o',
      cost: 'API - $1.20/mo',
      messages: 45,
      logoColor: 'bg-[#6938EF] text-white'
    }
  ];

  return (
    <div className="w-full h-full bg-[#FCFCFD] overflow-y-auto custom-scrollbar p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-[32px] font-bold text-gray-900 mb-8 tracking-tight">Agents</h1>
        
        {/* Tabs */}
        <div className="flex bg-gray-100/80 rounded-xl p-1 w-fit mb-8 border border-gray-200/50 shadow-sm">
          <button className="flex items-center px-5 py-2.5 bg-white rounded-lg shadow-sm text-sm font-bold text-gray-900">
            <Zap size={16} className="text-[#6938EF] mr-2" /> Active
          </button>
          <button className="flex items-center px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-black/5 rounded-lg transition-colors">
            <Clock size={16} className="mr-2 opacity-70" /> Standby
          </button>
          <button className="flex items-center px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-black/5 rounded-lg transition-colors">
            <Archive size={16} className="mr-2 opacity-70" /> Archived
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map(agent => (
            <div key={agent.id} className="bg-white rounded-3xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col group">
              
              {/* Card Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${agent.logoColor} flex items-center justify-center font-bold text-sm shadow-sm`}>
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{agent.name}</h3>
                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">{agent.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${agent.status === 'Active' ? 'bg-[#E5F7ED] text-[#1E9952]' : 'bg-gray-100 text-gray-600'}`}>
                    {agent.status}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>

              {/* Card Image */}
              <div className="w-full h-[140px] rounded-2xl bg-gray-100 mb-5 overflow-hidden relative border border-gray-100/50">
                <img src={agent.image} alt={agent.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                  <button className="bg-white text-gray-900 border-none text-[13px] font-bold px-5 py-2 rounded-xl shadow-lg hover:scale-105 transition-transform active:scale-95">
                    Invoke Agent
                  </button>
                </div>
              </div>

              {/* Title & Tags */}
              <div className="flex-1">
                <h4 className="font-bold text-[17px] text-gray-900 mb-3 leading-snug pr-4">{agent.title}</h4>
                <div className="flex flex-wrap gap-2 mb-6">
                  {agent.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white border border-gray-200 shadow-sm rounded-full text-[11px] font-semibold text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100 space-y-2.5 mt-auto">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center text-gray-700 font-semibold gap-2">
                    <Cpu size={14} className="text-blue-500" /> {agent.provider}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-gray-500 font-medium">Cost Estimate</span>
                  <span className="text-gray-900 font-bold">{agent.cost}</span>
                </div>
                <div className="flex items-center text-[12px] text-gray-500 font-medium pt-1">
                  <MessageSquare size={14} className="mr-1.5 opacity-70" /> {agent.messages} New Messages
                </div>
              </div>
            </div>
          ))}

          {/* Create New Agent Card */}
          <button className="bg-transparent border-2 border-dashed border-gray-200 rounded-3xl p-5 flex flex-col items-center justify-center text-gray-400 hover:text-[#6938EF] hover:border-[#EFE9FE] hover:bg-white transition-all min-h-[420px] group shadow-sm hover:shadow-lg">
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:shadow-md border border-gray-100">
              <span className="text-2xl font-light">+</span>
            </div>
            <span className="font-bold text-[17px] text-gray-700 group-hover:text-[#6938EF]">Create New Agent</span>
            <span className="text-[13px] font-medium mt-1.5 opacity-60 text-center px-4 leading-relaxed">Design and automate your custom workflow</span>
          </button>
        </div>
      </div>
    </div>
  );
};
