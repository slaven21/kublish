import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Article } from '../types';
import { 
  Download, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Eye,
  AlertCircle
} from 'lucide-react';

interface ImportRow extends Omit<Article, 'lastModified' | 'createdAt'> {
  isValid: boolean;
  errors: string[];
  isExisting: boolean;
  isPublished?: boolean;
}

const ImportExport: React.FC = () => {
  const { articles, user, addArticle, updateArticle, addSyncLog } = useAppContext();
  const [dragActive, setDragActive] = useState(false);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const exportToCSV = () => {
    const headers = ['id', 'title', 'body', 'category', 'tags', 'visibility'];
    const csvContent = [
      headers.join(','),
      ...articles.map(article => [
        article.id,
        `"${article.title.replace(/"/g, '""')}"`,
        `"${article.body.replace(/"/g, '""')}"`,
        article.category,
        `"${article.tags.join(';')}"`,
        article.visibility
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kublish-articles-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('success', `${articles.length} articles exported successfully`);
  };

  const validateRow = (row: any, index: number): ImportRow => {
    const errors: string[] = [];
    const existingArticle = articles.find(a => a.id === row.id);
    
    // Required field validation
    if (!row.id?.trim()) errors.push('ID is required');
    if (!row.title?.trim()) errors.push('Title is required');
    if (!row.body?.trim()) errors.push('Body is required');
    if (!row.category?.trim()) errors.push('Category is required');
    if (!row.visibility?.trim()) errors.push('Visibility is required');
    
    // Visibility validation
    if (row.visibility && !['internal', 'public'].includes(row.visibility)) {
      errors.push('Visibility must be "internal" or "public"');
    }

    // Check if trying to overwrite published article
    if (existingArticle?.status === 'published') {
      errors.push('Cannot overwrite published articles');
    }

    // Always assign to importing user
    const owner = user?.name || 'Unknown';

    return {
      id: row.id || '',
      title: row.title || '',
      body: row.body || '',
      category: row.category || '',
      tags: row.tags ? row.tags.split(';').filter((tag: string) => tag.trim()) : [],
      visibility: row.visibility as 'internal' | 'public' || 'internal',
      status: 'draft' as const,
      owner,
      isValid: errors.length === 0,
      errors,
      isExisting: !!existingArticle,
      isPublished: existingArticle?.status === 'published'
    };
  };

  const parseCSV = (csvText: string): ImportRow[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const expectedHeaders = ['id', 'title', 'body', 'category', 'tags', 'visibility'];
    
    // Validate headers
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      showNotification('error', `Missing required headers: ${missingHeaders.join(', ')}`);
      return [];
    }

    return lines.slice(1).map((line, index) => {
      // Simple CSV parsing (handles quoted fields)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: any = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });

      return validateRow(row, index);
    });
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      showNotification('error', 'Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const parsedData = parseCSV(csvText);
      setImportData(parsedData);
      setShowPreview(true);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setShowConfirmModal(false);
    
    try {
      let newCount = 0;
      let updateCount = 0;
      
      for (const row of importData.filter(r => r.isValid)) {
        const articleData: Article = {
          id: row.id,
          title: row.title,
          body: row.body,
          category: row.category,
          tags: row.tags,
          visibility: row.visibility,
          status: 'draft',
          owner: row.owner,
          lastModified: new Date().toISOString(),
          createdAt: row.isExisting ? articles.find(a => a.id === row.id)?.createdAt || new Date().toISOString() : new Date().toISOString()
        };

        if (row.isExisting) {
          updateArticle(articleData);
          updateCount++;
          
          addSyncLog({
            articleId: articleData.id,
            articleTitle: articleData.title,
            action: 'draft_save',
            user: user?.name || 'Unknown',
            status: 'success',
            message: 'Article updated via CSV import'
          });
        } else {
          addArticle(articleData);
          newCount++;
          
          addSyncLog({
            articleId: articleData.id,
            articleTitle: articleData.title,
            action: 'draft_save',
            user: user?.name || 'Unknown',
            status: 'success',
            message: 'Article created via CSV import'
          });
        }
      }

      const total = newCount + updateCount;
      showNotification('success', `${total} articles imported successfully (${newCount} new, ${updateCount} updated)`);
      
      // Reset state
      setImportData([]);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      showNotification('error', 'Import failed. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const validRows = importData.filter(row => row.isValid);
  const invalidRows = importData.filter(row => !row.isValid);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Import & Export Articles
        </h1>
        <p className="text-gray-600 mt-1">Manage your knowledge base with CSV import and export</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center space-x-3 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        {/* Export Section */}
        <div className={`bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg transition-all duration-300 ${
          showPreview ? 'p-4' : 'p-6'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`font-semibold text-gray-900 ${showPreview ? 'text-lg' : 'text-xl'}`}>Export Articles</h2>
              {!showPreview && <p className="text-sm text-gray-600">Download all articles as CSV</p>}
            </div>
          </div>

          {!showPreview && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Total Articles</span>
                  <span className="text-lg font-bold text-gray-900">{articles.length}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Includes: ID, Title, Body, Category, Tags, Visibility
                </p>
              </div>
            </div>
          )}

          <div className={showPreview ? 'mt-2' : 'mt-4'}>
            <button
              onClick={exportToCSV}
              className={`w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 rounded-lg ${
                showPreview ? 'px-4 py-2 text-sm' : 'px-6 py-3'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>{showPreview ? 'Export CSV' : 'Export All Articles to CSV'}</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className={`bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg transition-all duration-300 ${
          showPreview ? 'p-4' : 'p-6'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`font-semibold text-gray-900 ${showPreview ? 'text-lg' : 'text-xl'}`}>Import Articles</h2>
              {!showPreview && <p className="text-sm text-gray-600">Upload CSV to add or update articles</p>}
            </div>
          </div>

          <div className={showPreview ? 'mt-2' : 'space-y-4'}>
            {!showPreview && (
              <>
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    dragActive 
                      ? 'border-purple-400 bg-purple-50' 
                      : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                  onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Drag and drop your CSV file here</p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Choose File
                  </button>
                </div>

                {/* Requirements */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">CSV Requirements:</h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Headers: id, title, body, category, tags, visibility</li>
                    <li>• All fields are required</li>
                    <li>• Visibility must be "internal" or "public"</li>
                    <li>• Cannot overwrite published articles</li>
                    <li>• Articles will be assigned to you as owner</li>
                  </ul>
                </div>
              </>
            )}

            {showPreview && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Choose New File</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Import Preview */}
      {showPreview && (
        <div className="mt-8 bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Import Preview</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {validRows.length} valid, {invalidRows.length} invalid rows
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {invalidRows.length === 0 && (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import Now</span>
                  </button>
                )}
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50/50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {importData.map((row, index) => (
                  <tr 
                    key={index} 
                    className={`${
                      row.isValid ? 'hover:bg-white/40' : 'bg-red-50 border-l-4 border-red-400'
                    } transition-colors duration-150`}
                  >
                    <td className="px-4 py-3">
                      {row.isValid ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <div className="text-xs text-red-600">
                            {row.errors.join(', ')}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{row.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        row.isExisting 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {row.isExisting ? 'Update' : 'Create'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invalidRows.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {invalidRows.length} rows have errors. Please fix them before importing.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm Import Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40" />
            
            <div className="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative z-50">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Upload className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Confirm Import
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {validRows.length} articles will be added or updated as drafts. Proceed?
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-base font-medium text-white hover:from-emerald-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isImporting ? 'Importing...' : 'Import Now'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isImporting}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportExport;