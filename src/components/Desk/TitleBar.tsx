import { Minus, Square, X } from 'lucide-react';
import logo from '../../assets/logo.svg';

export const TitleBar: React.FC = () => {
  // @ts-ignore
  const ipc = window.ipcRenderer;

  return (
    <div className="h-[38px] w-full flex items-center justify-between shrink-0 select-none bg-[#F8F9FA] border-b border-gray-200 z-50 text-gray-700"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Logo & Title */}
      <div className="flex items-center pl-4 h-full w-[240px] shrink-0">
        <img src={logo} alt="Ozen" className="w-[18px] h-[18px] mr-2.5 opacity-80" />
        <span className="text-[13px] font-bold tracking-wide text-gray-800">Ozen</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Window Controls */}
      <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => ipc?.send('win-minimize')}
          className="h-full w-[46px] flex items-center justify-center text-gray-500 hover:bg-gray-200/80 transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => ipc?.send('win-maximize')}
          className="h-full w-[46px] flex items-center justify-center text-gray-500 hover:bg-gray-200/80 transition-colors"
        >
          <Square size={11} />
        </button>
        <button
          onClick={() => ipc?.send('win-close')}
          className="h-full w-[46px] flex items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
