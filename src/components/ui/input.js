import React from 'react';

export const Input = ({ value, onChange, type = "text", className = "" }) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={`border p-2 rounded-lg ${className}`}
    />
  );
};