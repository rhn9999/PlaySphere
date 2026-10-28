import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({
  rating = 0,
  max = 5,
  onChange,
  readOnly = false,
  size = 'md'
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = (hoverRating || rating) >= starValue;

        return (
          <button
            key={index}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(starValue)}
            onMouseEnter={() => !readOnly && setHoverRating(starValue)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            className={`p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 transition-transform ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
            aria-label={`${starValue} Star${starValue > 1 ? 's' : ''}`}
          >
            <Star
              className={`${sizeMap[size] || sizeMap.md} ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300 stroke-slate-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
