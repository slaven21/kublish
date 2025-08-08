export interface Article {
  id: string;
  title: string;
  body: string;
  tags: string[];
  visibility: 'internal' | 'public';
  status: 'draft' | 'published';
  owner: string;
  lastModified: string;
  createdAt: string;
  lastSyncedVersionId?: string;
  dataCategories?: string[]; // Array of data category IDs
}

export interface SyncLog {
  id: string;
  articleId: string;
  articleTitle: string;
  action: 'sync' | 'publish' | 'draft_save';
  user: string;
  timestamp: string;
  status: 'success' | 'error';
  message: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  accessToken: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

export interface Version {
  versionId: string;
  articleId: string;
  title: string;
  body: string;
  status: 'Draft' | 'Published' | 'Archived';
  createdBy: string;
  createdAt: string;
  versionLabel?: string;
  notes?: string;
  syncedToSalesforce: boolean;
  syncTimestamp?: string;
  syncUser?: string;
  salesforceId?: string;
}
export interface DataCategoryGroup {
  id: string;
  name: string;
  label: string;
  description?: string;
  isActive: boolean;
  lastSyncedAt?: string;
  categories: DataCategory[];
}

export interface DataCategory {
  id: string;
  name: string;
  label: string;
  parentCategoryId?: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  children?: DataCategory[];
}

export interface ArticleTypeMapping {
  articleType: string;
  dataCategoryObjectName: string;
  isActive: boolean;
  lastSyncedAt?: string;
}

export interface CategorySyncStatus {
  isConfigured: boolean;
  articleTypeCount: number;
  categoryGroupCount: number;
  totalCategoryCount: number;
  lastSyncedAt?: string;
  needsSync: boolean;
}
