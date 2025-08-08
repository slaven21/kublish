import React, { useState, useEffect, useRef, useMemo } from 'react';
import Portal from './Portal';
import { Search, X, ChevronDown } from 'lucide-react';

interface CategoryOption {
  value: string;
  label: string;
  count?: number;
}

interface CategoryTypeaheadProps {
  value: string;
  onChange: (value: string) => void;
  options: CategoryOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CategoryTypeahead: React.FC<CategoryTypeaheadProps> = ({
  value,
  onChange,
  options,
  placeholder = "Search data categories...",
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fuzzy search implementation
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    
    const term = searchTerm.toLowerCase();
    return options
      .filter(option => {
        const label = option.label.toLowerCase();
        // Simple fuzzy matching - contains all characters in order
        let termIndex = 0;
        for (let i = 0; i < label.length && termIndex < term.length; i++) {
          if (label[i] === term[termIndex]) {
            termIndex++;
          }
        }
        return termIndex === term.length;
      })
      .sort((a, b) => {
        // Prioritize exact matches and prefix matches
        const aLabel = a.label.toLowerCase();
        const bLabel = b.label.toLowerCase();
        
        if (aLabel === term) return -1;
        if (bLabel === term) return 1;
        if (aLabel.startsWith(term)) return -1;
        if (bLabel.startsWith(term)) return 1;
        
        return a.label.localeCompare(b.label);
      });
  }, [options, searchTerm]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredOptions]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleOptionSelect = (option: CategoryOption) => {
    onChange(option.value);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = isOpen ? searchTerm : (selectedOption?.label || '');

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {value && (
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              aria-label="Clear selection"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <Portal>
          <div 
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto z-[9999]"
            style={{
              top: containerRef.current ? containerRef.current.getBoundingClientRect().bottom + window.scrollY + 4 : 0,
              left: containerRef.current ? containerRef.current.getBoundingClientRect().left + window.scrollX : 0,
              width: containerRef.current ? containerRef.current.getBoundingClientRect().width : 'auto',
              minWidth: '200px'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No data categories found
              </div>
            ) : (
              <ul ref={listRef} role="listbox" className="py-1">
                {filteredOptions.map((option, index) => (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={highlightedIndex === index}
                    className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                      highlightedIndex === index
                        ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => handleOptionSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {option.count !== undefined && (
                        <span className="text-xs text-gray-500">
                          {option.count} articles
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Portal>
      )}
    </div>
  );
};

export default CategoryTypeahead;