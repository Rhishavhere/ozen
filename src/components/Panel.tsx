import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import logo from '../assets/logo.svg';
import { useOllama } from '../hooks/useOllama';
import { useGroq } from '../hooks/useGroq';
import { Message as MessageType } from '../types/chat';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from './Message';
import { saveConversation, generateTitle, getSettings } from '../lib/store';

export const Panel: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBrowserMode, setIsBrowserMode] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');
  const [conversationId] = useState(() => Date.now().toString());

  const settings = getSettings();
  const isGroq = settings.provider === 'groq';

  const ollama = useOllama();
  const groq = useGroq();

  const isGenerating = isGroq ? groq.isGenerating : ollama.isGenerating;
  const sendMessageStream = isGroq ? groq.sendMessageStream : ollama.sendMessageStream;

  const handleExpand = () => {
    if (!isExpanded) {
      setIsExpanded(true);
       // @ts-ignore
      window.ipcRenderer?.send('resize-panel', { width: 400, height: 400 });
    }
  };

  const handleCollapse = () => {
    setIsExpanded(false);
     // @ts-ignore
    window.ipcRenderer?.send('resize-panel', { width: 400, height: 60 });
  };

  const handleClose = () => {
    // Save conversation if there are messages
    if (messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      const settings = getSettings();
      saveConversation({
        id: conversationId,
        title: firstUserMsg ? generateTitle(firstUserMsg.content) : 'Untitled Chat',
        model: settings.provider === 'groq' ? settings.groqModel : settings.panelModel,
        messages: messages,
        source: 'panel',
        createdAt: parseInt(conversationId),
        updatedAt: Date.now(),
      });
    }

    // @ts-ignore
    window.ipcRenderer?.send('hide-panel');
    setTimeout(() => {
      setMessages([]);
      handleCollapse();
      setInput('');
      setIsBrowserMode(false);
      setBrowserUrl('');
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    handleExpand();

    const settings = getSettings();
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

    await sendMessageStream(
      settings.provider === 'groq' ? settings.groqModel : settings.panelModel, // Read model from Desk settings
      [...messages, userMessage],
      (chunk) => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === assistantMessageId) {
            return { ...msg, content: msg.content + chunk };
          }
          return msg;
        }));
      }
    );
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || isGenerating) return;

      const isDuck = settings.panelSearchEngine === 'duckduckgo';
      const baseUrl = isDuck ? 'https://duckduckgo.com/?q=' : 'https://www.google.com/search?q=';
      const url = `${baseUrl}${encodeURIComponent(input.trim())}`;
      setBrowserUrl(url);
      setIsBrowserMode(true);
      setIsExpanded(true);
      
      // @ts-ignore
      window.ipcRenderer?.send('resize-panel', { width: 800, height: 600 });
    }
  };


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  useEffect(() => {
    const handleFocus = () => {
      // Small delay ensures the Electron window is fully visible and ready
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);
    
    // Initial call
    handleFocus();

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getPlaceholder = () => {
    if (isGenerating) return "Thinking..";
    if (isExpanded && !isBrowserMode) return "Ask Ozen";
    if (isBrowserMode) return settings.panelSearchEngine === 'duckduckgo' ? "Search DuckDuckGo" : "Search Google";
    return "Felt like you thought of me 🙂";
  };

  return (
    <div className="w-full h-full flex flex-col font-sans bg-transparent">
      
      {/* Expanding Chat Area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="w-full flex-1 mb-3 bg-white rounded-2xl shadow-[0_10px_10px_-10px_rgba(0,0,0,0.2)] border border-gray-200 overflow-hidden flex flex-col"
          >
            {isBrowserMode ? (
              <div className="w-full h-full bg-white flex-1 relative rounded-2xl overflow-hidden p-[2px]">
                {/* @ts-ignore */}
                <webview src={browserUrl} className="w-full h-full border-none rounded-[14px]" />
              </div>
            ) : (
              <div className="w-full h-full overflow-y-auto px-4 py-4 scroll-smooth flex-1 custom-scrollbar">
                 {messages.length === 0 ? (
                   <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">
                     Thinking...
                   </div>
                 ) : (
                   messages.map(msg => <Message key={msg.id} message={msg} />)
                 )}
                 <div ref={messagesEndRef} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="w-full h-[50px] shrink-0 bg-white rounded-2xl shadow-[0_10px_10px_-10px_rgba(0,0,0,0.2)] border border-gray-200 flex items-center px-4 mt-auto">
        <img src={logo} alt="Ozen" className="w-6 h-6 mr-3 border border-gray-100 rounded-full" />
        <form className="flex-1 flex" onSubmit={handleSubmit}>
          <input 
            ref={inputRef}
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={isGenerating}
            placeholder={getPlaceholder()}
            className="flex-1 bg-transparent border-none outline-none text-black text-[15px] placeholder-gray-400 font-medium disabled:opacity-50"
          />
        </form>
        {isGenerating ? (
          <Loader2 className="w-5 h-5 text-gray-400 ml-2 animate-spin shrink-0" />
        ) : (
          <button 
            onClick={handleClose} 
            className="ml-2 text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0 bg-gray-50 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
