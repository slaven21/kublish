import React, { useState, useEffect, useMemo } from 'react';
import { DataCategoryGroup, DataCategory } from '../types';
import { getCategoryPicklist } from '../api/categoryAPI';
import { 
  getArticleTypes, 
  getAllowedCategoryGroups, 
  validateCategorySelections,
  getCategoryGroupHelp,
  formatCategoryPath,
  ArticleType,
  CategoryValidation
} from '../utils/articleUtils';
import { 
  ChevronDown, 
  ChevronRight, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  Tag, 
  Folder,
  FolderOpen,
  X,
  HelpCircle
} from 'lucide-react';

interface ArticleTypeCategorySelectorProps {
  selectedArticleType: string;
  selectedCategories: string[];
  onArticleTypeChange: (articleType: string) => void;
  onCategoryChange: (categories: string[]) => void;
  className?: string;
}

interface CategoryTreeProps {
  categories: DataCategory[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  level?: number;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({ 
  categories, 
  selectedCategories, 
  onToggleCategory, 
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

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);
        const isSelected = selectedCategories.includes(category.id);
        const paddingLeft = level * 16;

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
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const ArticleTypeCategorySelector: React.FC<ArticleTypeCategorySelectorProps> = ({
  selectedArticleType,
  selectedCategories,
  onArticleTypeChange,
  onCategoryChange,
  className = ''
}) => {
  const [articleTypes, setArticleTypes] = useState<ArticleType[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<DataCategoryGroup[]>([]);
  const [allowedGroups, setAllowedGroups] = useState<DataCategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load categories when article type changes
  useEffect(() => {
    if (selectedArticleType && categoryGroups.length > 0) {
      loadCategoriesForArticleType();
    }
  }, [selectedArticleType, categoryGroups]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [typesData, categoryData] = await Promise.all([
        getArticleTypes(),
        getCategoryPicklist()
      ]);
      
      setArticleTypes(typesData);
      setCategoryGroups(categoryData.categoryGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesForArticleType = async () => {
    try {
      setLoadingCategories(true);
      const allowed = await getAllowedCategoryGroups(selectedArticleType, categoryGroups);
      setAllowedGroups(allowed);
      
      // Auto-expand first group
      if (allowed.length > 0) {
        setExpandedGroups(new Set([allowed[0].id]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const validation = useMemo(() => {
    if (!selectedArticleType) return null;
    return validateCategorySelections(selectedArticleType, selectedCategories, allowedGroups);
  }, [selectedArticleType, selectedCategories, allowedGroups]);

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

  const getSelectedCategoriesForGroup = (groupId: string): string[] => {
    const group = allowedGroups.find(g => g.id === groupId);
    if (!group) return [];
    
    const groupCategoryIds = getAllCategoryIds(group.categories);
    return selectedCategories.filter(catId => groupCategoryIds.includes(catId));
  };

  const getAllCategoryIds = (categories: DataCategory[]): string[] => {
    const ids: string[] = [];
    const traverse = (cats: DataCategory[]) => {
      for (const cat of cats) {
        ids.push(cat.id);
        if (cat.children) traverse(cat.children);
      }
    };
    traverse(categories);
    return ids;
  };

  if (loading) {
    return (
      <div className={`bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <span className="text-sm font-medium text-gray-700">Loading article types...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-red-700">Failed to load article types</span>
        </div>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Article Type Selection */}
      <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg">
        <div className="flex items-center space-x-2 mb-4">
          <Tag className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Article Type</h3>
        </div>
        
        <div className="space-y-3">
          <select
            value={selectedArticleType}
            onChange={(e) => onArticleTypeChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-base"
          >
            <option value="">Select Article Type...</option>
            {articleTypes.map(type => (
              <option key={type.name} value={type.name}>
                {type.label}
              </option>
            ))}
          </select>
          
          {selectedArticleType && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  {articleTypes.find(t => t.name === selectedArticleType)?.description}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Categories Section */}
      {selectedArticleType && (
        <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Folder className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Data Categories</h3>
              </div>
              {loadingCategories && (
                <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              )}
            </div>

            {/* Validation Status */}
            {validation && (
              <div className={`p-3 rounded-lg border mb-4 ${
                validation.isValid 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {validation.isValid ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    validation.isValid ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {validation.isValid 
                      ? 'All required categories selected' 
                      : `Missing categories: ${validation.missingGroups.join(', ')}`
                    }
                  </span>
                </div>
                {validation.warnings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <div key={index} className="text-xs text-orange-600">⚠️ {warning}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Groups */}
          <div className="max-h-96 overflow-y-auto">
            {allowedGroups.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Folder className="w-6 h-6 text-gray-400" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">No categories available</h4>
                <p className="text-xs text-gray-500">
                  {loadingCategories ? 'Loading categories...' : 'No category groups found for this article type.'}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {allowedGroups.map((group) => {
                  const isExpanded = expandedGroups.has(group.id);
                  const hasCategories = group.categories.length > 0;
                  const selectedInGroup = getSelectedCategoriesForGroup(group.id);
                  const isRequired = validation?.requiredSelections[group.name] > 0;

                  return (
                    <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Group Header */}
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50">
                        <button
                          onClick={() => toggleGroupExpanded(group.id)}
                          className="w-full flex items-center justify-between p-4 hover:from-gray-100 hover:to-slate-100 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            {isExpanded ? (
                              <FolderOpen className="w-5 h-5 text-blue-500" />
                            ) : (
                              <Folder className="w-5 h-5 text-gray-500" />
                            )}
                            <div className="text-left">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">{group.label}</span>
                                {isRequired && (
                                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                    Required
                                  </span>
                                )}
                              </div>
                              {group.description && (
                                <div className="text-xs text-gray-500 mt-1">{group.description}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {selectedInGroup.length > 0 && (
                              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                                {selectedInGroup.length} selected
                              </span>
                            )}
                            <div className="group relative">
                              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                              <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                {getCategoryGroupHelp(group.name)}
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>
                      </div>

                      {/* Group Categories */}
                      {isExpanded && hasCategories && (
                        <div className="p-4 bg-white/40">
                          <CategoryTree
                            categories={group.categories}
                            selectedCategories={selectedCategories}
                            onToggleCategory={handleCategoryToggle}
                            level={0}
                          />
                        </div>
                      )}

                      {isExpanded && !hasCategories && (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No categories in this group
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Summary Panel */}
      {selectedArticleType && selectedCategories.length > 0 && (
        <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Selection Summary</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Article Type:</span>
              <span className="ml-2 px-3 py-1 text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200 rounded-full">
                {articleTypes.find(t => t.name === selectedArticleType)?.label}
              </span>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700 block mb-2">Selected Categories:</span>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map(categoryId => (
                  <span
                    key={categoryId}
                    className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 border border-emerald-200"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{formatCategoryPath(categoryId, allowedGroups)}</span>
                    <button
                      onClick={() => handleCategoryToggle(categoryId)}
                      className="ml-1 text-emerald-500 hover:text-emerald-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {validation && !validation.isValid && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">
                    Cannot publish: Missing required categories
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleTypeCategorySelector;