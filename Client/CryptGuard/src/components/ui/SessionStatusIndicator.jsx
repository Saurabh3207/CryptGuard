import React from 'react';
import { motion } from 'framer-motion';
import { FaClock } from 'react-icons/fa';

/**
 * Session Status Indicator
 * Shows remaining session time in the UI
 */
const SessionStatusIndicator = ({ timeRemaining, statusColor, formatTime }) => {
  const getColorClasses = () => {
    switch (statusColor) {
      case 'green':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-300 dark:border-green-700',
          icon: 'text-green-600 dark:text-green-400'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-700 dark:text-yellow-300',
          border: 'border-yellow-300 dark:border-yellow-700',
          icon: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'red':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-300 dark:border-red-700',
          icon: 'text-red-600 dark:text-red-400'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-300 dark:border-gray-700',
          icon: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${colors.bg} ${colors.border} shadow-sm`}
    >
      <motion.div
        animate={statusColor === 'red' ? { 
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        } : {}}
        transition={statusColor === 'red' ? { 
          duration: 0.5, 
          repeat: Infinity, 
          repeatDelay: 1 
        } : {}}
      >
        <FaClock className={`${colors.icon}`} />
      </motion.div>
      
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${colors.text}`}>
          Session expires in
        </span>
        <span className={`text-sm font-bold ${colors.text}`}>
          {formatTime()}
        </span>
      </div>
    </motion.div>
  );
};

export default SessionStatusIndicator;
