import { useState, useEffect } from 'react';
import { Brain, Save, Plus, Trash2, Check, Wand2, Thermometer, Hash, Zap, User } from 'lucide-react';
import { getAIConfig, saveAIConfig, addProfile, updateProfile, deleteProfile, AIProfile, AIConfig } from '../../../lib/aiProfiles';

export const YourAIView: React.FC = () => {
  const [config, setConfig] = useState<AIConfig>(getAIConfig());
  const [saved, setSaved] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmoji, setNewProfileEmoji] = useState('🤖');
  const [newProfilePrompt, setNewProfilePrompt] = useState('');
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setConfig(getAIConfig());
  }, []);

  const handleSave = () => {
    saveAIConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleActivateProfile = (id: string | null) => {
    const updated = { ...config, activeProfileId: id };
    setConfig(updated);
    saveAIConfig({ activeProfileId: id });
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim() || !newProfilePrompt.trim()) return;
    addProfile({
      name: newProfileName.trim(),
      emoji: newProfileEmoji,
      systemPrompt: newProfilePrompt.trim(),
    });
    setConfig(getAIConfig());
    setNewProfileName('');
    setNewProfileEmoji('🤖');
    setNewProfilePrompt('');
    setShowNewProfile(false);
  };

  const handleDeleteProfile = (id: string) => {
    deleteProfile(id);
    setConfig(getAIConfig());
  };

  const handleUpdateProfile = (id: string, updates: Partial<AIProfile>) => {
    updateProfile(id, updates);
    setConfig(getAIConfig());
  };

  return (
    <div className="w-full h-full bg-[#FCFCFD] overflow-y-auto custom-scrollbar p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
            <Brain size={20} className="text-purple-500" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Your AI</h1>
            <p className="text-[14px] text-gray-400 font-medium">Configure how Ozen thinks and responds.</p>
          </div>
        </div>

        <div className="space-y-6 mt-8">

          {/* Custom User Instructions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center">
                <User size={15} className="text-pink-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">What Ozen should know about you</h2>
                <p className="text-[11px] text-gray-400 font-medium">Personalize your interactions. These instructions are injected into every chat.</p>
              </div>
            </div>

            <textarea
              value={config.userCustomInstructions || ''}
              onChange={e => setConfig(prev => ({ ...prev, userCustomInstructions: e.target.value }))}
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-800 font-medium outline-none focus:border-purple-300 focus:bg-white transition-all resize-none"
              placeholder="E.g., I'm a senior frontend developer. I prefer bullet points, terse explanations, and clean TypeScript code snippets."
            />
          </div>

          {/* Default System Prompts */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Wand2 size={15} className="text-indigo-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Default System Prompts</h2>
                <p className="text-[11px] text-gray-400 font-medium">These shape how Ozen behaves by default in each surface.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1.5 block">Floating Panel</label>
                <textarea
                  value={config.panelSystemPrompt}
                  onChange={e => setConfig(prev => ({ ...prev, panelSystemPrompt: e.target.value }))}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-800 font-medium outline-none focus:border-purple-300 focus:bg-white transition-all resize-none"
                  placeholder="System prompt for the floating panel..."
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1.5 block">Ozen Hub (Desk Chat)</label>
                <textarea
                  value={config.deskSystemPrompt}
                  onChange={e => setConfig(prev => ({ ...prev, deskSystemPrompt: e.target.value }))}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-800 font-medium outline-none focus:border-purple-300 focus:bg-white transition-all resize-none"
                  placeholder="System prompt for the Desk chat..."
                />
              </div>
            </div>
          </div>

          {/* AI Profiles */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Zap size={15} className="text-amber-500" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-gray-900">AI Profiles</h2>
                  <p className="text-[11px] text-gray-400 font-medium">Switch personalities with one click. Active profile overrides default prompts.</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewProfile(!showNewProfile)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer hover:bg-purple-100"
              >
                <Plus size={14} /> New Profile
              </button>
            </div>

            {/* Active indicator */}
            {config.activeProfileId && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl">
                <Check size={14} className="text-purple-600" />
                <span className="text-[12px] font-semibold text-purple-600">
                  Active: {config.profiles.find(p => p.id === config.activeProfileId)?.name || 'Unknown'}
                </span>
                <button
                  onClick={() => handleActivateProfile(null)}
                  className="ml-auto text-[11px] font-semibold text-purple-500 hover:text-purple-700 cursor-pointer"
                >
                  Deactivate
                </button>
              </div>
            )}

            {/* New Profile Form */}
            {showNewProfile && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newProfileEmoji}
                    onChange={e => setNewProfileEmoji(e.target.value)}
                    className="w-14 bg-white border border-gray-200 rounded-lg px-2 py-2 text-center text-[18px] outline-none focus:border-purple-300"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={e => setNewProfileName(e.target.value)}
                    placeholder="Profile name..."
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 font-medium outline-none focus:border-purple-300"
                  />
                </div>
                <textarea
                  value={newProfilePrompt}
                  onChange={e => setNewProfilePrompt(e.target.value)}
                  placeholder="System prompt for this profile..."
                  rows={3}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 font-medium outline-none focus:border-purple-300 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowNewProfile(false)}
                    className="text-[12px] font-semibold text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProfile}
                    disabled={!newProfileName.trim() || !newProfilePrompt.trim()}
                    className="text-[12px] font-semibold text-white bg-purple-600 px-4 py-1.5 rounded-lg hover:bg-purple-700 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            {/* Profile Cards */}
            <div className="space-y-2">
              {config.profiles.map(profile => (
                <div
                  key={profile.id}
                  className={`rounded-xl border p-3.5 transition-all duration-200 ${
                    config.activeProfileId === profile.id
                      ? 'border-purple-200 bg-purple-50/50 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[20px] mt-0.5">{profile.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[14px] font-bold text-gray-800">{profile.name}</h3>
                        {profile.isDefault && (
                          <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">BUILT-IN</span>
                        )}
                      </div>
                      {editingId === profile.id ? (
                        <textarea
                          value={profile.systemPrompt}
                          onChange={e => handleUpdateProfile(profile.id, { systemPrompt: e.target.value })}
                          rows={3}
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-purple-300 resize-none mt-1"
                        />
                      ) : (
                        <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2">{profile.systemPrompt}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {config.activeProfileId === profile.id ? (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-lg">ACTIVE</span>
                      ) : (
                        <button
                          onClick={() => handleActivateProfile(profile.id)}
                          className="text-[11px] font-semibold text-gray-500 hover:text-purple-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg hover:border-purple-200 hover:bg-purple-50 transition-all cursor-pointer"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => setEditingId(editingId === profile.id ? null : profile.id)}
                        className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded cursor-pointer transition-colors"
                      >
                        {editingId === profile.id ? 'Done' : 'Edit'}
                      </button>
                      {!profile.isDefault && (
                        <button
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded cursor-pointer transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generation Settings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Thermometer size={15} className="text-emerald-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Generation Settings</h2>
                <p className="text-[11px] text-gray-400 font-medium">Fine-tune how your AI generates responses.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Temperature */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">
                  Temperature
                  <span className="ml-2 text-purple-600 normal-case tracking-normal">{config.temperature.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={e => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-1 px-0.5">
                  <span>Precise</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2 flex items-center gap-1.5">
                  <Hash size={11} /> Max Tokens
                </label>
                <input
                  type="number"
                  value={config.maxTokens}
                  onChange={e => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 512 }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-800 font-medium outline-none focus:border-purple-300 focus:bg-white transition-all"
                  min={128}
                  max={32768}
                  step={256}
                />
                <p className="text-[10px] text-gray-400 font-medium mt-1.5 ml-1">Max response length (128 – 32768)</p>
              </div>
            </div>

            {/* Stream Toggle */}
            <div className="flex items-center justify-between mt-6 px-1">
              <div>
                <p className="text-[13px] font-bold text-gray-800">Stream Responses</p>
                <p className="text-[11px] text-gray-400 font-medium">Show tokens as they're generated in real-time.</p>
              </div>
              <button
                onClick={() => setConfig(prev => ({ ...prev, streamResponses: !prev.streamResponses }))}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${
                  config.streamResponses ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${
                  config.streamResponses ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
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
            {saved ? 'AI Configuration Saved' : 'Save AI Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
