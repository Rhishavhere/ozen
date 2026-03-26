import React from 'react';
import logo_invert from '../assets/logo_invert.svg';
import { motion } from 'framer-motion';

export const Orb: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-start overflow-hidden">
      <motion.div
        initial={{ x: 80, opacity: 0, scale: 0.5 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        transition={{
          duration: 1.5,
          ease: [0.22, 1, 0.36, 1],
          opacity: { duration: 0.4 },
          scale: { duration: 1.0, ease: "easeOut" },
        }}
        className="w-[32px] h-[32px] cursor-pointer drop-shadow-xl"
        title="Ozen is listening..."
      >
        <img src={logo_invert} alt="Ozen" className="w-full h-full object-contain pointer-events-none" />
      </motion.div>
    </div>
  );
};