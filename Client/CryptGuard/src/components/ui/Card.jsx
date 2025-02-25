import React from "react";

const Card = ({ children, className }) => {
  return (
    <div className={`bg-gray-800 text-white rounded-2xl shadow-xl border p-4 ${className}`}>
      {children}
    </div>
  );
};

const CardContent = ({ children, className }) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

export { Card, CardContent };
