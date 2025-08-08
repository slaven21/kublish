import React, { useState } from 'react';
import { Version } from '../types';
import { Clock, User, CheckCircle, FileText, Archive, RotateCcw, Eye, X, Calendar, CloudCog as CloudCheck, Filter, ChevronDown } from 'lucide-react';

interface VersionHistoryProps {
  versions: Version[];
  currentArticleId: string;
  lastSyncedVersion: Version | null;
  onRestore: (version: Version) => void;
  onClose: () => void;
  previewLabel?: string;
  restoreLabel?: string;
}

interface VersionPreviewModalProps {
  version: Version;
  onClose: () => void;
}

const VersionPreviewModal: React.FC<VersionPreviewModalProps> = ({ version, onClose }) => {
  const renderContent = () => {
    try {
      const data = JSON.parse(version.body);
      return data.blocks?.map((block: any, index: number) => {
        switch (block.type) {
          case 'header':
            const HeaderTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
            return (
              <HeaderTag 
                key={index} 
                className={`font-bold mb-4 ${
                  block.data.level === 1 ? 'text-2xl' :
                  block.data.level === 2 ? 'text-xl' :
                  block.data.level === 3 ? 'text-lg' : 'text-base'
                }`}
              >
                {block.data.text}
              </HeaderTag>
            );
          case 'paragraph':
            return (
              <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                {block.data.text}
              </p>
            );
          case 'list':
            const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
            return (
              <ListTag key={index} className={`mb-4 ${block.data.style === 'ordered' ? 'list-decimal' : 'list-disc'} list-inside`}>
                {block.data.items.map((item: string, itemIndex: number) => (
                  <li key={itemIndex} className="mb-1 text-gray-700">{item}</li>
                ))}
              </ListTag>
            );
          case 'quote':
            return (
              <blockquote key={index} className="border-l-4 border-purple-500 pl-4 italic mb-4 text-gray-600">
                {block.data.text}
                {block.data.caption && (
                  <cite className="block mt-2 text-sm text-gray-500">— {block.data.caption}</cite>
                )}
              </blockquote>
            );
          case 'code':
            return (
              <pre key={index} className="bg-gray-100 rounded-lg p-4 mb-4 overflow-x-auto">
                <code className="text-sm font-mono">{block.data.code}</code>
              </pre>
            );
          default:
            return (
              <div key={index} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Unsupported block type: {block.type}</span>
              </div>
            );
        }
      });
    } catch (error) {
      return <p className="text-gray-500">Unable to preview content</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6 relative z-50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Version Preview
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {version.versionLabel} • Created by {version.createdBy} • {new Date(version.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">{version.title}</h1>
            {renderContent()}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VersionHistory: React.FC<VersionHistoryProps> = ({ 
  versions, 
  currentArticleId, 
  onRestore, 
  onClose,
  previewLabel = "Preview",
  restoreLabel = "Quick View"
}) => {
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Published':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'Draft':
        return <FileText className="w-4 h-4 text-orange-600" />;
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

  const handleRestore = (version: Version) => {
    if (window.confirm(`Are you sure you want to restore to ${version.versionLabel}? This will create a new version with the restored content.`)) {
      onRestore(version);
    }
  };

  return (
    <>
      <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
            <p className="text-sm text-gray-600 mt-1">{versions.length} versions available</p>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {versions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No versions yet</h4>
              <p className="text-gray-500">Save or publish this article to create the first version.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.versionId}
                  className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    index === 0 
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200' 
                      : 'bg-white/80 border-gray-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {version.versionLabel || `Version ${versions.length - index}`}
                        </h4>
                        {index === 0 && (
                          <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-2">{version.title}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
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
                        <p className="text-xs text-gray-500 mt-2 italic">{version.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(version.status)}`}>
                        {getStatusIcon(version.status)}
                        <span>{version.status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewVersion(version)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{previewLabel}</span>
                    </button>
                    
                    {index !== 0 && (
                      <button
                        onClick={() => handleRestore(version)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-sm"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{restoreLabel}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {previewVersion && (
        <VersionPreviewModal
          version={previewVersion}
          onClose={() => setPreviewVersion(null)}
        />
      )}
    </>
  );
};

export default VersionHistory;