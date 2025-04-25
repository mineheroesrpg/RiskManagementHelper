import React from 'react';

export const Card = ({ children }) => {
  return (
    <div className="border rounded-lg shadow-lg p-4">
      {children}
    </div>
  );
};

export const CardContent = ({ children }) => {
  return (
    <div className="p-4">
      {children}
    </div>
  );
};