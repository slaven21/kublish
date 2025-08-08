import React, { useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { canCreateArticles, canViewDrafts, isOwnerOrAdmin } from '../utils/permissions';
import OnboardingTooltip from '../components/OnboardingTooltip';
import CategoryTypeahead from '../components/CategoryTypeahead';
import Portal from '../components/Portal';
import { 
  Search, 
  Edit, 
  Upload, 
  Plus, 
  Calendar,
  User,
  CheckCircle,
  Clock,
  MoreVertical,
  Trash2,
  Eye
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { articles, selectedArticles, setSelectedArticles, getLastSyncedVersion, user } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    // Get all data categories from articles
    const allDataCategories = articles.flatMap(article => article.dataCategories || []);
    const uniqueCategories = [...new Set(allDataCategories)];
    return uniqueCategories.map(cat => ({
      value: cat,
      label: cat, // In production, this would be resolved to category label
      count: articles.filter(a => a.dataCategories?.includes(cat)).length
    }));
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      // Role-based filtering
      if (user?.role === 'Viewer' && article.status !== 'published') {
        return false;
      }
      if (user?.role === 'Editor' && article.status === 'draft' && !isOwnerOrAdmin(user, article.owner)) {
        return false;
      }
      
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || article.dataCategories?.includes(categoryFilter);
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [articles, searchTerm, statusFilter, categoryFilter, user]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedArticles(filteredArticles.map(article => article.id));
    } else {
      setSelectedArticles([]);
    }
  };

  const handleSelectArticle = (articleId: string, checked: boolean) => {
    if (checked) {
      setSelectedArticles([...selectedArticles, articleId]);
    } else {
      setSelectedArticles(selectedArticles.filter(id => id !== articleId));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Knowledge Articles
            </h1>
            <p className="text-gray-600 mt-1">Manage and sync your Salesforce knowledge base</p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            {selectedArticles.length > 0 && (
              <Link
                to="/bulk-publish"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Publish ({selectedArticles.length})</span>
              </Link>
            )}
            
            <Link
              to="/import-export"
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import/Export</span>
            </Link>

            {canCreateArticles(user) && (
              <button
                onClick={() => navigate('/editor/new')}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Article</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search articles by title, owner, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              />
            </div>
          
            <div className="flex items-center space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              
              <CategoryTypeahead
                value={categoryFilter || ''}
                onChange={(value) => setCategoryFilter(value || 'all')}
                options={[
                  ...categories
                ]}
                placeholder="Search data categories..."
                className="w-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={filteredArticles.length > 0 && selectedArticles.length === filteredArticles.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Article Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Last Modified
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Last Synced
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredArticles.map((article) => {
                const lastSynced = getLastSyncedVersion(article.id);
                return (
                <tr 
                  key={article.id} 
                  className="hover:bg-white/40 transition-colors duration-150 group"
                  onMouseLeave={() => setShowActionsMenu(null)}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedArticles.includes(article.id)}
                      onChange={(e) => handleSelectArticle(article.id, e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4 relative">
                    <div className="flex flex-col">
                      <Link
                        to={`/article/${article.id}/preview`}
                        className="font-medium text-gray-900 hover:text-purple-600 transition-colors duration-200"
                      >
                        {article.title}
                      </Link>
                      <span className="text-sm text-gray-500">
                        {article.dataCategories?.length ? `${article.dataCategories.length} data categories` : 'No data categories'}
                      </span>
                    </div>
                    
                    {/* Actions Menu */}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(article.lastModified)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-gray-600">{article.owner}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4">
                    {lastSynced ? (
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            <span>Synced</span>
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {lastSynced.versionLabel} • {formatDate(lastSynced.syncTimestamp || lastSynced.createdAt)}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200">
                        <Clock className="w-3 h-3" />
                        <span>Not Synced</span>
                      </span>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or create a new article.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;