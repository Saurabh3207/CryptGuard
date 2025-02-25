import React from "react";
import { motion } from "framer-motion";

const Button = ({ children, className, ...props }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 text-white py-3 px-8 rounded-full text-xl shadow-lg transition-transform ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export { Button };
