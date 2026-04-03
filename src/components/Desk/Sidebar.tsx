import {
  LayoutDashboard,
  MessageSquare,
  History,
  Globe,
  Users,
  Wrench,
  Sparkles,
  Settings,
  Cpu,
  ChevronDown,
  Brain,
  BrainCircuit,
  User,
} from "lucide-react";
import { getSettings } from "../../lib/store";

export type TabId =
  | "dashboard"
  | "chat"
  | "history"
  | "browser"
  | "yourai"
  | "agents"
  | "functions"
  | "features"
  | "settings"
  | "memory";

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const workspaceItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "chat" as const, label: "Chat", icon: MessageSquare },
    { id: "browser" as const, label: "Browser", icon: Globe },
    { id: "yourai" as const, label: "Your AI", icon: Brain },
    { id: "history" as const, label: "History", icon: History },
  ];

  const powerTools = [
    { id: "memory" as const, label: "Memory", icon: BrainCircuit },
    { id: "agents" as const, label: "Agents", icon: Users },
    { id: "functions" as const, label: "Functions", icon: Wrench },
    { id: "features" as const, label: "Features", icon: Sparkles },
  ];

  const renderNavItem = (item: { id: TabId; label: string; icon: any }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isMemory = item.id === "memory";
    return (
      <button
        key={item.id}
        onClick={() => onTabChange(item.id)}
        className={`w-full flex items-center px-3 py-[9px] rounded-xl text-[13.5px] font-medium transition-all duration-150 group cursor-pointer
          ${
            isActive
              ? isMemory
                ? "bg-violet-100 text-violet-700 shadow-sm"
                : "bg-[#EDE9FE] text-[#6D28D9] shadow-sm"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          }`}
      >
        <Icon
          size={17}
          strokeWidth={isActive ? 2.2 : 1.8}
          className={`mr-3 transition-colors ${
            isActive
              ? isMemory
                ? "text-violet-600"
                : "text-[#7C3AED]"
              : "text-gray-400 group-hover:text-gray-600"
          }`}
        />
        {item.label}
        {isMemory && !isActive && (
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-500">
            AI
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F8F9FA] shrink-0 font-sans">
      {/* Profile Card */}
      <div className="px-4 pt-5 pb-2">
        <div
          className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200/80 transition-all cursor-pointer group"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm overflow-hidden border border-indigo-200">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 leading-tight truncate">
              Rhishav
            </p>
            <p className="text-[11px] text-gray-400 font-medium leading-tight truncate">
              Professional Account
            </p>
          </div>
          <ChevronDown
            size={13}
            className="text-gray-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>

      {/* Navigation */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-3 space-y-6"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {/* Workspace */}
        <div>
          <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-1.5 px-3">
            Workspace
          </p>
          <div className="space-y-0.5">{workspaceItems.map(renderNavItem)}</div>
        </div>

        {/* Power Tools */}
        <div>
          <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-1.5 px-3">
            Power Tools
          </p>
          <div className="space-y-0.5">{powerTools.map(renderNavItem)}</div>
        </div>
      </div>

      {/* Bottom Section */}
      <div
        className="px-3 pb-4 pt-3 border-t border-gray-200/60 space-y-1.5 mt-auto"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button className="w-full flex items-center px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200/80 transition-all cursor-pointer group">
          <Cpu size={16} className="mr-2.5 text-emerald-500 shrink-0" />
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-gray-800 leading-tight truncate">
              {getSettings().panelModel}
            </span>
            <span className="text-[10px] text-gray-400 font-medium leading-tight">
              Ollama · Local
            </span>
          </div>
          <ChevronDown
            size={12}
            className="text-gray-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </button>
        {renderNavItem({ id: "settings", label: "Settings", icon: Settings })}
      </div>
    </div>
  );
};
