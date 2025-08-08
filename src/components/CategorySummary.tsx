import React from 'react';
import { Edit, Folder, Tag, AlertTriangle } from 'lucide-react';
import { DataCategoryGroup, ArticleCategorySelection, useArticleCategories } from '../hooks/useArticleCategories';
import { useAppContext } from '../context/AppContext';

interface CategorySummaryProps {
  articleId: string;
  onEditClick: () => void;
  className?: string;
}

const CategorySummary: React.FC<CategorySummaryProps> = ({
  articleId,
  onEditClick,
  className = ''
}) => {
  const { articles } = useAppContext();
  const { categoryGroups, articleSelections, getCategoryById, validateSelections } = useArticleCategories(articleId);
  
  const validation = validateSelections(articleSelections);

  const getSelectedCategoriesForGroup = (groupId: string) => {
    const selection = articleSelections.find(s => s.groupId === groupId);
    if (!selection) return [];
    
    return selection.selectedCategories
      .map(catId => getCategoryById(catId))
      .filter(Boolean);
  };

  const getCategoryDisplayName = (categoryId: string): string => {
    // Mock category mapping - in production this would come from synced data
    const categoryMap: Record<string, string> = {
      'cat-getting-started': 'Getting Started',
      'cat-installation': 'Getting Started > Installation',
      'cat-setup': 'Getting Started > Initial Setup',
      'cat-advanced': 'Advanced Topics',
      'cat-api': 'Advanced Topics > API Integration',
      'cat-customization': 'Advanced Topics > Customization',
      'cat-troubleshooting': 'Troubleshooting',
      'cat-common-issues': 'Troubleshooting > Common Issues',
      'cat-salesforce-platform': 'Salesforce Platform',
      'cat-lightning': 'Salesforce Platform > Lightning Experience',
      'cat-classic': 'Salesforce Platform > Salesforce Classic'
    };
    
    return categoryMap[categoryId] || categoryId;
  };

  const hasAnySelections = articleSelections.some(s => s.selectedCategories.length > 0);

  // Get article's actual dataCategories for display
  const article = articles.find(a => a.id === articleId);
  const actualDataCategories = article?.dataCategories || [];

  return (
    <div className={`bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Folder className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Data Categories</h3>
        </div>
        <button
          onClick={onEditClick}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>

      {/* Validation Status */}
      {!validation.isValid && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Missing required categories</span>
          </div>
          <ul className="mt-2 text-xs text-red-600 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Category Groups Display */}
      <div className="space-y-4">
        {/* Show actual article dataCategories if available */}
        {actualDataCategories.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Assigned Data Categories:</span>
            </div>
            <div className="ml-6 flex flex-wrap gap-2">
              {actualDataCategories.map((categoryId, index) => (
                <span
                  key={`${categoryId}-${index}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200"
                >
                  {getCategoryDisplayName(categoryId)}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {hasAnySelections ? (
          categoryGroups.map(group => {
            const selectedCategories = getSelectedCategoriesForGroup(group.id);
            
            if (selectedCategories.length === 0) return null;

            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{group.label}:</span>
                  {group.isRequired && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                      Required
                    </span>
                  )}
                </div>
                <div className="ml-6 space-y-1">
                  {selectedCategories.map(category => (
                    <div key={category!.id} className="flex items-center space-x-2">
                      <Tag className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-600">{getCategoryDisplayName(category!.id)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : actualDataCategories.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Folder className="w-6 h-6 text-gray-400" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">No categories selected</h4>
            <p className="text-xs text-gray-500">Click Edit to assign categories</p>
          </div>
        ) : (
          <div></div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{categoryGroups.length} groups available</span>
          <span>{articleSelections.reduce((sum, s) => sum + s.selectedCategories.length, 0)} selected</span>
        </div>
      </div>
    </div>
  );
};

export default CategorySummary;