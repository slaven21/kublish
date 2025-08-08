import { DataCategoryGroup, ArticleTypeMapping, CategorySyncStatus } from '../types';

// Simulated API functions for Data Category management
export const syncCategoryStructure = async (force: boolean = false): Promise<{
  success: boolean;
  articleTypes: number;
  categoryGroups: number;
  categories: number;
  syncedAt: string;
}> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Simulate occasional failures
  if (Math.random() < 0.1) {
    throw new Error('Salesforce connection timeout - please try again');
  }
  
  // In a real implementation, this would:
  // 1. Connect to Salesforce Metadata API
  // 2. Fetch DataCategoryGroup metadata
  // 3. Fetch DataCategorySelection objects for each article type
  // 4. Store in local cache/database
  
  console.log('Syncing category structure from Salesforce...');
  
  return {
    success: true,
    articleTypes: 3,
    categoryGroups: 4,
    categories: 24,
    syncedAt: new Date().toISOString()
  };
};

export const getCategoryPicklist = async (articleType?: string): Promise<{
  categoryGroups: DataCategoryGroup[];
  articleTypeMappings: ArticleTypeMapping[];
  lastSyncedAt?: string;
}> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock data representing synced Salesforce categories
  const mockCategoryGroups: DataCategoryGroup[] = [
    {
      id: 'group-1',
      name: 'Topics',
      label: 'Topics',
      description: 'Main topic categories for articles',
      isActive: true,
      lastSyncedAt: new Date().toISOString(),
      categories: [
        {
          id: 'cat-1',
          name: 'Getting_Started',
          label: 'Getting Started',
          level: 0,
          sortOrder: 0,
          isActive: true,
          children: [
            {
              id: 'cat-1-1',
              name: 'Installation',
              label: 'Installation',
              parentCategoryId: 'cat-1',
              level: 1,
              sortOrder: 0,
              isActive: true
            },
            {
              id: 'cat-1-2',
              name: 'Configuration',
              label: 'Configuration',
              parentCategoryId: 'cat-1',
              level: 1,
              sortOrder: 1,
              isActive: true
            }
          ]
        },
        {
          id: 'cat-2',
          name: 'Advanced_Topics',
          label: 'Advanced Topics',
          level: 0,
          sortOrder: 1,
          isActive: true,
          children: [
            {
              id: 'cat-2-1',
              name: 'API_Integration',
              label: 'API Integration',
              parentCategoryId: 'cat-2',
              level: 1,
              sortOrder: 0,
              isActive: true
            },
            {
              id: 'cat-2-2',
              name: 'Custom_Development',
              label: 'Custom Development',
              parentCategoryId: 'cat-2',
              level: 1,
              sortOrder: 1,
              isActive: true
            }
          ]
        }
      ]
    },
    {
      id: 'group-2',
      name: 'Products',
      label: 'Products',
      description: 'Product-specific categories',
      isActive: true,
      lastSyncedAt: new Date().toISOString(),
      categories: [
        {
          id: 'cat-3',
          name: 'Salesforce_Platform',
          label: 'Salesforce Platform',
          level: 0,
          sortOrder: 0,
          isActive: true,
          children: [
            {
              id: 'cat-3-1',
              name: 'Lightning',
              label: 'Lightning Experience',
              parentCategoryId: 'cat-3',
              level: 1,
              sortOrder: 0,
              isActive: true
            },
            {
              id: 'cat-3-2',
              name: 'Classic',
              label: 'Salesforce Classic',
              parentCategoryId: 'cat-3',
              level: 1,
              sortOrder: 1,
              isActive: true
            }
          ]
        }
      ]
    }
  ];

  const mockArticleTypeMappings: ArticleTypeMapping[] = [
    {
      articleType: 'Knowledge',
      dataCategoryObjectName: 'Knowledge__DataCategorySelection',
      isActive: true,
      lastSyncedAt: new Date().toISOString()
    },
    {
      articleType: 'FAQ',
      dataCategoryObjectName: 'FAQ__DataCategorySelection',
      isActive: true,
      lastSyncedAt: new Date().toISOString()
    }
  ];
  
  return {
    categoryGroups: mockCategoryGroups,
    articleTypeMappings: mockArticleTypeMappings,
    lastSyncedAt: new Date().toISOString()
  };
};

export const searchCategories = async (query: string): Promise<{
  categories: Array<{ value: string; label: string; count: number }>;
  total: number;
}> => {
  // Simulate API call delay and rate limiting
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Simulate rate limiting (5% chance)
  if (Math.random() < 0.05) {
    throw new Error('Data category search rate limit exceeded - please slow down');
  }
  
  // Mock data categories data
  const allDataCategories = [
    { value: 'cat-getting-started', label: 'Getting Started', count: 15 },
    { value: 'cat-installation', label: 'Installation', count: 8 },
    { value: 'cat-setup', label: 'Initial Setup', count: 12 },
    { value: 'cat-advanced', label: 'Advanced Topics', count: 22 },
    { value: 'cat-api', label: 'API Integration', count: 18 },
    { value: 'cat-troubleshooting', label: 'Troubleshooting', count: 14 },
    { value: 'cat-common-issues', label: 'Common Issues', count: 9 },
    { value: 'cat-salesforce-platform', label: 'Salesforce Platform', count: 6 },
    { value: 'cat-lightning', label: 'Lightning Experience', count: 11 },
    { value: 'cat-customization', label: 'Customization', count: 7 }
  ];
  
  if (!query.trim()) {
    return {
      categories: allDataCategories,
      total: allDataCategories.length
    };
  }
  
  // Fuzzy search implementation
  const searchTerm = query.toLowerCase();
  const filteredDataCategories = allDataCategories
    .filter(dataCategory => {
      const label = dataCategory.label.toLowerCase();
      // Simple fuzzy matching - contains all characters in order
      let termIndex = 0;
      for (let i = 0; i < label.length && termIndex < searchTerm.length; i++) {
        if (label[i] === searchTerm[termIndex]) {
          termIndex++;
        }
      }
      return termIndex === searchTerm.length;
    })
    .sort((a, b) => {
      // Prioritize exact matches and prefix matches
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();
      
      if (aLabel === searchTerm) return -1;
      if (bLabel === searchTerm) return 1;
      if (aLabel.startsWith(searchTerm)) return -1;
      if (bLabel.startsWith(searchTerm)) return 1;
      
      return a.label.localeCompare(b.label);
    });
  
  return {
    categories: filteredDataCategories,
    total: filteredDataCategories.length
  };
};

export const getCategorySyncStatus = async (): Promise<CategorySyncStatus> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    isConfigured: true,
    articleTypeCount: 2,
    categoryGroupCount: 2,
    totalCategoryCount: 8,
    lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    needsSync: false
  };
};

export const deleteCategoryStructure = async (): Promise<{
  success: boolean;
  categories: number;
  categoryGroups: number;
  articleTypeMappings: number;
}> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('Deleting category structure...');
  
  return {
    success: true,
    categories: 8,
    categoryGroups: 2,
    articleTypeMappings: 2
  };
};