import React, { useEffect, useRef } from 'react';
import { Bot, Search, X } from 'lucide-react';

export const Panel: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleFocus = () => inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // @ts-ignore
        window.ipcRenderer?.send('hide-panel');
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);
    
    // Initial focus call
    handleFocus();
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="w-full h-full bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-200 flex items-center px-4 overflow-hidden font-sans">
      <Bot className="w-6 h-6 text-black mr-3" />
      <input 
        ref={inputRef}
        type="text" 
        placeholder="Hey this is Ozen. How can I help?"
        className="flex-1 bg-transparent border-none outline-none text-black text-lg placeholder-gray-400 font-medium"
      />
      <Search className="w-5 h-5 text-gray-400 ml-2" />
      <button 
        // @ts-ignore
        onClick={() => window.ipcRenderer?.send('hide-panel')} 
        className="p-1 hover:bg-gray-100 rounded-lg ml-2 transition-colors cursor-pointer"
      >
        <X className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );
};
