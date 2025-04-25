import React from 'react';

export const Select = ({ children, onValueChange, value }) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="border p-2 rounded-lg"
    >
      {children}
    </select>
  );
};

export const SelectTrigger = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export const SelectContent = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export const SelectItem = ({ children, value }) => {
  return <option value={value}>{children}</option>;
};

export const SelectValue = ({ value }) => {
  return <span>{value}</span>;
};