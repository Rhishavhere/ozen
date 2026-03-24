import { useState, useEffect } from 'react';
import { Save, Cpu, User, ChevronDown, Zap, Activity } from 'lucide-react';
import { OzenSettings } from '../../../types/chat';
import { getSettings, saveSettings } from '../../../lib/store';
import { useOllama } from '../../../hooks/useOllama';
import { useGroq } from '../../../hooks/useGroq';
import { getUsageStats } from '../../../lib/rateLimit';

export const SettingsView: React.FC = () => {
  const { models: ollamaModels } = useOllama();
  const { models: groqModels } = useGroq();
  const [settings, setSettings] = useState<OzenSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState(getUsageStats());

  useEffect(() => {
    const updateStats = () => setStats(getUsageStats());
    const interval = setInterval(updateStats, 2000); // Poll every 2s
    window.addEventListener('ozen-usage-updated', updateStats);
    return () => {
      clearInterval(interval);
      window.removeEventListener('ozen-usage-updated', updateStats);
    };
  }, []);

  const handleChange = (key: keyof OzenSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-full h-full bg-[#FCFCFD] overflow-y-auto custom-scrollbar p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-2">Settings</h1>
        <p className="text-[14px] text-gray-400 font-medium mb-8">Manage your Ozen configuration & API usage.</p>

        <div className="space-y-6">
          
          {/* AI Provider Selection */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                <Zap size={17} className="text-orange-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">AI Engine</h2>
                <p className="text-[12px] text-gray-400 font-medium">Choose between lightning-fast Groq API or Local Ollama.</p>
              </div>
            </div>

            <div className="flex bg-gray-50 border border-gray-200 rounded-xl p-1 mb-6">
              <button
                onClick={() => handleChange('provider', 'groq')}
                className={`flex-1 py-2 text-[14px] font-bold rounded-lg transition-all ${
                  settings.provider === 'groq' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                ⚡ Groq API
              </button>
              <button
                onClick={() => handleChange('provider', 'ollama')}
                className={`flex-1 py-2 text-[14px] font-bold rounded-lg transition-all ${
                  settings.provider === 'ollama' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                🦙 Local Ollama
              </button>
            </div>

            {/* Model Selector based on Provider */}
            <div className="relative">
              <select
                value={settings.provider === 'groq' ? settings.groqModel : settings.panelModel}
                onChange={e => handleChange(settings.provider === 'groq' ? 'groqModel' : 'panelModel', e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[14px] text-gray-800 font-medium outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50 transition-all appearance-none cursor-pointer"
              >
                {settings.provider === 'groq' ? (
                  groqModels.map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))
                ) : (
                  ollamaModels.length > 0 ? (
                    ollamaModels.map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))
                  ) : (
                     <option value={settings.panelModel}>{settings.panelModel} (loading Ollama...)</option>
                  )
                )}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Usage & Token Tracking Stats */}
          {settings.provider === 'groq' && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                   <Activity size={15} className="text-blue-500" />
                 </div>
                 <h2 className="text-[14px] font-bold text-gray-900">API Rate Limits & Usage</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 bg-gray-50/50">
                <div className="p-4 text-center">
                  <div className="text-[20px] font-bold text-gray-900 mb-1">{stats.rpm}</div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Req / Min</div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-[20px] font-bold text-gray-900 mb-1">{stats.rpd}</div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Req / Day</div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-[20px] font-bold text-blue-600 mb-1">{(stats.tpm / 1000).toFixed(1)}k</div>
                  <div className="text-[11px] font-bold text-blue-400/80 uppercase tracking-widest">Tok / Min</div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-[20px] font-bold text-blue-600 mb-1">{(stats.tpd / 1000).toFixed(1)}k</div>
                  <div className="text-[11px] font-bold text-blue-400/80 uppercase tracking-widest">Tok / Day</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Profile */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                  <User size={17} className="text-purple-500" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-gray-900">Profile</h2>
                  <p className="text-[11px] text-gray-400 font-medium">Display name in Desk.</p>
                </div>
              </div>
              <input
                type="text"
                value={settings.userName}
                onChange={e => handleChange('userName', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] text-gray-800 font-medium outline-none focus:border-purple-300 focus:bg-white transition-all"
                placeholder="Your name"
              />
            </div>

            {/* Ollama URL */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Cpu size={17} className="text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-gray-900">Ollama Server</h2>
                  <p className="text-[11px] text-gray-400 font-medium">Local API bind address.</p>
                </div>
              </div>
              <input
                type="text"
                value={settings.ollamaUrl}
                onChange={e => handleChange('ollamaUrl', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] text-gray-800 font-mono outline-none focus:border-purple-300 focus:bg-white transition-all"
                placeholder="http://localhost:11434"
              />
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-[14px] font-bold transition-all cursor-pointer shadow-sm ${
              saved
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-900/20'
            }`}
          >
            <Save size={16} />
            {saved ? 'Configuration Saved' : 'Save Changes'}
          </button>
        </div>
        
        {/* Environment warning */}
        {settings.provider === 'groq' && (
           <p className="text-center text-[12px] font-medium text-gray-400 mt-6">
             <strong className="text-gray-500">Note:</strong> Groq requires <code className="bg-gray-100 px-1 rounded">VITE_GROQ_API_KEY</code> to be set in your root <code className="bg-gray-100 px-1 rounded">.env</code> file.
           </p>
        )}
      </div>
    </div>
  );
};
