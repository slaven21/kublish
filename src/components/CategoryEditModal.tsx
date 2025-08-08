import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusLock from 'react-focus-lock';
import { useAppContext } from '../context/AppContext';
import OnboardingTooltip from './OnboardingTooltip';
import { 
  X, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Tag, 
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Save,
  Loader2
} from 'lucide-react';
import { 
  DataCategoryGroup, 
  DataCategory, 
  ArticleCategorySelection, 
  useArticleCategories 
} from '../hooks/useArticleCategories';

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
  onSave: (selections: ArticleCategorySelection[]) => void;
}

// Helper function to get all parent category IDs for a given category
const getParentCategoryIds = (categoryId: string, categoryGroups: DataCategoryGroup[]): string[] => {
  const parentIds: string[] = [];
  
  const findParents = (catId: string, categories: DataCategory[], parents: string[] = []): string[] => {
    for (const category of categories) {
      if (category.id === catId) {
        return parents;
      }
      if (category.children) {
        const found = findParents(catId, category.children, [...parents, category.id]);
        if (found.length > 0 || category.children.some(child => child.id === catId)) {
          return [...parents, category.id];
        }
      }
    }
    return [];
  };
  
  for (const group of categoryGroups) {
    const parents = findParents(categoryId, group.categories);
    parentIds.push(...parents);
  }
  
  return parentIds;
};

// Helper function to get all child category IDs for a given category
const getChildCategoryIds = (categoryId: string, categoryGroups: DataCategoryGroup[]): string[] => {
  const childIds: string[] = [];
  
  const findChildren = (catId: string, categories: DataCategory[]): string[] => {
    for (const category of categories) {
      if (category.id === catId && category.children) {
        const getAllDescendants = (cats: DataCategory[]): string[] => {
          const ids: string[] = [];
          for (const cat of cats) {
            ids.push(cat.id);
            if (cat.children) {
              ids.push(...getAllDescendants(cat.children));
            }
          }
          return ids;
        };
        return getAllDescendants(category.children);
      }
      if (category.children) {
        const found = findChildren(catId, category.children);
        if (found.length > 0) {
          return found;
        }
      }
    }
    return [];
  };
  
  for (const group of categoryGroups) {
    const children = findChildren(categoryId, group.categories);
    childIds.push(...children);
  }
  
  return childIds;
};

interface CategoryTreeProps {
  categories: DataCategory[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  selectionType: 'single' | 'multi';
  groupId: string;
  level?: number;
  saving: boolean;
  loading: boolean;
  categoryGroups: DataCategoryGroup[];
}

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  selectedCategories,
  onToggleCategory,
  selectionType,
  groupId,
  level = 0,
  saving,
  loading,
  categoryGroups
}) => {
  // Debug logging
  console.log('CategoryTree - loading:', loading, 'saving:', saving, 'level:', level);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleCategorySelect = (categoryId: string) => {
    const isCurrentlySelected = selectedCategories.includes(categoryId);
    
    if (selectionType === 'single') {
      // For single select, clear other selections in this group first
      onToggleCategory(categoryId);
    } else {
      // For multi-select, handle parent-child relationships
      if (!isCurrentlySelected) {
        // Selecting: also select all parents
        const parentIds = getParentCategoryIds(categoryId, categoryGroups);
        parentIds.forEach(parentId => {
          if (!selectedCategories.includes(parentId)) {
            onToggleCategory(parentId);
          }
        });
      }
      
      // Toggle the category itself
      onToggleCategory(categoryId);
    }
  };

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedNodes.has(category.id);
        const isSelected = selectedCategories.includes(category.id);
        const paddingLeft = level * 20;

        return (
          <div key={category.id}>
            <div 
              className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 ${
                isSelected ? 'bg-purple-50 border border-purple-200' : ''
              }`}
              style={{ paddingLeft: `${paddingLeft + 8}px` }}
            >
              {hasChildren && (
                <button
                  onClick={() => toggleExpanded(category.id)}
                  disabled={loading === true || saving === true}
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
                    type={selectionType === 'single' ? 'radio' : 'checkbox'}
                    name={selectionType === 'single' ? `group-${groupId}` : undefined}
                    checked={isSelected}
                    onChange={() => handleCategorySelect(category.id)}
                    disabled={loading === true || saving === true}
                    className={`rounded border-gray-300 focus:ring-purple-500 ${
                      selectionType === 'single' 
                        ? 'text-purple-600' 
                        : 'text-purple-600'
                    }`}
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
                selectionType={selectionType}
                groupId={groupId}
                level={level + 1}
                saving={saving}
                loading={loading}
                categoryGroups={categoryGroups}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  isOpen,
  onClose,
  articleId,
  onSave
}) => {
  const { categoryGroups, articleSelections, loading, saving, saveArticleCategories, validateSelections } = useArticleCategories(articleId);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [tempSelections, setTempSelections] = useState<ArticleCategorySelection[]>([]);
  const { updateArticle, articles } = useAppContext();
  const article = articles.find(a => a.id === articleId);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Debug logging
  console.log('CategoryEditModal - loading:', loading, 'saving:', saving, 'categoryGroups:', categoryGroups.length);
  useEffect(() => {
    if (isOpen) {
      setTempSelections([...articleSelections]);
      if (categoryGroups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(categoryGroups[0].id);
      }
    }
  }, [isOpen, articleSelections, categoryGroups, selectedGroupId]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCategoryToggle = (groupId: string, categoryId: string, selectionType: 'single' | 'multi') => {
    setTempSelections(prev => {
      const existingSelection = prev.find(s => s.groupId === groupId);
      const isCurrentlySelected = existingSelection?.selectedCategories.includes(categoryId) || false;
      
      if (selectionType === 'single') {
        // Single select: replace all selections for this group
        if (existingSelection) {
          return prev.map(s => 
            s.groupId === groupId 
              ? { ...s, selectedCategories: [categoryId] }
              : s
          );
        } else {
          const group = categoryGroups.find(g => g.id === groupId);
          return [...prev, {
            groupId,
            groupName: group?.name || '',
            selectedCategories: [categoryId]
          }];
        }
      } else {
        // Multi-select: toggle category
        let newCategories: string[];
        
        if (existingSelection) {
          const isSelected = isCurrentlySelected;
          
          if (!isSelected) {
            // Selecting: add category and all its parents
            const parentIds = getParentCategoryIds(categoryId, categoryGroups);
            const categoriesToAdd = [categoryId, ...parentIds.filter(id => !existingSelection.selectedCategories.includes(id))];
            newCategories = [...existingSelection.selectedCategories, ...categoriesToAdd];
          } else {
            // Deselecting: remove category and all its children
            const childIds = getChildCategoryIds(categoryId, categoryGroups);
          const newCategories = isSelected
              ? existingSelection.selectedCategories.filter(id => id !== categoryId && !childIds.includes(id))
              : [...existingSelection.selectedCategories, categoryId];
          }
          
          return prev.map(s => 
            s.groupId === groupId 
              ? { ...s, selectedCategories: newCategories }
              : s
          );
        } else {
          // No existing selection: add category and parents
          const parentIds = getParentCategoryIds(categoryId, categoryGroups);
          newCategories = [categoryId, ...parentIds];
          
          const group = categoryGroups.find(g => g.id === groupId);
          return [...prev, {
            groupId,
            groupName: group?.name || '',
            selectedCategories: newCategories
          }];
        }
      }
    });
  };

  const handleSave = async () => {
    const validation = validateSelections(tempSelections);
    
    if (!validation.isValid) {
      showNotification('error', `Missing required categories: ${validation.errors.join(', ')}`);
      return;
    }

    try {
      const result = await saveArticleCategories(tempSelections);
      if (result.success) {
        // Update the article's dataCategories in the context
        const allSelectedCategories = tempSelections.flatMap(s => s.selectedCategories);
        const updatedArticle = {
          ...article,
          dataCategories: allSelectedCategories,
          lastModified: new Date().toISOString()
        };
        updateArticle(updatedArticle);
        
        showNotification('success', '✅ Categories updated');
        onSave(tempSelections);
        setTimeout(() => onClose(), 1000);
      } else {
        showNotification('error', result.message);
      }
    } catch (error) {
      showNotification('error', 'Failed to save categories');
    }
  };

  const selectedGroup = categoryGroups.find(g => g.id === selectedGroupId);
  const selectedCategoriesForGroup = tempSelections.find(s => s.groupId === selectedGroupId)?.selectedCategories || [];

  const getGroupTooltip = (group: DataCategoryGroup) => {
    const tooltips: Record<string, string> = {
      'Product_Line': 'Controls product-specific visibility and routing. Select all applicable products.',
      'Region': 'Controls geographic visibility and compliance. Select all regions where this content applies.',
      'Audience': 'Defines who can access this article. Choose the primary audience type.',
      'Channel': 'Specifies where this article appears (web, mobile, etc.). Select all applicable channels.',
      'Topic': 'Categorizes content by subject matter. Select the most relevant topics.'
    };
    
    return tooltips[group.name] || group.description || 'Select categories that apply to this article.';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full relative z-50"
          >
            <FocusLock>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Edit Article Categories</h3>
                    <p className="text-sm text-gray-600 mt-1">Assign categories to control visibility and routing</p>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={saving}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notification */}
              {notification && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mx-6 mt-4 p-3 rounded-lg border ${
                    notification.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {notification.type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{notification.message}</span>
                  </div>
                </motion.div>
              )}

              {/* Content */}
              <div className="flex h-96">
                {/* Left Panel - Category Groups */}
                <div className="w-1/3 border-r border-gray-200 bg-gray-50">
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Category Groups</h4>
                    {categoryGroups.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {categoryGroups.map(group => {
                          const isSelected = selectedGroupId === group.id;
                          const hasSelections = tempSelections.find(s => s.groupId === group.id)?.selectedCategories.length || 0;
                          
                          return (
                            <button
                              key={group.id}
                              onClick={() => setSelectedGroupId(group.id)}
                              disabled={loading || saving}
                              className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-purple-100 border border-purple-200 text-purple-700' 
                                  : 'hover:bg-white hover:shadow-sm border border-transparent'
                              } ${
                                (loading || saving) ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Folder className={`w-4 h-4 ${isSelected ? 'text-purple-600' : 'text-gray-500'}`} />
                                  <div>
                                    <div className="text-sm font-medium">{group.label}</div>
                                    <div className="flex items-center space-x-2 mt-1">
                                      {group.isRequired && (
                                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                          Required
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-500">
                                        {group.selectionType === 'single' ? 'Single' : 'Multi'} select
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {hasSelections > 0 && (
                                    <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                                      {hasSelections}
                                    </span>
                                  )}
                                  <div className="group relative">
                                    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                    <div className="absolute left-full top-0 ml-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                      {getGroupTooltip(group)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Category Tree */}
                <div className="flex-1 p-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading categories...</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {selectedGroup ? (
                        <div>
                          <div className="flex items-center space-x-2 mb-4">
                            <FolderOpen className="w-5 h-5 text-purple-600" />
                            <h4 className="text-lg font-medium text-gray-900">{selectedGroup.label}</h4>
                            {selectedGroup.isRequired && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                Required
                              </span>
                            )}
                          </div>
                          
                          {selectedGroup.description && (
                            <p className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              {selectedGroup.description}
                            </p>
                          )}

                          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
                            <CategoryTree
                              categories={selectedGroup.categories}
                              selectedCategories={selectedCategoriesForGroup}
                              onToggleCategory={(categoryId) => 
                                handleCategoryToggle(selectedGroup.id, categoryId, selectedGroup.selectionType)
                              }
                              selectionType={selectedGroup.selectionType}
                              groupId={selectedGroup.id}
                              level={0}
                              saving={saving}
                              loading={loading}
                              categoryGroups={categoryGroups}
                            />
                          </div>

                          {/* Selection Summary */}
                          {selectedCategoriesForGroup.length > 0 && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm font-medium text-gray-700 mb-2">
                                Selected ({selectedCategoriesForGroup.length}):
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedCategoriesForGroup.map(categoryId => {
                                  const category = findCategoryById(selectedGroup.categories, categoryId);
                                  return category ? (
                                    <span
                                      key={categoryId}
                                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200"
                                    >
                                      <Tag className="w-3 h-3" />
                                      <span>{category.label}</span>
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Select a Category Group</h4>
                          <p className="text-gray-500">Choose a group from the left panel to view its categories</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {tempSelections.reduce((sum, s) => sum + s.selectedCategories.length, 0)} categories selected
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={onClose}
                      disabled={loading || saving}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading || saving}
                      className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-purple-400 disabled:to-blue-400 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </FocusLock>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

// Helper function to find category by ID in nested structure
const findCategoryById = (categories: DataCategory[], targetId: string): DataCategory | null => {
  for (const category of categories) {
    if (category.id === targetId) {
      return category;
    }
    if (category.children) {
      const found = findCategoryById(category.children, targetId);
      if (found) return found;
    }
  }
  return null;
};

export default CategoryEditModal;