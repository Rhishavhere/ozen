import { Conversation, OzenSettings } from '../types/chat';

// ─── Keys ──────────────────────────────────────────
const CONVERSATIONS_KEY = 'ozen-conversations';
const SETTINGS_KEY = 'ozen-settings';

// ─── Defaults ──────────────────────────────────────
const DEFAULT_SETTINGS: OzenSettings = {
  provider: 'ollama',  // Changed from 'groq' to 'ollama' - works without API key
  panelModel: 'gemma3:1b',
  groqModel: 'llama-3.1-8b-instant',
  userName: 'Rhishav',
  theme: 'light',
  ollamaUrl: 'http://localhost:11434',
  panelSearchEngine: 'google',
  deskSearchEngine: 'google',
  membrainPanelFetch: true,
  membrainDeskFetch: true,
};

// ─── Conversations ─────────────────────────────────

export function getConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export function saveConversation(conv: Conversation): void {
  const all = getConversations();
  const idx = all.findIndex(c => c.id === conv.id);
  if (idx >= 0) {
    all[idx] = conv;
  } else {
    all.unshift(conv); // newest first
  }
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(all));
}

export function deleteConversation(id: string): void {
  const all = getConversations().filter(c => c.id !== id);
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(all));
}

export function getConversationById(id: string): Conversation | undefined {
  return getConversations().find(c => c.id === id);
}

/** Auto-generates a title from the first user message */
export function generateTitle(content: string): string {
  const cleaned = content.replace(/\n/g, ' ').trim();
  return cleaned.length > 50 ? cleaned.substring(0, 50) + '…' : cleaned;
}

// ─── Settings ──────────────────────────────────────

export function getSettings(): OzenSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(partial: Partial<OzenSettings>): void {
  const current = getSettings();
  const updated = { ...current, ...partial };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}
