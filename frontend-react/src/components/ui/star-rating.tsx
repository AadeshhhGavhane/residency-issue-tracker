import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showLabel = false,
  className
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (!readonly) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const getRatingLabels = (rating: number) => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[rating as keyof typeof labels] || '';
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div 
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = (hoverRating || rating) >= star;
          return (
            <button
              key={star}
              type="button"
              className={cn(
                'transition-colors duration-200',
                sizeClasses[size],
                isFilled 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300 hover:text-yellow-200'
              )}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              disabled={readonly}
            >
              <Star className="w-full h-full" />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span className="ml-2 text-sm text-gray-600">
          {getRatingLabels(hoverRating || rating)}
        </span>
      )}
    </div>
  );
};

export default StarRating; 