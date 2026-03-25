import React from 'react';
import logo_invert from '../assets/logo_invert.svg';
import { motion } from 'framer-motion';

export const Orb: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <motion.div 
        initial={{ scale: 1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 20 
        }}
        className="w-[32px] h-[32px] cursor-pointer drop-shadow-xl"
        title="Ozen is listening..."
      >
        <img src={logo_invert} alt="Ozen" className="w-full h-full object-contain pointer-events-none" />
      </motion.div>
    </div>
  );
};