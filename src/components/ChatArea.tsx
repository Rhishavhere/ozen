import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Info, Bot } from 'lucide-react';
import { Message } from './Message';
import { useOllama } from '../hooks/useOllama';
import { useGroq } from '../hooks/useGroq';
import { Message as MessageType } from '../types/chat';
import { saveConversation, generateTitle, getConversationById, getSettings } from '../lib/store';

interface ChatAreaProps {
  loadConversationId?: string | null;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ loadConversationId }) => {
  const settings = getSettings();
  const isGroq = settings.provider === 'groq';

  const ollama = useOllama();
  const groq = useGroq();

  const models = isGroq ? groq.models : ollama.models;
  const isGenerating = isGroq ? groq.isGenerating : ollama.isGenerating;
  const error = isGroq ? groq.error : ollama.error;
  const sendMessageStream = isGroq ? groq.sendMessageStream : ollama.sendMessageStream;

  const [selectedModel, setSelectedModel] = useState<string>('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationId] = useState(() => loadConversationId || `desk-${Date.now()}`);

  // Load existing conversation if opening from history
  useEffect(() => {
    if (loadConversationId) {
      const conv = getConversationById(loadConversationId);
      if (conv) {
        setMessages(conv.messages);
        setSelectedModel(conv.model);
      }
    }
  }, [loadConversationId]);


  useEffect(() => {
    if (models.length > 0 && !models.find(m => m.name === selectedModel)) {
      setSelectedModel(isGroq ? settings.groqModel : models[0].name);
    }
  }, [models, isGroq, settings.groqModel, selectedModel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedModel || isGenerating) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

    let fullResponse = '';
    await sendMessageStream(
      selectedModel,
      [...messages, userMessage],
      (chunk) => {
        fullResponse += chunk;
        setMessages(prev => prev.map(msg => {
          if (msg.id === assistantMessageId) {
            return { ...msg, content: msg.content + chunk };
          }
          return msg;
        }));
      }
    );

    // Save conversation after AI response completes
    const allMessages = [...messages, userMessage, { id: assistantMessageId, role: 'assistant' as const, content: fullResponse }];
    const firstUserMsg = allMessages.find(m => m.role === 'user');
    saveConversation({
      id: conversationId,
      title: firstUserMsg ? generateTitle(firstUserMsg.content) : 'Untitled Chat',
      model: selectedModel,
      messages: allMessages,
      source: 'desk',
      createdAt: parseInt(conversationId.replace('desk-', '')),
      updatedAt: Date.now(),
    });
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 font-sans">
      {/* Header */}
      <div className="h-[60px] flex items-center px-4 shrink-0 relative bg-white border-b border-gray-100">
        <div className="absolute left-4 top-4">
           {models.length > 0 ? (
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent hover:bg-gray-100 transition-colors border border-gray-200 text-gray-800 text-lg font-semibold rounded-lg focus:ring-0 block px-3 py-1 cursor-pointer outline-none appearance-none pr-8"
              style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, gray 50%), linear-gradient(135deg, gray 50%, transparent 50%)', backgroundPosition: 'calc(100% - 15px) calc(1em + 2px), calc(100% - 10px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat'}}
            >
              {models.map(m => (
                <option key={m.name} value={m.name} className="bg-white text-base font-normal">{m.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-sm font-semibold text-gray-500 flex items-center gap-2 pl-3 py-1">
              <Loader2 className="w-5 h-5 animate-spin" /> Fetching models...
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 scroll-smooth">
        <div className="flex flex-col items-center min-h-full pb-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mt-4 w-full max-w-3xl flex items-start gap-3">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="h-full mt-32 flex flex-col items-center justify-center text-gray-500">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-200">
                <Bot className="w-10 h-10 text-gray-800" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">How can I help you today?</h2>
              <p className="text-sm text-gray-500">Pick a model from the top to begin</p>
            </div>
          ) : (
            <div className="w-full max-w-3xl pt-8">
              {messages.map(msg => (
                <Message key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="w-full pt-2 pb-6 px-4 shrink-0 bg-white">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-gray-300 transition-colors shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating || models.length === 0}
            placeholder={models.length === 0 ? "Connecting..." : `Message ${isGroq ? 'Groq' : 'Ollama'}...`}
            className="w-full bg-transparent resize-none max-h-[200px] min-h-[56px] pl-4 pr-12 py-4 outline-none text-gray-900 placeholder-gray-400 disabled:opacity-50"
            rows={1}
            style={{ overflowY: 'hidden' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = '56px';
              target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating || models.length === 0}
            className="absolute right-3 bottom-3 p-[6px] rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:bg-transparent disabled:text-gray-400 text-white bg-black hover:bg-gray-800"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <div className="text-center mt-3 text-xs text-gray-400">
          {isGroq ? 'Powered by Groq LPU™ Inference Engine.' : 'Ollama runs completely locally on your machine.'}
        </div>
      </div>
    </div>
  );
};
