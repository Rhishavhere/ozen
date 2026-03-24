import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';
import { Message as MessageType } from '../types/chat';

interface MessageProps {
  message: MessageType;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex w-full max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-gray-600' : 'bg-green-600'}`}>
          {isUser ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
        </div>
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[calc(100%-3rem)]`}>
          <div className="text-sm font-semibold text-gray-700 mb-1">{isUser ? 'You' : 'Ollama'}</div>
          <div className={`px-4 py-3 rounded-2xl w-full ${isUser ? 'bg-gray-100 text-gray-900 rounded-tr-none' : 'bg-transparent text-gray-900'}`}>
            <div className="markdown-body text-base text-gray-800">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
