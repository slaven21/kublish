import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { syncArticleToSalesforce } from '../api/salesforceAPI';
import { Article, Version } from '../types';
import OnboardingTooltip from '../components/OnboardingTooltip';
import { Edit, ArrowLeft, Calendar, User, Globe, Lock, Tag, CheckCircle, Clock, Archive, Eye, CloudCog as CloudCheck, Upload, FolderSync as Sync } from 'lucide-react';

const ArticlePreview: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const [searchParams] = useSearchParams();
  const versionId = searchParams.get('versionId');
  const navigate = useNavigate();
  
  const { articles, getVersionsByArticle, updateArticle, addSyncLog, addVersion, user } = useAppContext();
  const [article, setArticle] = useState<Article | null>(null);
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const versions = article ? getVersionsByArticle(article.id) : [];

  useEffect(() => {
    if (articleId) {
      const foundArticle = articles.find(a => a.id === articleId);
      if (foundArticle) {
        setArticle(foundArticle);
        
        // If versionId is specified, find and display that version
        if (versionId) {
          const version = versions.find(v => v.versionId === versionId);
          setCurrentVersion(version || null);
        } else {
          // Show the latest version
          setCurrentVersion(versions[0] || null);
        }
      }
    }
  }, [articleId, articles, versionId, versions]);

  const renderContent = (content: string) => {
    try {
      // Handle HTML content directly
      return (
        <div 
          className="prose prose-lg max-w-none tiptap-preview"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    } catch (error) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">Unable to display content. Content may be corrupted.</p>
        </div>
      );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Published':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'Draft':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'Archived':
        return <Archive className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 border-emerald-200';
      case 'Draft':
        return 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 border-orange-200';
      case 'Archived':
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const handleViewVersion = (version: Version) => {
    setSelectedVersion(version);
    setShowVersionModal(true);
  };

  const handlePublish = async () => {
    if (!article) return;
    
    setIsPublishing(true);
    try {
      const publishedArticle = {
        ...article,
        lastModified: new Date().toISOString(),
        status: 'published' as const
      };

      // Create version record
      const newVersion = {
        articleId: publishedArticle.id,
        title: publishedArticle.title,
        body: article.body,
        status: 'Published',
        createdBy: user?.name || 'Unknown',
        versionLabel: `v${versions.filter(v => v.status === 'Published').length + 1}.0`,
        notes: 'Published to Salesforce',
        syncedToSalesforce: true,
        syncTimestamp: new Date().toISOString(),
        syncUser: user?.name || 'Unknown',
        salesforceId: `ka0XX0000004C${Math.random().toString(36).substr(2, 3)}`
      };
      
      addVersion(newVersion);

      await syncArticleToSalesforce(publishedArticle);

      // Update article with last synced version
      publishedArticle.lastSyncedVersionId = newVersion.versionId;
      updateArticle(publishedArticle);
      setArticle(publishedArticle);

      addSyncLog({
        articleId: publishedArticle.id,
        articleTitle: publishedArticle.title,
        action: 'publish',
        user: user?.name || 'Unknown',
        status: 'success',
        message: 'Article published and synced to Salesforce'
      });

      alert('Article published successfully!');
    } catch (error) {
      console.error('Publish failed:', error);
      addSyncLog({
        articleId: article.id,
        articleTitle: article.title,
        action: 'publish',
        user: user?.name || 'Unknown',
        status: 'error',
        message: `Failed to publish: ${error}`
      });
      alert('Failed to publish article. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSyncToSalesforce = async () => {
    if (!article) return;
    
    setIsSyncing(true);
    try {
      await syncArticleToSalesforce(article);

      const updatedArticle = {
        ...article,
        lastModified: new Date().toISOString(),
        lastSyncedVersionId: `v${Date.now()}`
      };

      // Create version record
      const newVersion = {
        articleId: updatedArticle.id,
        title: updatedArticle.title,
        body: article.body,
        status: 'Draft',
        createdBy: user?.name || 'Unknown',
        versionLabel: `v${versions.length + 1}.0`,
        notes: 'Synced to Salesforce',
        syncedToSalesforce: true,
        syncTimestamp: new Date().toISOString(),
        syncUser: user?.name || 'Unknown',
        salesforceId: `ka0XX0000004C${Math.random().toString(36).substr(2, 3)}`
      };
      
      addVersion(newVersion);
      updateArticle(updatedArticle);
      setArticle(updatedArticle);

      addSyncLog({
        articleId: updatedArticle.id,
        articleTitle: updatedArticle.title,
        action: 'sync',
        user: user?.name || 'Unknown',
        status: 'success',
        message: 'Article synced to Salesforce successfully'
      });

      alert('Article synced to Salesforce successfully!');
    } catch (error) {
      console.error('Sync failed:', error);
      addSyncLog({
        articleId: article.id,
        articleTitle: article.title,
        action: 'sync',
        user: user?.name || 'Unknown',
        status: 'error',
        message: `Failed to sync: ${error}`
      });
      alert('Failed to sync to Salesforce. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Archive className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h2>
          <p className="text-gray-600 mb-6">The article you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const displayTitle = currentVersion?.title || article.title;
  const displayContent = currentVersion?.body || article.body;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Article Preview
            </h1>
            {currentVersion && versionId && (
              <p className="text-gray-600 mt-1">
                Viewing {currentVersion.versionLabel} • {formatDate(currentVersion.createdAt)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSyncToSalesforce}
            disabled={isSyncing}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-blue-400 disabled:to-indigo-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg flex items-center space-x-2"
          >
            <Sync className="w-4 h-4" />
            <span>{isSyncing ? 'Syncing...' : 'Sync to Salesforce'}</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-emerald-400 disabled:to-cyan-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
          </button>

          <Link
            to={`/editor/${article.id}`}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Article Content */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden">
            <div className="p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-8 leading-tight">
                {displayTitle}
              </h1>
              
              <div className="prose prose-lg max-w-none">
                {displayContent ? renderContent(displayContent) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Archive className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Available</h3>
                    <p className="text-gray-500">This article doesn't have any content yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Article Metadata */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Article Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <div className="flex items-center space-x-2">
                  {article.visibility === 'public' ? (
                    <Globe className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-sm text-gray-600 capitalize">{article.visibility}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Categories</label>
                <div className="space-y-1">
                  {article.dataCategories && article.dataCategories.length > 0 ? (
                    article.dataCategories.map((categoryId, index) => (
                      <span
                        key={`${categoryId}-${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200 mr-2 mb-1"
                      >
                        {getCategoryDisplayName(categoryId)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No data categories assigned</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${
                  article.status === 'published'
                    ? 'bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 border-emerald-200'
                    : 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 border-orange-200'
                }`}>
                  {article.status === 'published' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  <span className="capitalize">{article.status}</span>
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-600">{article.owner}</span>
                </div>
              </div>

              {article.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200"
                      >
                        <Tag className="w-3 h-3" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Modified</label>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(article.lastModified)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Version History */}
      <div className="mt-12">
        <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
            <h2 className="text-xl font-semibold text-gray-900">Version History</h2>
            <p className="text-sm text-gray-600 mt-1">{versions.length} versions available</p>
          </div>

          <div className="p-6">
            {versions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No versions yet</h4>
                <p className="text-gray-500">This article doesn't have any saved versions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <div
                    key={version.versionId}
                    className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                      currentVersion?.versionId === version.versionId
                        ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 ring-2 ring-purple-200'
                        : 'bg-white/80 border-gray-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {version.versionLabel || `Version ${versions.length - index}`}
                          </h4>
                          
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(version.status)}`}>
                            {getStatusIcon(version.status)}
                            <span>{version.status}</span>
                          </span>

                          {version.syncedToSalesforce && (
                            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 border border-emerald-200">
                              <CloudCheck className="w-3 h-3" />
                              <span>Synced</span>
                            </span>
                          )}

                          {currentVersion?.versionId === version.versionId && (
                            <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200 rounded-full">
                              Current
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{version.createdBy}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(version.createdAt)}</span>
                          </div>
                        </div>

                        {version.notes && (
                          <p className="text-xs text-gray-500 italic">{version.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {currentVersion?.versionId !== version.versionId && (
                          <Link
                            to={`/article/${article.id}/preview?versionId=${version.versionId}`}
                            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-sm"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version Preview Modal */}
      {showVersionModal && selectedVersion && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40" onClick={() => setShowVersionModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6 relative z-50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {selectedVersion.versionLabel}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created by {selectedVersion.createdBy} • {formatDate(selectedVersion.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setShowVersionModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  ×
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">{selectedVersion.title}</h1>
                <div className="prose max-w-none">
                  {renderContent(selectedVersion.body)}
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Link
                  to={`/article/${article.id}/preview?versionId=${selectedVersion.versionId}`}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all duration-200"
                  onClick={() => setShowVersionModal(false)}
                >
                  View Full Version
                </Link>
                <button
                  onClick={() => setShowVersionModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticlePreview;