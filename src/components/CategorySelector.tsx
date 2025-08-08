import React, { useState, useEffect } from 'react';
import { DataCategoryGroup, DataCategory, ArticleTypeMapping } from '../types';
import { getCategoryPicklist } from '../api/categoryAPI';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Tag, 
  AlertTriangle, 
  CheckCircle, 
  Folder,
  FolderOpen,
  X
} from 'lucide-react';

interface CategorySelectorProps {
  articleType?: string;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  className?: string;
}

interface CategoryTreeProps {
  categories: DataCategory[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  searchTerm: string;
  level?: number;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({ 
  categories, 
  selectedCategories, 
  onToggleCategory, 
  searchTerm,
  level = 0 
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const filterCategories = (cats: DataCategory[]): DataCategory[] => {
    if (!searchTerm) return cats;
    
    return cats.filter(cat => {
      const matchesSearch = cat.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const hasMatchingChildren = cat.children && filterCategories(cat.children).length > 0;
      return matchesSearch || hasMatchingChildren;
    });
  };

  const filteredCategories = filterCategories(categories);

  return (
    <div className="space-y-1">
      {filteredCategories.map((category) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);
        const isSelected = selectedCategories.includes(category.id);
        const paddingLeft = level * 20;

        return (
          <div key={category.id}>
            <div 
              className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/60 ${
                isSelected ? 'bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200' : ''
              }`}
              style={{ paddingLeft: `${paddingLeft + 8}px` }}
            >
              {hasChildren && (
                <button
                  onClick={() => toggleExpanded(category.id)}
                  className="p-1 hover:bg-white/60 rounded transition-colors duration-200"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  )}
                </button>
              )}
              
              {!hasChildren && <div className="w-5" />}
              
              <div className="flex items-center space-x-2 flex-1">
                {hasChildren ? (
                  isExpanded ? (
                    <FolderOpen className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Folder className="w-4 h-4 text-gray-500" />
                  )
                ) : (
                  <Tag className="w-4 h-4 text-gray-400" />
                )}
                
                <label className="flex items-center space-x-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleCategory(category.id)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className={`text-sm ${isSelected ? 'font-medium text-purple-700' : 'text-gray-700'}`}>
                    {category.label}
                  </span>
                </label>
              </div>
            </div>

            {hasChildren && isExpanded && (
              <CategoryTree
                categories={category.children!}
                selectedCategories={selectedCategories}
                onToggleCategory={onToggleCategory}
                searchTerm={searchTerm}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const CategorySelector: React.FC<CategorySelectorProps> = ({
  articleType,
  selectedCategories,
  onCategoryChange,
  className = ''
}) => {
  const [categoryGroups, setCategoryGroups] = useState<DataCategoryGroup[]>([]);
  const [articleTypeMappings, setArticleTypeMappings] = useState<ArticleTypeMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    loadCategoryData();
  }, [articleType]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getCategoryPicklist(articleType);
      setCategoryGroups(data.categoryGroups);
      setArticleTypeMappings(data.articleTypeMappings);
      setLastSyncedAt(data.lastSyncedAt || null);
      
      // Auto-expand first group
      if (data.categoryGroups.length > 0) {
        setExpandedGroups(new Set([data.categoryGroups[0].id]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    onCategoryChange(newSelected);
  };

  const clearSelection = () => {
    onCategoryChange([]);
  };

  const getSelectedCategoryLabels = (): string[] => {
    const labels: string[] = [];
    
    const findCategoryLabel = (categories: DataCategory[], targetId: string): string | null => {
      for (const cat of categories) {
        if (cat.id === targetId) {
          return cat.label;
        }
        if (cat.children) {
          const childLabel = findCategoryLabel(cat.children, targetId);
          if (childLabel) return childLabel;
        }
      }
      return null;
    };

    selectedCategories.forEach(categoryId => {
      for (const group of categoryGroups) {
        const label = findCategoryLabel(group.categories, categoryId);
        if (label) {
          labels.push(label);
          break;
        }
      }
    });

    return labels;
  };

  // Check for schema warnings
  const hasSchemaWarnings = () => {
    if (!articleType) return false;
    
    const mapping = articleTypeMappings.find(m => m.articleType === articleType);
    return !mapping || !mapping.isActive;
  };

  if (loading) {
    return (
      <div className={`bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <span className="text-sm font-medium text-gray-700">Loading categories...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-red-700">Failed to load categories</span>
        </div>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={loadCategoryData}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Data Categories</h3>
            <p className="text-sm text-gray-600">Select categories for this article</p>
          </div>
          {lastSyncedAt && (
            <div className="text-xs text-gray-500">
              Last synced: {new Date(lastSyncedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Schema Warning */}
        {hasSchemaWarnings() && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Schema Warning</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Category structure missing or doesn't match expected article schema for "{articleType}".
              Contact your administrator to sync categories.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm"
          />
        </div>

        {/* Selected Categories */}
        {selectedCategories.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Selected ({selectedCategories.length})
              </span>
              <button
                onClick={clearSelection}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {getSelectedCategoryLabels().map((label, index) => (
                <span
                  key={index}
                  className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200"
                >
                  <Tag className="w-3 h-3" />
                  <span>{label}</span>
                  <button
                    onClick={() => handleCategoryToggle(selectedCategories[index])}
                    className="ml-1 text-purple-500 hover:text-purple-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Groups */}
      <div className="max-h-96 overflow-y-auto">
        {categoryGroups.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Folder className="w-6 h-6 text-gray-400" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">No categories available</h4>
            <p className="text-xs text-gray-500">
              Categories need to be synced from Salesforce first.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {categoryGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.id);
              const hasCategories = group.categories.length > 0;

              return (
                <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroupExpanded(group.id)}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <FolderOpen className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Folder className="w-4 h-4 text-gray-500" />
                      )}
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">{group.label}</div>
                        {group.description && (
                          <div className="text-xs text-gray-500">{group.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {group.categories.length} categories
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Group Categories */}
                  {isExpanded && hasCategories && (
                    <div className="p-3 bg-white/40">
                      <CategoryTree
                        categories={group.categories}
                        selectedCategories={selectedCategories}
                        onToggleCategory={handleCategoryToggle}
                        searchTerm={searchTerm}
                        level={0}
                      />
                    </div>
                  )}

                  {isExpanded && !hasCategories && (
                    <div className="p-3 text-center text-sm text-gray-500">
                      No categories in this group
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span>{categoryGroups.length} groups loaded</span>
          </div>
          {articleType && (
            <div className="flex items-center space-x-1">
              <span>Article type:</span>
              <span className="font-medium text-gray-700">{articleType}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategorySelector;