import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClock, FaSignOutAlt, FaCheckCircle } from 'react-icons/fa';

/**
 * Session Expiry Warning Modal
 * Shows warning 1 minute before session expires
 */
const SessionExpiryWarning = ({ isOpen, onExtend, onLogout, timeRemaining }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onLogout}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-orange-300 dark:border-orange-700">
              
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: Infinity, 
                    repeatDelay: 1 
                  }}
                  className="bg-orange-500 p-4 rounded-full"
                >
                  <FaClock className="text-white text-4xl" />
                </motion.div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">
                Session Expiring Soon
              </h2>

              {/* Description */}
              <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                Your session will expire in <span className="font-bold text-orange-600 dark:text-orange-400">{timeRemaining}</span>.
                Would you like to stay logged in?
              </p>

              {/* Warning Message */}
              <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-orange-800 dark:text-orange-200 text-center">
                  For your security, inactive sessions are automatically logged out after 15 minutes.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {/* Stay Logged In */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onExtend}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
                >
                  <FaCheckCircle className="text-lg" />
                  Stay Logged In
                </motion.button>

                {/* Logout */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onLogout}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
                >
                  <FaSignOutAlt className="text-lg" />
                  Logout
                </motion.button>
              </div>

              {/* Countdown Progress Bar */}
              <div className="mt-6">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 60, ease: 'linear' }}
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SessionExpiryWarning;
