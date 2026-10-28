import React from 'react';
import { Card } from './Card.jsx';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'up',
  className = ''
}) => {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          {title}
        </span>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trendDirection === 'up' ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 font-normal">{subtitle}</p>
      )}
    </Card>
  );
};
