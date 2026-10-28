import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-3',
    lg: 'w-10 h-10 border-4'
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-solid border-primary-500 border-t-transparent ${sizeMap[size] || sizeMap.md} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
