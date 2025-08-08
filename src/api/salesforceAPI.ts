import { Article, SyncLog } from '../types';

// Simulated API functions for Salesforce integration
export const getArticlesFromSalesforce = async (): Promise<Article[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real implementation, this would make a REST API call to Salesforce
  return [
    {
      id: 'sf-1',
      title: 'Salesforce Knowledge Article 1',
      body: 'Content from Salesforce Knowledge base...',
      category: 'Documentation',
      tags: ['salesforce', 'knowledge'],
      visibility: 'public',
      status: 'published',
      owner: 'SF Admin',
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ];
};

export const syncArticleToSalesforce = async (article: Article): Promise<{ success: boolean; message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate occasional failures
  if (Math.random() < 0.2) {
    throw new Error('Network timeout - please try again');
  }
  
  // In a real implementation, this would POST/PATCH to Salesforce Knowledge API
  console.log('Syncing article to Salesforce:', article.title);
  
  return {
    success: true,
    message: `Article "${article.title}" successfully synced to Salesforce`
  };
};

export const bulkPublishArticles = async (
  articleIds: string[],
  articles: Article[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: number; failed: number; errors: string[] }> => {
  const results = { success: 0, failed: 0, errors: [] as string[] };
  
  for (let i = 0; i < articleIds.length; i++) {
    const article = articles.find(a => a.id === articleIds[i]);
    if (!article) continue;
    
    try {
      await syncArticleToSalesforce(article);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to publish "${article.title}": ${error}`);
    }
    
    onProgress?.(i + 1, articleIds.length);
  }
  
  return results;
};

export const saveDraftLocally = async (article: Article): Promise<{ success: boolean; message: string }> => {
  // Simulate saving to local storage or staging backend
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real implementation, this would save to a local database or staging API
  console.log('Saving draft locally:', article.title);
  
  return {
    success: true,
    message: `Draft "${article.title}" saved successfully`
  };
};

export const getSyncLogs = async (filters?: {
  user?: string;
  articleId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<SyncLog[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real implementation, this would fetch logs from backend API
  // For now, return demo data that would be filtered server-side
  return [];
};

export const loginWithSalesforce = async (): Promise<{ user: any; accessToken: string }> => {
  // Simulate OAuth2 flow
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In a real implementation, this would:
  // 1. Redirect to Salesforce OAuth endpoint
  // 2. Handle the callback with authorization code
  // 3. Exchange code for access token
  // 4. Fetch user profile
  
  const mockUser = {
    id: 'sf-user-123',
    name: 'John Salesforce',
    email: 'john@company.com',
    accessToken: 'mock-sf-access-token-' + Date.now(),
    role: 'Admin' as const
  };
  
  return {
    user: mockUser,
    accessToken: mockUser.accessToken
  };
};