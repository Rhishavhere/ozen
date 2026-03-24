import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home } from 'lucide-react';
import { getSettings } from '../../../lib/store';

interface BrowserViewProps {
  initialUrl?: string;
}

export const BrowserView: React.FC<BrowserViewProps> = ({ initialUrl }) => {
  const defaultEngineUrl = getSettings().deskSearchEngine === 'duckduckgo' ? 'https://duckduckgo.com' : 'https://www.google.com';
  const startUrl = initialUrl || defaultEngineUrl;
  
  const [urlInput, setUrlInput] = useState(startUrl);
  const [currentUrl, setCurrentUrl] = useState(startUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const webviewRef = useRef<any>(null);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleDidStartLoading = () => setIsLoading(true);
    const handleDidStopLoading = () => setIsLoading(false);
    
    // Updates the URL bar when navigation happens internally in the webview
    const handleDidNavigate = (e: any) => {
      setUrlInput(e.url);
      setCurrentUrl(e.url);
      setCanGoBack(webview.canGoBack());
      setCanGoForward(webview.canGoForward());
    };

    webview.addEventListener('did-start-loading', handleDidStartLoading);
    webview.addEventListener('did-stop-loading', handleDidStopLoading);
    webview.addEventListener('did-navigate', handleDidNavigate);
    webview.addEventListener('did-navigate-in-page', handleDidNavigate);

    return () => {
      webview.removeEventListener('did-start-loading', handleDidStartLoading);
      webview.removeEventListener('did-stop-loading', handleDidStopLoading);
      webview.removeEventListener('did-navigate', handleDidNavigate);
      webview.removeEventListener('did-navigate-in-page', handleDidNavigate);
    };
  }, []);

  useEffect(() => {
    if (initialUrl) {
      setCurrentUrl(initialUrl);
      setUrlInput(initialUrl);
    }
  }, [initialUrl]);

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = urlInput.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setCurrentUrl(finalUrl);
  };

  const handleBack = () => {
    if (webviewRef.current?.canGoBack()) {
      webviewRef.current.goBack();
    }
  };

  const handleForward = () => {
    if (webviewRef.current?.canGoForward()) {
      webviewRef.current.goForward();
    }
  };

  const handleReload = () => {
    if (webviewRef.current) {
      webviewRef.current.reload();
    }
  };

  const handleHome = () => {
    const defaultEngineUrl = getSettings().deskSearchEngine === 'duckduckgo' ? 'https://duckduckgo.com' : 'https://www.google.com';
    setCurrentUrl(defaultEngineUrl);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Browser Toolbar */}
      <div className="h-12 border-b border-gray-200 bg-gray-50 flex items-center px-4 gap-2 shrink-0">
        <button onClick={handleBack} disabled={!canGoBack} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent text-gray-700 transition-colors cursor-pointer">
          <ArrowLeft size={16} />
        </button>
        <button onClick={handleForward} disabled={!canGoForward} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent text-gray-700 transition-colors cursor-pointer">
          <ArrowRight size={16} />
        </button>
        <button onClick={handleReload} className={`p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer ${isLoading ? 'animate-spin opacity-50' : ''}`}>
          <RotateCw size={14} />
        </button>
        <button onClick={handleHome} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors ml-1 cursor-pointer">
          <Home size={16} />
        </button>

        <form onSubmit={handleGo} className="flex-1 ml-2">
          <input 
            type="text" 
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] text-gray-800 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all font-medium"
            placeholder="Search or enter web address"
          />
        </form>
      </div>

      {/* Webview Container */}
      <div className="flex-1 w-full bg-white relative">
        {/* @ts-ignore */}
        <webview 
          ref={webviewRef}
          src={currentUrl} 
          className="w-full h-full absolute inset-0 border-none bg-white" 
        />
      </div>
    </div>
  );
};
