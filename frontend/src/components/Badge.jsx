import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    info: 'bg-sky-50 text-sky-700 border-sky-200/80',
    accent: 'bg-orange-50 text-orange-700 border-orange-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${variantStyles[variant] || variantStyles.neutral}
        ${sizeStyles[size] || sizeStyles.md}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export const ReliabilityBadge = ({ score, size = 'md' }) => {
  let variant = 'success';
  if (score < 75) variant = 'danger';
  else if (score < 90) variant = 'warning';

  return (
    <Badge variant={variant} size={size}>
      ★ {score}% Reliability
    </Badge>
  );
};
