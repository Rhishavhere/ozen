// ─── AI Profiles & System Prompts ─────────────────────────────
export interface AIProfile {
  id: string;
  name: string;
  emoji: string;
  systemPrompt: string;
  isDefault?: boolean;
}

export interface AIConfig {
  panelSystemPrompt: string;
  deskSystemPrompt: string;
  activeProfileId: string | null;  // null = use default prompts
  profiles: AIProfile[];
  temperature: number;
  maxTokens: number;
  streamResponses: boolean;
}

const AI_CONFIG_KEY = 'ozen-ai-config';

const DEFAULT_PANEL_PROMPT = 'You are Ozen, a fast and helpful AI assistant embedded in a floating panel. Keep responses concise and to-the-point. Use markdown formatting when helpful.';
const DEFAULT_DESK_PROMPT = 'You are Ozen, a knowledgeable AI assistant in a full desktop environment. Provide thorough, well-structured responses. Use markdown formatting, code blocks, and lists when appropriate.';

const DEFAULT_PROFILES: AIProfile[] = [
  {
    id: 'coder',
    name: 'Code Expert',
    emoji: '💻',
    systemPrompt: 'You are a senior software engineer. Write clean, efficient, well-documented code. Explain your reasoning. Always use proper code blocks with language tags.',
    isDefault: true,
  },
  {
    id: 'writer',
    name: 'Creative Writer',
    emoji: '✍️',
    systemPrompt: 'You are a creative writing assistant. Help with storytelling, copywriting, and content creation. Be expressive and imaginative while maintaining clarity.',
    isDefault: true,
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    emoji: '📊',
    systemPrompt: 'You are a data analysis expert. Help interpret data, suggest visualizations, write SQL queries, and explain statistical concepts clearly.',
    isDefault: true,
  },
];

const DEFAULT_CONFIG: AIConfig = {
  panelSystemPrompt: DEFAULT_PANEL_PROMPT,
  deskSystemPrompt: DEFAULT_DESK_PROMPT,
  activeProfileId: null,
  profiles: DEFAULT_PROFILES,
  temperature: 0.7,
  maxTokens: 2048,
  streamResponses: true,
};

export function getAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG, profiles: [...DEFAULT_PROFILES] };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG, profiles: [...DEFAULT_PROFILES] };
  }
}

export function saveAIConfig(partial: Partial<AIConfig>): void {
  const current = getAIConfig();
  const updated = { ...current, ...partial };
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(updated));
}

export function addProfile(profile: Omit<AIProfile, 'id'>): AIProfile {
  const config = getAIConfig();
  const newProfile: AIProfile = { ...profile, id: `profile-${Date.now()}` };
  config.profiles.push(newProfile);
  saveAIConfig({ profiles: config.profiles });
  return newProfile;
}

export function updateProfile(id: string, updates: Partial<AIProfile>): void {
  const config = getAIConfig();
  config.profiles = config.profiles.map(p => p.id === id ? { ...p, ...updates } : p);
  saveAIConfig({ profiles: config.profiles });
}

export function deleteProfile(id: string): void {
  const config = getAIConfig();
  config.profiles = config.profiles.filter(p => p.id !== id);
  if (config.activeProfileId === id) config.activeProfileId = null;
  saveAIConfig({ profiles: config.profiles, activeProfileId: config.activeProfileId });
}

/** Returns the effective system prompt for Panel or Desk, respecting active profile override */
export function getEffectivePrompt(source: 'panel' | 'desk'): string {
  const config = getAIConfig();
  if (config.activeProfileId) {
    const profile = config.profiles.find(p => p.id === config.activeProfileId);
    if (profile) return profile.systemPrompt;
  }
  return source === 'panel' ? config.panelSystemPrompt : config.deskSystemPrompt;
}
