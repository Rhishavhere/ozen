import { useState } from 'react';
import { Save, Cpu, User, ChevronDown } from 'lucide-react';
import { OzenSettings } from '../../../types/chat';
import { getSettings, saveSettings } from '../../../lib/store';
import { useOllama } from '../../../hooks/useOllama';

export const SettingsView: React.FC = () => {
  const { models } = useOllama();
  const [settings, setSettings] = useState<OzenSettings>(getSettings());
  const [saved, setSaved] = useState(false);

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
        <p className="text-[14px] text-gray-400 font-medium mb-8">Manage your Ozen configuration.</p>

        <div className="space-y-6">
          {/* Panel Model */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                <Cpu size={17} className="text-purple-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Panel Model</h2>
                <p className="text-[12px] text-gray-400 font-medium">The model used by the floating Panel when you type 'ozen'.</p>
              </div>
            </div>
            
            <div className="relative">
              <select
                value={settings.panelModel}
                onChange={e => handleChange('panelModel', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] text-gray-800 font-medium outline-none focus:border-purple-300 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                {models.length > 0 ? (
                  models.map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))
                ) : (
                  <option value={settings.panelModel}>{settings.panelModel} (loading models...)</option>
                )}
                {/* Future cloud providers */}
                <option disabled>── Cloud (Coming Soon) ──</option>
                <option value="gpt-4o" disabled>OpenAI: GPT-4o</option>
                <option value="gemini-pro" disabled>Google: Gemini Pro</option>
                <option value="claude-3" disabled>Anthropic: Claude 3</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* User Profile */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <User size={17} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Profile</h2>
                <p className="text-[12px] text-gray-400 font-medium">Your display name in the Dashboard.</p>
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
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Cpu size={17} className="text-emerald-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Ollama Server</h2>
                <p className="text-[12px] text-gray-400 font-medium">The URL for your local Ollama instance.</p>
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

          {/* Save */}
          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold transition-all cursor-pointer ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            <Save size={16} />
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
