import { useState } from 'react';
import { Sidebar, TabId } from './Sidebar';
import { TitleBar } from './TitleBar';
import { ChatArea } from '../ChatArea';
import { AgentsView } from './Views/AgentsView';
import { DashboardView } from './Views/DashboardView';
import { HistoryView } from './Views/HistoryView';
import { SettingsView } from './Views/SettingsView';

export const HubLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [viewingConversationId, setViewingConversationId] = useState<string | null>(null);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as TabId);
  };

  const handleOpenChat = (conversationId?: string) => {
    setViewingConversationId(conversationId || null);
    setActiveTab('chat');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} onOpenChat={handleOpenChat} />;
      case 'chat':
        return <ChatArea key={viewingConversationId || 'new'} loadConversationId={viewingConversationId} />;
      case 'agents':
        return <AgentsView />;
      case 'history':
        return <HistoryView onOpenChat={handleOpenChat} />;
      case 'settings':
        return <SettingsView />;
      case 'browser':
      case 'functions':
      case 'features':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-[#FCFCFD]">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3 border border-gray-200">
              <span className="text-2xl">🚧</span>
            </div>
            <h2 className="text-lg font-bold text-gray-600 mb-1 capitalize">{activeTab}</h2>
            <p className="text-[13px] text-gray-400 font-medium">Coming soon.</p>
          </div>
        );
      default:
        return <DashboardView onNavigate={handleNavigate} onOpenChat={handleOpenChat} />;
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-white overflow-hidden border border-gray-300" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Custom Title Bar Row */}
      <TitleBar />

      {/* Main Content Row */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[240px] shrink-0 border-r border-gray-200">
          <Sidebar activeTab={activeTab} onTabChange={(tab) => { setViewingConversationId(null); setActiveTab(tab); }} />
        </div>
        <main className="flex-1 h-full overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
