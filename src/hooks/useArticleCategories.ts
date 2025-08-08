import { useState, useEffect } from 'react';

export interface DataCategoryGroup {
  id: string;
  name: string;
  label: string;
  description?: string;
  selectionType: 'single' | 'multi';
  isRequired: boolean;
  categories: DataCategory[];
}

export interface DataCategory {
  id: string;
  name: string;
  label: string;
  parentId?: string;
  level: number;
  children?: DataCategory[];
}

export interface ArticleCategorySelection {
  groupId: string;
  groupName: string;
  selectedCategories: string[];
}

// Mock data representing Salesforce Data Category Groups
const mockDataCategoryGroups: DataCategoryGroup[] = [
  {
    id: 'dcg-topics',
    name: 'Topics',
    label: 'Topics',
    description: 'Main topic categories for organizing content',
    selectionType: 'multi',
    isRequired: true,
    categories: [
      {
        id: 'cat-getting-started',
        name: 'Getting_Started',
        label: 'Getting Started',
        level: 0,
        children: [
          {
            id: 'cat-installation',
            name: 'Installation',
            label: 'Installation',
            parentId: 'cat-getting-started',
            level: 1
          },
          {
            id: 'cat-setup',
            name: 'Initial_Setup',
            label: 'Initial Setup',
            parentId: 'cat-getting-started',
            level: 1
          },
          {
            id: 'cat-first-steps',
            name: 'First_Steps',
            label: 'First Steps',
            parentId: 'cat-getting-started',
            level: 1
          }
        ]
      },
      {
        id: 'cat-advanced',
        name: 'Advanced_Topics',
        label: 'Advanced Topics',
        level: 0,
        children: [
          {
            id: 'cat-api',
            name: 'API_Integration',
            label: 'API Integration',
            parentId: 'cat-advanced',
            level: 1
          },
          {
            id: 'cat-customization',
            name: 'Customization',
            label: 'Customization',
            parentId: 'cat-advanced',
            level: 1
          },
          {
            id: 'cat-automation',
            name: 'Automation',
            label: 'Automation',
            parentId: 'cat-advanced',
            level: 1
          }
        ]
      },
      {
        id: 'cat-troubleshooting',
        name: 'Troubleshooting',
        label: 'Troubleshooting',
        level: 0,
        children: [
          {
            id: 'cat-common-issues',
            name: 'Common_Issues',
            label: 'Common Issues',
            parentId: 'cat-troubleshooting',
            level: 1
          },
          {
            id: 'cat-error-codes',
            name: 'Error_Codes',
            label: 'Error Codes',
            parentId: 'cat-troubleshooting',
            level: 1
          },
          {
            id: 'cat-performance',
            name: 'Performance_Issues',
            label: 'Performance Issues',
            parentId: 'cat-troubleshooting',
            level: 1
          }
        ]
      }
    ]
  },
  {
    id: 'dcg-products',
    name: 'Products',
    label: 'Products',
    description: 'Product-specific categories for targeted content',
    selectionType: 'multi',
    isRequired: true,
    categories: [
      {
        id: 'cat-salesforce-platform',
        name: 'Salesforce_Platform',
        label: 'Salesforce Platform',
        level: 0,
        children: [
          {
            id: 'cat-lightning',
            name: 'Lightning_Experience',
            label: 'Lightning Experience',
            parentId: 'cat-salesforce-platform',
            level: 1
          },
          {
            id: 'cat-classic',
            name: 'Salesforce_Classic',
            label: 'Salesforce Classic',
            parentId: 'cat-salesforce-platform',
            level: 1
          },
          {
            id: 'cat-mobile',
            name: 'Salesforce_Mobile',
            label: 'Salesforce Mobile',
            parentId: 'cat-salesforce-platform',
            level: 1
          }
        ]
      },
      {
        id: 'cat-service-cloud',
        name: 'Service_Cloud',
        label: 'Service Cloud',
        level: 0,
        children: [
          {
            id: 'cat-cases',
            name: 'Case_Management',
            label: 'Case Management',
            parentId: 'cat-service-cloud',
            level: 1
          },
          {
            id: 'cat-knowledge',
            name: 'Knowledge_Base',
            label: 'Knowledge Base',
            parentId: 'cat-service-cloud',
            level: 1
          },
          {
            id: 'cat-live-agent',
            name: 'Live_Agent',
            label: 'Live Agent',
            parentId: 'cat-service-cloud',
            level: 1
          }
        ]
      },
      {
        id: 'cat-sales-cloud',
        name: 'Sales_Cloud',
        label: 'Sales Cloud',
        level: 0,
        children: [
          {
            id: 'cat-leads',
            name: 'Lead_Management',
            label: 'Lead Management',
            parentId: 'cat-sales-cloud',
            level: 1
          },
          {
            id: 'cat-opportunities',
            name: 'Opportunity_Management',
            label: 'Opportunity Management',
            parentId: 'cat-sales-cloud',
            level: 1
          }
        ]
      }
    ]
  },
  {
    id: 'dcg-audience',
    name: 'Audience',
    label: 'Audience',
    description: 'Defines who can access this article',
    selectionType: 'single',
    isRequired: true,
    categories: [
      {
        id: 'cat-end-users',
        name: 'End_Users',
        label: 'End Users',
        level: 0
      },
      {
        id: 'cat-administrators',
        name: 'Administrators',
        label: 'Administrators',
        level: 0
      },
      {
        id: 'cat-developers',
        name: 'Developers',
        label: 'Developers',
        level: 0
      },
      {
        id: 'cat-partners',
        name: 'Partners',
        label: 'Partners',
        level: 0
      }
    ]
  },
  {
    id: 'dcg-regions',
    name: 'Regions',
    label: 'Regions',
    description: 'Geographic regions where this content applies',
    selectionType: 'multi',
    isRequired: false,
    categories: [
      {
        id: 'cat-north-america',
        name: 'North_America',
        label: 'North America',
        level: 0,
        children: [
          {
            id: 'cat-us',
            name: 'United_States',
            label: 'United States',
            parentId: 'cat-north-america',
            level: 1
          },
          {
            id: 'cat-canada',
            name: 'Canada',
            label: 'Canada',
            parentId: 'cat-north-america',
            level: 1
          }
        ]
      },
      {
        id: 'cat-europe',
        name: 'Europe',
        label: 'Europe',
        level: 0,
        children: [
          {
            id: 'cat-uk',
            name: 'United_Kingdom',
            label: 'United Kingdom',
            parentId: 'cat-europe',
            level: 1
          },
          {
            id: 'cat-germany',
            name: 'Germany',
            label: 'Germany',
            parentId: 'cat-europe',
            level: 1
          },
          {
            id: 'cat-france',
            name: 'France',
            label: 'France',
            parentId: 'cat-europe',
            level: 1
          }
        ]
      },
      {
        id: 'cat-asia-pacific',
        name: 'Asia_Pacific',
        label: 'Asia Pacific',
        level: 0
      }
    ]
  }
];

export const useArticleCategories = (articleId?: string) => {
  const [categoryGroups, setCategoryGroups] = useState<DataCategoryGroup[]>([]);
  const [articleSelections, setArticleSelections] = useState<ArticleCategorySelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData(true);
  }, [articleId]);

  const loadData = async (showLoading = false) => {
    setLoading(true);
    try {
      await loadCategoryGroups();
      if (articleId) {
        await loadArticleSelections(articleId);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryGroups = async () => {
    try {
      // Simulate API call to fetch DCGs from Salesforce
      await new Promise(resolve => setTimeout(resolve, 800));
      setCategoryGroups(mockDataCategoryGroups);
    } catch (error) {
      console.error('Failed to load category groups:', error);
    }
  };

  const loadArticleSelections = async (id: string) => {
    try {
      // Simulate loading existing article category selections
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock existing selections
      const mockSelections: ArticleCategorySelection[] = [
        {
          groupId: 'dcg-topics',
          groupName: 'Topics',
          selectedCategories: ['cat-getting-started', 'cat-installation']
        },
        {
          groupId: 'dcg-products',
          groupName: 'Products',
          selectedCategories: ['cat-salesforce-platform', 'cat-lightning']
        },
        {
          groupId: 'dcg-audience',
          groupName: 'Audience',
          selectedCategories: ['cat-end-users']
        },
        {
          groupId: 'dcg-regions',
          groupName: 'Regions',
          selectedCategories: ['cat-north-america', 'cat-us']
        }
      ];
      
      setArticleSelections(mockSelections);
    } catch (error) {
      console.error('Failed to load article selections:', error);
    }
  };

  const saveArticleCategories = async (selections: ArticleCategorySelection[]) => {
    try {
      setSaving(true);
      // Simulate API call to save categories to Salesforce
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setArticleSelections(selections);
      return { success: true, message: 'Categories updated successfully' };
    } catch (error) {
      console.error('Failed to save categories:', error);
      return { success: false, message: 'Failed to update categories' };
    } finally {
      setSaving(false);
    }
  };

  const getCategoryById = (categoryId: string): DataCategory | null => {
    for (const group of categoryGroups) {
      const findInCategories = (categories: DataCategory[]): DataCategory | null => {
        for (const cat of categories) {
          if (cat.id === categoryId) return cat;
          if (cat.children) {
            const found = findInCategories(cat.children);
            if (found) return found;
          }
        }
        return null;
      };
      const found = findInCategories(group.categories);
      if (found) return found;
    }
    return null;
  };

  const validateSelections = (selections: ArticleCategorySelection[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    for (const group of categoryGroups) {
      if (group.isRequired) {
        const selection = selections.find(s => s.groupId === group.id);
        if (!selection || selection.selectedCategories.length === 0) {
          errors.push(`${group.label} is required`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    categoryGroups,
    articleSelections,
    loading,
    saving,
    saveArticleCategories,
    getCategoryById,
    validateSelections
  };
};