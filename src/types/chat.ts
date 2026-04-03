export interface ActiveWindowContext {
  title: string;
  owner: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  searchData?: {
    imageUrls: string[];
  };
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  messages: Message[];
  source: 'panel' | 'desk';
  createdAt: number;
  updatedAt: number;
}

export interface OzenSettings {
  provider: 'ollama' | 'groq'; // AI Provider
  panelModel: string;          // Model the floating Panel uses (for Ollama)
  groqModel: string;           // Model for Groq provider
  userName: string;
  theme: 'light' | 'dark';     // Future use
  ollamaUrl: string;
  panelSearchEngine?: 'google' | 'duckduckgo';
  deskSearchEngine?: 'google' | 'duckduckgo';
  membrainPanelFetch: boolean;
  membrainDeskFetch: boolean;
  membrainApiKey: string;
  membrainApiUrl: string;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
}

