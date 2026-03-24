import React from 'react';
import logo_invert from '../assets/logo_invert.svg';
import { motion } from 'framer-motion';

export const Orb: React.FC = () => {
  return (
    <motion.div 
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20 
      }}
      className="w-[24px] h-[24px] cursor-pointer transition-transform aspect-square"
      title="Ozen is listening..."
    >
      <img src={logo_invert} alt="Ozen" className="w-full h-full object-contain pointer-events-none drop-shadow-md" />
    </motion.div>
  );
};
