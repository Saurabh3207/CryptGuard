import React from "react";

const Card = ({ children, className }) => {
  return (
    <div className={`bg-gray-800 border shadow-xl rounded-2xl transform hover:scale-105 transition-transform ${className}`}>
      {children}
    </div>
  );
};

const CardContent = ({ children, className }) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export { Card, CardContent };
