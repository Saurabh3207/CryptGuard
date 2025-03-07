import React from "react";

const Button = ({ children, className, onClick, ...props }) => {
  return (
    <button
      className={`py-3 px-8 rounded-full text-xl shadow-lg transition-transform bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 text-white ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };
