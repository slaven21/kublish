import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  BookOpen, 
  Play, 
  MessageCircle, 
  ExternalLink,
  ChevronDown,
  Zap,
  RefreshCw
} from 'lucide-react';

interface HelpDropdownProps {
  onShowGuide: () => void;
  className?: string;
}

const HelpDropdown: React.FC<HelpDropdownProps> = ({ onShowGuide, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShowGuide = () => {
    setIsOpen(false);
    onShowGuide();
  };


  const helpItems = [
    {
      icon: BookOpen,
      title: 'Getting Started Guide',
      description: 'Learn how Kublish solves Salesforce Knowledge pain points',
      action: handleShowGuide
    },
    {
      icon: Play,
      title: 'Video Tutorials',
      description: 'Watch step-by-step walkthroughs',
      action: () => window.open('https://help.kublish.com/videos', '_blank')
    },
    {
      icon: MessageCircle,
      title: 'Contact Support',
      description: 'Get help from our team',
      action: () => window.open('mailto:support@kublish.com', '_blank')
    }
  ];

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-all duration-200"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Help</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden"
          >
            <div className="p-3">
              <div className="text-sm font-semibold text-gray-900 mb-3 px-2">
                Help & Resources
              </div>
              
              <div className="space-y-1">
                {helpItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className="w-full flex items-start space-x-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 text-left group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-purple-100 group-hover:to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200">
                      <item.icon className="w-4 h-4 text-gray-600 group-hover:text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 group-hover:text-purple-700">
                          {item.title}
                        </span>
                        {item.title.includes('Video') || item.title.includes('Support') ? (
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-500 group-hover:text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 p-3 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Zap className="w-3 h-3 text-purple-500" />
                <span>Need immediate help? Press F1 for quick tips</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpDropdown;