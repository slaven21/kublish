import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { canPublishArticles } from '../utils/permissions';
import { bulkPublishArticles } from '../api/salesforceAPI';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar
} from 'lucide-react';

const BulkPublish: React.FC = () => {
  const { articles, selectedArticles, setSelectedArticles, updateArticle, addSyncLog, user } = useAppContext();
  const navigate = useNavigate();
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [publishProgress, setPublishProgress] = useState({ completed: 0, total: 0 });
  const [publishResults, setPublishResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const selectedArticlesList = articles.filter(article => selectedArticles.includes(article.id));

  useEffect(() => {
    if (selectedArticles.length === 0 || !canPublishArticles(user)) {
      navigate('/dashboard');
    }
  }, [selectedArticles.length, user, navigate]);

  const handleConfirmPublish = async () => {
    setShowConfirmModal(false);
    setIsPublishing(true);
    setPublishProgress({ completed: 0, total: selectedArticles.length });

    try {
      const results = await bulkPublishArticles(
        selectedArticles,
        articles,
        (completed, total) => {
          setPublishProgress({ completed, total });
        }
      );

      setPublishResults(results);

      // Update successful articles to published status
      const successfulArticles = selectedArticlesList.slice(0, results.success);
      successfulArticles.forEach(article => {
        const updatedArticle = {
          ...article,
          status: 'published' as const,
          lastModified: new Date().toISOString()
        };
        updateArticle(updatedArticle);

        addSyncLog({
          articleId: article.id,
          articleTitle: article.title,
          action: 'publish',
          user: user?.name || 'Unknown',
          status: 'success',
          message: 'Article published via bulk operation'
        });
      });

      // Log failed articles
      results.errors.forEach((error, index) => {
        const failedArticle = selectedArticlesList[results.success + index];
        if (failedArticle) {
          addSyncLog({
            articleId: failedArticle.id,
            articleTitle: failedArticle.title,
            action: 'publish',
            user: user?.name || 'Unknown',
            status: 'error',
            message: error
          });
        }
      });

    } catch (error) {
      console.error('Bulk publish failed:', error);
      setPublishResults({
        success: 0,
        failed: selectedArticles.length,
        errors: [`Bulk publish operation failed: ${error}`]
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleComplete = () => {
    setSelectedArticles([]);
    navigate('/dashboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (publishResults) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Bulk Publish Complete
          </h1>
          <p className="text-gray-600">Here's a summary of the publishing operation</p>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-8 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">{publishResults.success}</div>
              <div className="text-sm text-gray-600">Successfully Published</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-red-600">{publishResults.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{selectedArticles.length}</div>
              <div className="text-sm text-gray-600">Total Articles</div>
            </div>
          </div>

          {publishResults.errors.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Errors</h3>
              <div className="space-y-2">
                {publishResults.errors.map((error, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <span className="text-sm text-gray-500">
                      {article.dataCategories?.length ? `${article.dataCategories.length} data categories` : 'No data categories'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleComplete}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              Bulk Publish Articles
            </h1>
            <p className="text-gray-600 mt-1">
              Review and publish {selectedArticles.length} selected articles to Salesforce
            </p>
          </div>
        </div>

        {!isPublishing && (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Confirm Publish All</span>
          </button>
        )}
      </div>

      {/* Publishing Progress */}
      {isPublishing && (
        <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-8 shadow-lg mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Publishing Articles...</h2>
            <p className="text-gray-600 mb-6">
              Progress: {publishProgress.completed} of {publishProgress.total} articles
            </p>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(publishProgress.completed / publishProgress.total) * 100}%` }}
              />
            </div>
            
            <div className="text-sm text-gray-500">
              {publishProgress.completed === publishProgress.total
                ? 'Finalizing...'
                : 'Please wait while we publish your articles to Salesforce'
              }
            </div>
          </div>
        </div>
      )}

      {/* Articles List */}
      {!isPublishing && (
        <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <h2 className="text-lg font-semibold text-gray-900">Articles to Publish</h2>
            <p className="text-sm text-gray-600 mt-1">Review the articles below before publishing</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedArticlesList.map((article) => (
                  <tr key={article.id} className="hover:bg-white/40 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{article.title}</span>
                        <span className="text-sm text-gray-500">{article.category}</span>
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
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(article.lastModified)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmPublish}
        title="Confirm Bulk Publish"
        message={`Are you sure you want to publish ${selectedArticles.length} articles to Salesforce? This action will make them available in your Salesforce Knowledge base.`}
        confirmText="Confirm Publish"
        type="warning"
      />
    </div>
  );
};

export default BulkPublish;