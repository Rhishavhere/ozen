import React from 'react';
import logo from '../assets/logo.svg';

export const Orb: React.FC = () => {
  return (
    <div 
      className="w-full h-full rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-white border border-gray-100 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 overflow-hidden"
      title="Ozen is listening..."
    >
      <img src={logo} alt="Ozen" className="w-[85%] h-[85%] object-contain pointer-events-none" />
    </div>
  );
};
