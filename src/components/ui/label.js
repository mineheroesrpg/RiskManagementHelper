import React from 'react';

export const Label = ({ children, className = "" }) => {
  return (
    <label className={`block text-sm font-semibold ${className}`}>
      {children}
    </label>
  );
};