// ...imports unchanged...
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusLock from 'react-focus-lock';
import { useAppContext } from '../context/AppContext';
import {
  X, FolderOpen, Folder, ChevronRight, ChevronDown, Tag, AlertTriangle, CheckCircle, Save, Loader2
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

// ...helper functions unchanged...

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
    setTimeout(() => setNotification(null), 2000);
  };

  const handleCategoryToggle = (groupId: string, categoryId: string, selectionType: 'single' | 'multi') => {
    setTempSelections(prev => {
      const existingSelection = prev.find(s => s.groupId === groupId);
      const isCurrentlySelected = existingSelection?.selectedCategories.includes(categoryId) || false;

      if (selectionType === 'single') {
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
        let newCategories: string[];

        if (existingSelection) {
          const isSelected = isCurrentlySelected;
          if (!isSelected) {
            // Selecting: add category and parents
            const parentIds = getParentCategoryIds(categoryId, categoryGroups);
            const categoriesToAdd = [categoryId, ...parentIds.filter(id => !existingSelection.selectedCategories.includes(id))];
            newCategories = [...existingSelection.selectedCategories, ...categoriesToAdd];
          } else {
            // Deselecting: remove category and children
            const childIds = getChildCategoryIds(categoryId, categoryGroups);
            newCategories = existingSelection.selectedCategories.filter(id => id !== categoryId && !childIds.includes(id));
          }
          return prev.map(s =>
            s.groupId === groupId
              ? { ...s, selectedCategories: newCategories }
              : s
          );
        } else {
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
      showNotification('error', `Missing required: ${validation.errors.join(', ')}`);
      return;
    }

    try {
      const result = await saveArticleCategories(tempSelections);
      if (result.success) {
        const allSelectedCategories = tempSelections.flatMap(s => s.selectedCategories);
        const updatedArticle = {
          ...article,
          dataCategories: allSelectedCategories,
          lastModified: new Date().toISOString()
        };
        updateArticle(updatedArticle);
        showNotification('success', 'Categories updated');
        onSave(tempSelections);
        setTimeout(() => onClose(), 800);
      } else {
        showNotification('error', result.message);
      }
    } catch (error) {
      showNotification('error', 'Failed to save');
    }
  };

  const selectedGroup = categoryGroups.find(g => g.id === selectedGroupId);
  const selectedCategoriesForGroup = tempSelections.find(s => s.groupId === selectedGroupId)?.selectedCategories || [];

  // Helper function to find category by ID in nested structure
  const findCategoryById = (categories: DataCategory[], targetId: string): DataCategory | null => {
    for (const category of categories) {
      if (category.id === targetId) return category;
      if (category.children) {
        const found = findCategoryById(category.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-2 py-10 text-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-500 bg-opacity-50 transition-opacity z-40"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all max-w-md w-full relative z-50"
          >
            <FocusLock>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
                <h3 className="text-base font-semibold text-gray-900">Edit Categories</h3>
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Notification */}
              {notification && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mx-4 mt-4 p-2 rounded-lg border ${
                    notification.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  } flex items-center space-x-2`}
                >
                  {notification.type === 'success'
                    ? <CheckCircle className="w-4 h-4" />
                    : <AlertTriangle className="w-4 h-4" />}
                  <span className="text-sm">{notification.message}</span>
                </motion.div>
              )}
              {/* Content */}
              <div className="p-4">
                {/* Category group selector */}
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 mb-1">Category Group</label>
                  <select
                    value={selectedGroupId}
                    onChange={e => setSelectedGroupId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50"
                    disabled={loading || saving}
                  >
                    {categoryGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.label} {group.isRequired ? '(Required)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Category tree */}
                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-white mb-3">
                  {selectedGroup && (
                    <CategoryTree
                      categories={selectedGroup.categories}
                      selectedCategories={selectedCategoriesForGroup}
                      onToggleCategory={categoryId =>
                        handleCategoryToggle(selectedGroup.id, categoryId, selectedGroup.selectionType)
                      }
                      selectionType={selectedGroup.selectionType}
                      groupId={selectedGroup.id}
                      level={0}
                      saving={saving}
                      loading={loading}
                      categoryGroups={categoryGroups}
                    />
                  )}
                  {!selectedGroup && (
                    <div className="text-gray-400 py-6 text-center">No group selected.</div>
                  )}
                </div>
                {/* Selected summary */}
                {selectedCategoriesForGroup.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">Selected:</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedCategoriesForGroup.map(categoryId => {
                        const category = selectedGroup && findCategoryById(selectedGroup.categories, categoryId);
                        return category ? (
                          <span key={categoryId}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 border border-purple-200"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {category.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-400">
                  {tempSelections.reduce((sum, s) => sum + s.selectedCategories.length, 0)} total selected
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    disabled={loading || saving}
                    className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading || saving}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </FocusLock>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default CategoryEditModal;
