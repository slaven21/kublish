import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, ArrowRight, CheckCircle } from 'lucide-react';

interface TooltipProps {
  id: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaAction?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  showOnHover?: boolean;
  autoShow?: boolean;
  delay?: number;
}

interface TooltipState {
  [key: string]: boolean;
}

// Global state for dismissed tooltips
const dismissedTooltips: TooltipState = JSON.parse(
  localStorage.getItem('kublish_dismissed_tooltips') || '{}'
);

const saveDismissedState = () => {
  localStorage.setItem('kublish_dismissed_tooltips', JSON.stringify(dismissedTooltips));
};

const OnboardingTooltip: React.FC<TooltipProps> = ({
  id,
  title,
  message,
  ctaText,
  ctaAction,
  position = 'top',
  children,
  showOnHover = false,
  autoShow = false,
  delay = 1000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoShow && !dismissedTooltips[id]) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [id, autoShow, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    dismissedTooltips[id] = true;
    saveDismissedState();
  };

  const handleCTA = () => {
    if (ctaAction) {
      ctaAction();
    }
    handleDismiss();
  };

  const handleMouseEnter = () => {
    if (showOnHover && !dismissedTooltips[id]) {
      setIsHovered(true);
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (showOnHover) {
      setIsHovered(false);
      setTimeout(() => {
        if (!isHovered) {
          setIsVisible(false);
        }
      }, 200);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-purple-600 border-l-transparent border-r-transparent border-b-transparent';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-purple-600 border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-l-purple-600 border-t-transparent border-b-transparent border-r-transparent';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-r-purple-600 border-t-transparent border-b-transparent border-l-transparent';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-purple-600 border-l-transparent border-r-transparent border-b-transparent';
    }
  };

  if (dismissedTooltips[id] && !showOnHover) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            className={`absolute z-50 ${getPositionClasses()}`}
          >
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-xl max-w-sm border border-purple-500">
              {/* Arrow */}
              <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`} />
              
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-sm">{title}</h4>
                {!showOnHover && (
                  <button
                    onClick={handleDismiss}
                    className="text-white/80 hover:text-white ml-2 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <p className="text-sm text-white/90 mb-3 leading-relaxed">
                {message}
              </p>
              
              {ctaText && ctaAction && (
                <button
                  onClick={handleCTA}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1"
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingTooltip;