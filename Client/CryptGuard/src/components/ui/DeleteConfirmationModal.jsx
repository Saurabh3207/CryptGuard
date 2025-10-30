import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, fileName }) => {
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
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <FaExclamationTriangle className="text-white text-xl" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-gray-800 font-medium mb-2">
                    Are you sure you want to delete this file?
                  </p>
                  <p className="text-sm text-gray-600 font-mono bg-white px-3 py-2 rounded border break-all">
                    {fileName}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">⚠️</span>
                    <p className="text-sm text-gray-700">
                      <strong className="text-red-600">This action cannot be undone!</strong>
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-700 mb-2">What will be deleted:</p>
                    <ul className="space-y-1.5 text-xs text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        File removed from your vault
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Encrypted file unpinned from IPFS
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        Database record removed
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-yellow-500">ℹ</span>
                        <span className="text-gray-500">
                          Blockchain record is immutable (but file becomes inaccessible)
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  Delete File
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmationModal;
