import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { canCreateArticles, canEditOwnArticles, isOwnerOrAdmin } from '../utils/permissions';
import { saveDraftLocally, syncArticleToSalesforce } from '../api/salesforceAPI';
import { Article } from '../types';
import { validateCategorySelections } from '../utils/articleUtils';
import OnboardingTooltip from '../components/OnboardingTooltip';
import { Save, Upload, FolderSync as Sync, ArrowLeft, Tag, Eye, Globe, Lock, CheckCircle, Clock, History, Edit } from 'lucide-react';
import VersionHistory from '../components/VersionHistory';
import CategorySummary from '../components/CategorySummary';
import CategoryEditModal from '../components/CategoryEditModal';
import TiptapEditor from '../components/TiptapEditor';

const Editor: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const { articles, updateArticle, addArticle, addSyncLog, addVersion, updateVersion, getVersionsByArticle, getLastSyncedVersion, user } = useAppContext();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [article, setArticle] = useState<Article>({
    id: '',
    title: '',
    body: '<p>Start writing your article content...</p>',
    tags: [],
    visibility: 'internal',
    status: 'draft',
    owner: user?.name || 'Unknown',
    lastModified: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    dataCategories: []
  });

  const [newTag, setNewTag] = useState('');
  const versions = getVersionsByArticle(article.id);
  const lastSyncedVersion = getLastSyncedVersion(article.id);

  useEffect(() => {
    if (articleId && articleId !== 'new') {
      const existingArticle = articles.find(a => a.id === articleId);
      if (existingArticle && isOwnerOrAdmin(user, existingArticle.owner)) {
        setArticle(existingArticle);
      } else if (existingArticle) {
        // User doesn't have permission to edit this article
        navigate('/dashboard');
        return;
      }
    } else if (canCreateArticles(user)) {
      setArticle(prev => ({
        ...prev,
        id: `article-${Date.now()}`,
        owner: user?.name || 'Unknown'
      }));
    } else {
      // User doesn't have permission to create articles
      navigate('/dashboard');
      return;
    }
  }, [articleId, articles, user, navigate]);

  const handleEditorUpdate = (html: string) => {
    setArticle(prev => ({ ...prev, body: html }));
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      const articleToSave = { ...article };
      await saveDraftLocally(articleToSave);
      
      const updatedArticle = {
        ...articleToSave,
        lastModified: new Date().toISOString(),
        status: 'draft' as const
      };

      // Create version record
      addVersion({
        articleId: updatedArticle.id,
        title: updatedArticle.title,
        body: updatedArticle.body,
        status: 'Draft',
        createdBy: user?.name || 'Unknown',
        versionLabel: `v${versions.length + 1}.0`,
        notes: 'Draft saved'
      });

      if (articleId === 'new') {
        addArticle(updatedArticle);
        navigate(`/editor/${updatedArticle.id}`);
      } else {
        updateArticle(updatedArticle);
      }
      
      setArticle(updatedArticle);

      addSyncLog({
        articleId: updatedArticle.id,
        articleTitle: updatedArticle.title,
        action: 'draft_save',
        user: user?.name || 'Unknown',
        status: 'success',
        message: 'Draft saved successfully'
      });

      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreVersion = async (version: any) => {
    try {
      // Update article state
      const restoredArticle = {
        ...article,
        title: version.title,
        body: version.body,
        lastModified: new Date().toISOString(),
        status: 'draft' as const
      };

      setArticle(restoredArticle);

      // Create new version record for the restoration
      addVersion({
        articleId: restoredArticle.id,
        title: restoredArticle.title,
        body: version.body,
        status: 'Draft',
        createdBy: user?.name || 'Unknown',
        versionLabel: `v${versions.length + 1}.0`,
        notes: `Restored from ${version.versionLabel}`
      });

      setShowVersionHistory(false);
      alert('Version restored successfully!');
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Failed to restore version. Please try again.');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !article.tags.includes(newTag.trim())) {
      setArticle(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setArticle(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const categoryOptions = ['Documentation', 'Tutorial', 'Best Practices', 'Support', 'FAQ', 'Troubleshooting'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {articleId === 'new' ? 'Create Article' : 'Edit Article'}
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                article.status === 'published'
                  ? 'bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 border border-emerald-200'
                  : 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 border border-orange-200'
              }`}>
                {article.status === 'published' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                <span className="capitalize">{article.status}</span>
              </span>
              <span className="text-sm text-gray-500">
                Last modified: {new Date(article.lastModified).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <Link
            to={`/article/${article.id}/preview`}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Title */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Article Title
            </label>
            <input
              type="text"
              value={article.title}
              onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter article title..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-lg font-medium"
            />
          </div>

          {/* Body */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Article Content
            </label>
            <TiptapEditor
              content={article.body}
              onUpdate={handleEditorUpdate}
              placeholder="Start writing your article content..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Tag className="w-4 h-4 text-gray-500" />
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm"
              />
              <button
                onClick={addTag}
                className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
              >
                <Tag className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-purple-500 hover:text-purple-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Visibility
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="internal"
                  checked={article.visibility === 'internal'}
                  onChange={(e) => setArticle(prev => ({ ...prev, visibility: e.target.value as 'internal' | 'public' }))}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Internal</span>
                </div>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={article.visibility === 'public'}
                  onChange={(e) => setArticle(prev => ({ ...prev, visibility: e.target.value as 'internal' | 'public' }))}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Public</span>
                </div>
              </label>
            </div>
          </div>

        </div>
      </div>

      {/* Version History */}
      <div className="mt-8">
        <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Data Categories</h3>
                <p className="text-sm text-gray-600 mt-1">Assign categories to control visibility and routing</p>
              </div>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 mt-3 sm:mt-0"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Categories</span>
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <CategorySummary
                  articleId={article.id}
                  onEditClick={() => setShowCategoryModal(true)}
                />
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Category Guidelines</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Select categories that best describe your article's content and target audience</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Required categories must be selected before publishing to Salesforce</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Categories control article visibility and routing in your knowledge base</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Version History */}
      <div className="mt-8">
        <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
                <p className="text-sm text-gray-600 mt-1">Track changes and restore previous versions</p>
              </div>
              <button
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 mt-3 sm:mt-0"
              >
                <History className="w-4 h-4" />
                <span>{showVersionHistory ? 'Hide' : 'Show'} History</span>
              </button>
            </div>
          </div>
          {showVersionHistory && (
            <div className="p-6">
              <VersionHistory
                versions={versions}
                onRestore={handleRestoreVersion}
                lastSyncedVersion={lastSyncedVersion}
              />
            </div>
          )}
        </div>
      </div>

      {/* Category Edit Modal */}
      <CategoryEditModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        articleId={article.id}
        onSave={(selections) => {
          // Update local state or trigger refresh
          console.log('Categories saved:', selections);
        }}
      />

    </div>
  );
};

export default Editor;