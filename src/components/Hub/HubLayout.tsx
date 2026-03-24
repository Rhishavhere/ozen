import { useState } from 'react';
import { Sidebar, TabId } from './Sidebar';
import { TitleBar } from './TitleBar';
import { ChatArea } from '../ChatArea';
import { AgentsView } from './Views/AgentsView';
import { DashboardView } from './Views/DashboardView';

export const HubLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'chat':
        return <ChatArea />;
      case 'agents':
        return <AgentsView />;
      case 'history':
      case 'browser':
      case 'functions':
      case 'features':
      case 'settings':
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
        return <DashboardView />;
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-white overflow-hidden font-sans">
      {/* Custom Title Bar Row */}
      <div className="flex shrink-0">
        {/* Sidebar header zone (brand name) lives inside Sidebar, synced height */}
        <div className="w-[240px] shrink-0" />
        {/* The actual draggable title bar for the content area */}
        <TitleBar />
      </div>

      {/* Main Content Row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar sits below its header zone, taking full remaining height */}
        <div className="w-[240px] shrink-0 -mt-[38px]">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <main className="flex-1 h-full overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
