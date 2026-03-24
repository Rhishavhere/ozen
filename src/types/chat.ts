export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
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
  panelModel: string;      // Model the floating Panel uses (set from Desk)
  userName: string;
  theme: 'light' | 'dark'; // Future use
  ollamaUrl: string;
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

