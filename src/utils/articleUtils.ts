import { DataCategoryGroup, ArticleTypeMapping } from '../types';

export interface ArticleType {
  name: string;
  label: string;
  description: string;
  requiredCategoryGroups: string[];
  isActive: boolean;
}

export interface CategoryValidation {
  isValid: boolean;
  missingGroups: string[];
  warnings: string[];
  requiredSelections: Record<string, number>; // groupName -> minimum selections
}

// Mock article types configuration (in production, fetch from Salesforce)
export const ARTICLE_TYPES: ArticleType[] = [
  {
    name: 'Knowledge',
    label: 'Knowledge Article',
    description: 'General knowledge base articles for customer support',
    requiredCategoryGroups: ['Topics'],
    isActive: true
  },
  {
    name: 'FAQ',
    label: 'Frequently Asked Questions',
    description: 'Common questions and answers for quick reference',
    requiredCategoryGroups: ['Topics', 'Products'],
    isActive: true
  },
  {
    name: 'Troubleshooting',
    label: 'Troubleshooting Guide',
    description: 'Step-by-step problem resolution guides',
    requiredCategoryGroups: ['Topics', 'Products'],
    isActive: true
  },
  {
    name: 'Tutorial',
    label: 'Tutorial',
    description: 'Educational content and how-to guides',
    requiredCategoryGroups: ['Topics'],
    isActive: true
  }
];

/**
 * Get article types available for selection
 */
export const getArticleTypes = async (): Promise<ArticleType[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // In production, this would fetch from Salesforce Metadata API
  return ARTICLE_TYPES.filter(type => type.isActive);
};

/**
 * Get allowed category groups for a specific article type
 */
export const getAllowedCategoryGroups = async (
  articleType: string,
  allCategoryGroups: DataCategoryGroup[]
): Promise<DataCategoryGroup[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In production, this would query Salesforce DataCategorySelection
  // for the specific article type to get allowed category groups
  
  const articleTypeConfig = ARTICLE_TYPES.find(type => type.name === articleType);
  if (!articleTypeConfig) {
    return [];
  }

  // Filter category groups based on article type permissions
  // This simulates Salesforce's DataCategorySelection filtering
  return allCategoryGroups.filter(group => {
    // For demo purposes, show all groups but mark required ones
    return group.isActive;
  });
};

/**
 * Validate category selections for an article type
 */
export const validateCategorySelections = (
  articleType: string,
  selectedCategories: string[],
  categoryGroups: DataCategoryGroup[]
): CategoryValidation => {
  const articleTypeConfig = ARTICLE_TYPES.find(type => type.name === articleType);
  
  if (!articleTypeConfig) {
    return {
      isValid: false,
      missingGroups: [],
      warnings: ['Invalid article type selected'],
      requiredSelections: {}
    };
  }

  const validation: CategoryValidation = {
    isValid: true,
    missingGroups: [],
    warnings: [],
    requiredSelections: {}
  };

  // Check required category groups
  for (const requiredGroupName of articleTypeConfig.requiredCategoryGroups) {
    const group = categoryGroups.find(g => g.name === requiredGroupName);
    if (!group) {
      validation.warnings.push(`Required category group "${requiredGroupName}" not found`);
      continue;
    }

    // Check if at least one category from this group is selected
    const groupCategoryIds = getAllCategoryIds(group.categories);
    const hasSelectionFromGroup = selectedCategories.some(catId => 
      groupCategoryIds.includes(catId)
    );

    if (!hasSelectionFromGroup) {
      validation.isValid = false;
      validation.missingGroups.push(requiredGroupName);
      validation.requiredSelections[requiredGroupName] = 1;
    }
  }

  return validation;
};

/**
 * Get all category IDs from a hierarchical category structure
 */
const getAllCategoryIds = (categories: any[]): string[] => {
  const ids: string[] = [];
  
  const traverse = (cats: any[]) => {
    for (const cat of cats) {
      ids.push(cat.id);
      if (cat.children && cat.children.length > 0) {
        traverse(cat.children);
      }
    }
  };
  
  traverse(categories);
  return ids;
};

/**
 * Get category group tooltips/help text
 */
export const getCategoryGroupHelp = (groupName: string): string => {
  const helpText: Record<string, string> = {
    'Topics': 'Controls content categorization and search filtering. Select all applicable topics for better discoverability.',
    'Products': 'Determines which product areas this article applies to. Affects visibility and routing to product teams.',
    'Regions': 'Controls geographic visibility. Select regions where this content is relevant and compliant.',
    'Audience': 'Defines who can see this article. Choose based on user roles and access levels.',
    'Channels': 'Specifies where this article appears (web portal, mobile app, etc.). Select all applicable channels.'
  };

  return helpText[groupName] || 'Select categories that best describe this article\'s scope and applicability.';
};

/**
 * Format category path for display (e.g., "Products > Software > CRM")
 */
export const formatCategoryPath = (
  categoryId: string,
  categoryGroups: DataCategoryGroup[]
): string => {
  for (const group of categoryGroups) {
    const path = findCategoryPath(categoryId, group.categories, []);
    if (path.length > 0) {
      return path.join(' > ');
    }
  }
  return 'Unknown Category';
};

/**
 * Find the path to a category in a hierarchical structure
 */
const findCategoryPath = (
  targetId: string,
  categories: any[],
  currentPath: string[]
): string[] => {
  for (const category of categories) {
    const newPath = [...currentPath, category.label];
    
    if (category.id === targetId) {
      return newPath;
    }
    
    if (category.children && category.children.length > 0) {
      const childPath = findCategoryPath(targetId, category.children, newPath);
      if (childPath.length > 0) {
        return childPath;
      }
    }
  }
  
  return [];
};