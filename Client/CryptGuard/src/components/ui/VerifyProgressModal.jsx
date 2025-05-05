import React from "react";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";

const VerifyProgressModal = ({ isOpen, steps = [], status, onClose }) => {
  if (!isOpen) return null;

  const getStatusIcon = () => {
    if (status === "success") return <FaCheckCircle className="text-green-500 text-2xl" />;
    if (status === "failed") return <FaTimesCircle className="text-red-500 text-2xl" />;
    return <FaSpinner className="animate-spin text-blue-500 text-2xl" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4 relative">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          {getStatusIcon()}
          Verifying File Integrity
        </h2>

        <ul className="space-y-2 max-h-60 overflow-y-auto text-sm text-gray-700">
          {steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span>•</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>

        <div className="pt-2 text-right">
          {status && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-full bg-violet-600 hover:bg-violet-700 text-white transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyProgressModal;
