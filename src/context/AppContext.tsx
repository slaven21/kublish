import React, { createContext, useContext, useState, useEffect } from 'react';
import { Article, SyncLog, User, Version } from '../types';

interface AppContextType {
  user: User | null;
  articles: Article[];
  syncLogs: SyncLog[];
  versions: Version[];
  selectedArticles: string[];
  setUser: (user: User | null) => void;
  setArticles: (articles: Article[]) => void;
  addSyncLog: (log: Omit<SyncLog, 'id' | 'timestamp'>) => void;
  addVersion: (version: Omit<Version, 'versionId' | 'createdAt'>) => void;
  updateVersion: (version: Version) => void;
  getVersionsByArticle: (articleId: string) => Version[];
  getLastSyncedVersion: (articleId: string) => Version | null;
  setSelectedArticles: (ids: string[]) => void;
  updateArticle: (article: Article) => void;
  addArticle: (article: Article) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);

  useEffect(() => {
    // Load user from localStorage
    const savedUser = localStorage.getItem('kublish_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      // Add default role if not present (for backward compatibility)
      if (!userData.role) {
        userData.role = 'Admin';
      }
      setUser(userData);
    }

    // Load demo data
    const demoArticles: Article[] = [
      {
        id: '1',
        title: 'Getting Started with Salesforce Integration',
        body: 'This article covers the basics of integrating with Salesforce APIs...',
        tags: ['salesforce', 'integration', 'api'],
        visibility: 'public',
        status: 'published',
        owner: 'John Doe',
        lastModified: '2024-01-15T10:30:00Z',
        createdAt: '2024-01-10T09:00:00Z',
        dataCategories: ['cat-getting-started', 'cat-api']
      },
      {
        id: '2',
        title: 'Best Practices for Knowledge Management',
        body: 'Learn how to effectively organize and maintain your knowledge base...',
        tags: ['knowledge', 'management', 'organization'],
        visibility: 'internal',
        status: 'draft',
        owner: 'Jane Smith',
        lastModified: '2024-01-14T14:20:00Z',
        createdAt: '2024-01-12T11:30:00Z',
        dataCategories: ['cat-advanced', 'cat-customization']
      },
      {
        id: '3',
        title: 'Troubleshooting Common Issues',
        body: 'A comprehensive guide to resolving frequently encountered problems...',
        tags: ['troubleshooting', 'support', 'faq'],
        visibility: 'public',
        status: 'published',
        owner: 'Mike Johnson',
        lastModified: '2024-01-13T16:45:00Z',
        createdAt: '2024-01-08T13:15:00Z',
        dataCategories: ['cat-troubleshooting', 'cat-common-issues']
      }
    ];
    setArticles(demoArticles);

    // Load demo sync logs
    const demoLogs: SyncLog[] = [
      {
        id: '1',
        articleId: '1',
        articleTitle: 'Getting Started with Salesforce Integration',
        action: 'publish',
        user: 'John Doe',
        timestamp: '2024-01-15T10:30:00Z',
        status: 'success',
        message: 'Article successfully published to Salesforce'
      },
      {
        id: '2',
        articleId: '2',
        articleTitle: 'Best Practices for Knowledge Management',
        action: 'draft_save',
        user: 'Jane Smith',
        timestamp: '2024-01-14T14:20:00Z',
        status: 'success',
        message: 'Draft saved locally'
      },
      {
        id: '3',
        articleId: '3',
        articleTitle: 'Troubleshooting Common Issues',
        action: 'sync',
        user: 'Mike Johnson',
        timestamp: '2024-01-13T16:45:00Z',
        status: 'error',
        message: 'Failed to sync: Network timeout'
      }
    ];
    setSyncLogs(demoLogs);

    // Load demo versions
    const demoVersions: Version[] = [
      {
        versionId: 'v1-1',
        articleId: '1',
        title: 'Getting Started with Salesforce Integration',
        body: '{"blocks":[{"type":"header","data":{"text":"Getting Started with Salesforce Integration","level":1}},{"type":"paragraph","data":{"text":"This article covers the basics of integrating with Salesforce APIs..."}}]}',
        status: 'Published',
        createdBy: 'John Doe',
        createdAt: '2024-01-15T10:30:00Z',
        versionLabel: 'v1.0',
        notes: 'Initial publication',
        syncedToSalesforce: true,
        syncTimestamp: '2024-01-15T10:35:00Z',
        syncUser: 'John Doe',
        salesforceId: 'ka0XX0000004C92'
      },
      {
        versionId: 'v1-2',
        articleId: '1',
        title: 'Getting Started with Salesforce Integration - Updated',
        body: '{"blocks":[{"type":"header","data":{"text":"Getting Started with Salesforce Integration - Updated","level":1}},{"type":"paragraph","data":{"text":"This comprehensive article covers the basics of integrating with Salesforce APIs and best practices..."}}]}',
        status: 'Draft',
        createdBy: 'John Doe',
        createdAt: '2024-01-16T14:20:00Z',
        versionLabel: 'v1.1',
        notes: 'Added best practices section',
        syncedToSalesforce: false
      },
      {
        versionId: 'v2-1',
        articleId: '2',
        title: 'Best Practices for Knowledge Management',
        body: '{"blocks":[{"type":"header","data":{"text":"Best Practices for Knowledge Management","level":1}},{"type":"paragraph","data":{"text":"Learn how to effectively organize and maintain your knowledge base..."}}]}',
        status: 'Draft',
        createdBy: 'Jane Smith',
        createdAt: '2024-01-14T14:20:00Z',
        versionLabel: 'v1.0',
        notes: 'Initial draft',
        syncedToSalesforce: false
      }
    ];
    setVersions(demoVersions);
  }, []);

  const addSyncLog = (log: Omit<SyncLog, 'id' | 'timestamp'>) => {
    const newLog: SyncLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    setSyncLogs(prev => [newLog, ...prev]);
  };

  const addVersion = (version: Omit<Version, 'versionId' | 'createdAt'>) => {
    const newVersion: Version = {
      ...version,
      versionId: `v${Date.now()}`,
      createdAt: new Date().toISOString(),
      syncedToSalesforce: false
    };
    setVersions(prev => [newVersion, ...prev]);
  };

  const updateVersion = (updatedVersion: Version) => {
    setVersions(prev => prev.map(version => 
      version.versionId === updatedVersion.versionId ? updatedVersion : version
    ));
  };

  const getVersionsByArticle = (articleId: string): Version[] => {
    return versions
      .filter(version => version.articleId === articleId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getLastSyncedVersion = (articleId: string): Version | null => {
    const articleVersions = getVersionsByArticle(articleId);
    return articleVersions.find(version => version.syncedToSalesforce) || null;
  };

  const updateArticle = (updatedArticle: Article) => {
    setArticles(prev => prev.map(article => 
      article.id === updatedArticle.id ? updatedArticle : article
    ));
  };

  const addArticle = (newArticle: Article) => {
    setArticles(prev => [newArticle, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      user,
      articles,
      syncLogs,
      versions,
      selectedArticles,
      setUser,
      setArticles,
      addSyncLog,
      addVersion,
      updateVersion,
      getVersionsByArticle,
      getLastSyncedVersion,
      setSelectedArticles,
      updateArticle,
      addArticle
    }}>
      {children}
    </AppContext.Provider>
  );
};