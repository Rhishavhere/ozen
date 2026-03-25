import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Clipboard } from 'lucide-react';
import { Message as MessageType } from '../types/chat';

interface MessageProps {
  message: MessageType;
  variant?: 'default' | 'minimal';
}

export const Message: React.FC<MessageProps> = ({ message, variant = 'default' }) => {
  const isUser = message.role === 'user';
  const isMinimal = variant === 'minimal';

  if (isMinimal) {
    return (
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[85%] ${isUser ? 'text-right mr-2' : 'text-left ml-4'}`}>
          <div className={`markdown-body ${isUser ? 'text-[13px] text-gray-400 font-medium' : 'text-base text-gray-800'}`}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeContent = String(children).replace(/\n$/, '');
                  return !inline && match ? (
                    <div className="relative group/code my-4">
                      <SyntaxHighlighter
                        {...props}
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg m-0!"
                      >
                        {codeContent}
                      </SyntaxHighlighter>
                      {!isUser && (
                        <button
                          onClick={() => {
                            // @ts-ignore
                            window.ipcRenderer?.send('clip-text', codeContent);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-gray-800/50 hover:bg-purple-600/80 text-white rounded-md opacity-0 group-hover/code:opacity-100 transition-all duration-200 backdrop-blur-sm border border-white/10"
                          title="Clip code to previous application"
                        >
                          <Clipboard size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          
          {message.searchData && message.searchData.imageUrls && message.searchData.imageUrls.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto custom-scrollbar pb-1">
              {message.searchData.imageUrls.map((url) => (
                <img 
                  key={url} 
                  src={url} 
                  alt="search result" 
                  className="w-24 h-24 object-cover rounded-lg border border-gray-100 shadow-xs shrink-0  transition-transform"
                />
              ))}
            </div>
          )}

          {!isUser && message.content && (
            <div className="mt-2 flex justify-start">
              <button
                onClick={() => {
                  // @ts-ignore
                  window.ipcRenderer?.send('clip-text', message.content);
                }}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-purple-600 bg-gray-50/50 hover:bg-purple-50 border border-gray-100 rounded-lg px-2 py-1 transition-all cursor-pointer group"
                title="Clip to previous application"
              >
                <Clipboard size={12} className="group-hover:scale-110 transition-transform" />
                Clip
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex w-full max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-gray-400' : 'bg-gray-600'}`}>
          {isUser ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
        </div>
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[calc(100%-3rem)]`}>
          <div className="text-sm font-semibold text-gray-700 mb-1">{isUser ? 'You' : 'Ozen'}</div>
          <div className={`pr-4 py-3 rounded-2xl w-full ${isUser ? 'bg-gray-100 text-gray-900 rounded-tr-none' : 'bg-transparent text-gray-900'}`}>
            <div className="markdown-body text-base text-gray-800">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeContent = String(children).replace(/\n$/, '');
                    return !inline && match ? (
                      <div className="relative group/code my-4">
                        <SyntaxHighlighter
                          {...props}
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg m-0!"
                        >
                          {codeContent}
                        </SyntaxHighlighter>
                        {!isUser && (
                          <button
                            onClick={() => {
                              // @ts-ignore
                              window.ipcRenderer?.send('clip-text', codeContent);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-gray-800/50 hover:bg-purple-600/80 text-white rounded-md opacity-0 group-hover/code:opacity-100 transition-all duration-200 backdrop-blur-sm border border-white/10"
                            title="Clip code to previous application"
                          >
                            <Clipboard size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
