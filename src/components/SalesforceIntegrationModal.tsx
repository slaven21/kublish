import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { 
  Link as LinkIcon, 
  Unlink, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Mail,
  Clock,
  Folder,
  Tag,
  Info,
  Trash2,
  Radio
} from 'lucide-react';
import { 
  getSalesforceConnection, 
  connectSalesforce, 
  disconnectSalesforce, 
  SalesforceConnection 
} from '../api/usersAPI';
import { 
  syncCategoryStructure, 
  getCategorySyncStatus, 
  deleteCategoryStructure 
} from '../api/categoryAPI';
import { CategorySyncStatus } from '../types';

interface SalesforceIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type SalesforceEnvironment = 'production' | 'sandbox';
const SalesforceIntegrationModal: React.FC<SalesforceIntegrationModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [salesforceConnection, setSalesforceConnection] = useState<SalesforceConnection | null>(null);
  const [syncStatus, setSyncStatus] = useState<CategorySyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingState, setConnectingState] = useState<'idle' | 'connecting' | 'disconnecting'>('idle');
  const [syncingState, setSyncingState] = useState<'idle' | 'syncing' | 'deleting'>('idle');
  const [selectedEnvironment, setSelectedEnvironment] = useState<SalesforceEnvironment>('production');
  const [showEnvironmentSelector, setShowEnvironmentSelector] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifications, setNotifications] = useState<{
    salesforce?: { type: 'success' | 'error'; message: string };
    sync?: { type: 'success' | 'error'; message: string };
  }>({});

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [connectionData, statusData] = await Promise.all([
        getSalesforceConnection(),
        getCategorySyncStatus()
      ]);
      setSalesforceConnection(connectionData);
      setSyncStatus(statusData);
    } catch (error) {
      console.error('Failed to load integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (section: 'salesforce' | 'sync', type: 'success' | 'error', message: string) => {
    setNotifications(prev => ({
      ...prev,
      [section]: { type, message }
    }));
    setTimeout(() => {
      setNotifications(prev => ({
        ...prev,
        [section]: undefined
      }));
    }, 5000);
  };

  const handleConnectClick = () => {
    setShowEnvironmentSelector(true);
  };

  const handleConnect = async (environment: SalesforceEnvironment) => {
    setConnectingState('connecting');
    setShowEnvironmentSelector(false);
    try {
      const result = await connectSalesforce(environment);
      if (result.connection) {
        setSalesforceConnection(result.connection);
      }
      showNotification('salesforce', 'success', result.message);
      // Reload sync status after connection
      const statusData = await getCategorySyncStatus();
      setSyncStatus(statusData);
    } catch (error) {
      showNotification('salesforce', 'error', `Failed to connect: ${error}`);
    } finally {
      setConnectingState('idle');
    }
  };

  const handleDisconnectClick = () => {
    setShowDisconnectConfirm(true);
  };

  const handleDisconnect = async () => {
    setConnectingState('disconnecting');
    setShowDisconnectConfirm(false);
    try {
      await disconnectSalesforce();
      setSalesforceConnection({ isConnected: false });
      showNotification('salesforce', 'success', 'Successfully disconnected from Salesforce');
      // Reset sync status
      setSyncStatus(null);
    } catch (error: any) {
      showNotification('salesforce', 'error', `Failed to disconnect: ${error}`);
    } finally {
      setConnectingState('idle');
    }
  };

  const handleSync = async (force: boolean = false) => {
    setSyncingState('syncing');
    try {
      const result = await syncCategoryStructure(force);
      showNotification('sync', 'success', 
        `Sync completed! ${result.articleTypes} article types, ${result.categoryGroups} groups, ${result.categories} categories`
      );
      // Reload sync status
      const statusData = await getCategorySyncStatus();
      setSyncStatus(statusData);
      onComplete?.();
    } catch (error) {
      showNotification('sync', 'error', `Sync failed: ${error}`);
    } finally {
      setSyncingState('idle');
    }
  };

  const handleDelete = async () => {
    setSyncingState('deleting');
    setShowDeleteConfirm(false);
    try {
      const result = await deleteCategoryStructure();
      showNotification('sync', 'success', 
        `Deleted ${result.categories} categories, ${result.categoryGroups} groups, ${result.articleTypeMappings} mappings`
      );
      // Reload sync status
      const statusData = await getCategorySyncStatus();
      setSyncStatus(statusData);
      onComplete?.();
    } catch (error) {
      showNotification('sync', 'error', `Delete failed: ${error}`);
    } finally {
      setSyncingState('idle');
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


  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Salesforce Integration"
        description="Manage connection and sync data categories"
        size="4xl"
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading integration status...</p>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {/* Section 1: Salesforce Connection */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  1
                </span>
                <h4 className="text-lg font-semibold text-gray-900">Connect to Salesforce</h4>
              </div>

              {/* Salesforce Notification */}
              {notifications.salesforce && (
                <div className={`mb-4 p-3 rounded-lg border ${
                  notifications.salesforce.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <div className="flex items-center space-x-2">
                    {notifications.salesforce.type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{notifications.salesforce.message}</span>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      salesforceConnection?.isConnected ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-700">
                      {salesforceConnection?.isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                </div>

                {salesforceConnection?.isConnected ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{salesforceConnection.username}</span>
                      </div>
                      {salesforceConnection.lastSyncTime && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Last sync: {formatDate(salesforceConnection.lastSyncTime)}</span>
                        </div>
                      )}
                    </div>
                    {salesforceConnection.syncTarget && (
                      <div className="text-sm text-gray-600">
                        <strong>Target:</strong> {salesforceConnection.syncTarget}
                      </div>
                    )}
                    <button
                      onClick={handleDisconnectClick}
                      disabled={connectingState !== 'idle'}
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-red-400 disabled:to-pink-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg flex items-center space-x-2"
                    >
                      {connectingState === 'disconnecting' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Unlink className="w-4 h-4" />
                      )}
                      <span>{connectingState === 'disconnecting' ? 'Disconnecting...' : 'Disconnect'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Connect your Salesforce org to enable article publishing and category sync.
                    </p>
                    <button
                      onClick={handleConnectClick}
                      disabled={connectingState !== 'idle'}
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-emerald-400 disabled:to-cyan-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg flex items-center space-x-2"
                    >
                      {connectingState === 'connecting' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LinkIcon className="w-4 h-4" />
                      )}
                      <span>{connectingState === 'connecting' ? 'Connecting...' : 'Connect Salesforce'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Data Category Sync (only if connected) */}
            {salesforceConnection?.isConnected && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    2
                  </span>
                  <h4 className="text-lg font-semibold text-gray-900">Sync Data Categories</h4>
                </div>

                {/* Sync Notification */}
                {notifications.sync && (
                  <div className={`mb-4 p-3 rounded-lg border ${
                    notifications.sync.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {notifications.sync.type === 'success' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">{notifications.sync.message}</span>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-6">
                  {syncStatus ? (
                    <div className="space-y-6">
                      {/* Status Overview */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Tag className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-lg font-bold text-gray-900">{syncStatus.articleTypeCount}</div>
                          <div className="text-xs text-gray-600">Article Types</div>
                        </div>

                        <div className="text-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Folder className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-lg font-bold text-gray-900">{syncStatus.categoryGroupCount}</div>
                          <div className="text-xs text-gray-600">Category Groups</div>
                        </div>

                        <div className="text-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Database className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-lg font-bold text-gray-900">{syncStatus.totalCategoryCount}</div>
                          <div className="text-xs text-gray-600">Total Categories</div>
                        </div>

                        <div className="text-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                            syncStatus.isConfigured 
                              ? 'bg-gradient-to-br from-emerald-400 to-cyan-400' 
                              : 'bg-gradient-to-br from-red-400 to-pink-400'
                          }`}>
                            {syncStatus.isConfigured ? (
                              <CheckCircle className="w-5 h-5 text-white" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className={`text-sm font-medium ${
                            syncStatus.isConfigured ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {syncStatus.isConfigured ? 'Configured' : 'Not Configured'}
                          </div>
                          <div className="text-xs text-gray-600">Status</div>
                        </div>
                      </div>

                      {/* Last Sync Info */}
                      {syncStatus.lastSyncedAt && (
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Last synced: {formatDate(syncStatus.lastSyncedAt)}</span>
                            {syncStatus.needsSync && (
                              <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 border border-orange-200">
                                <Clock className="w-3 h-3" />
                                <span>Sync Recommended</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Warning for missing configuration */}
                      {!syncStatus.isConfigured && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">Configuration Required</span>
                          </div>
                          <p className="text-xs text-yellow-700">
                            No category structure found. Run initial sync to fetch Data Category Groups and 
                            Article Type mappings from your Salesforce org.
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleSync(false)}
                            disabled={syncingState !== 'idle'}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-blue-400 disabled:to-indigo-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg flex items-center space-x-2"
                          >
                            {syncingState === 'syncing' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            <span>{syncingState === 'syncing' ? 'Syncing...' : 'Sync Categories'}</span>
                          </button>

                          <button
                            onClick={() => handleSync(true)}
                            disabled={syncingState !== 'idle'}
                            className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 hover:bg-white/60 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Force Sync</span>
                          </button>
                        </div>

                        {syncStatus.isConfigured && (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={syncingState !== 'idle'}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Clear All</span>
                          </button>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div className="text-xs text-blue-700">
                            <p className="font-medium mb-1">About Data Category Sync:</p>
                            <ul className="space-y-1">
                              <li>• Fetches DataCategoryGroup metadata from Salesforce</li>
                              <li>• Discovers DataCategorySelection objects for each article type</li>
                              <li>• Stores category hierarchy in local cache for fast access</li>
                              <li>• Updates category picklists dynamically based on article type</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Database className="w-6 h-6 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No sync data available</h4>
                      <p className="text-gray-500">Connect to Salesforce first to enable category sync.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Environment Selection Modal */}
      <Modal
        isOpen={showEnvironmentSelector}
        onClose={() => setShowEnvironmentSelector(false)}
        title="Choose Salesforce Environment"
        description="Select the environment you want to connect to"
        size="md"
      >
        <div className="p-6">
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="environment"
                  value="production"
                  checked={selectedEnvironment === 'production'}
                  onChange={(e) => setSelectedEnvironment(e.target.value as SalesforceEnvironment)}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">Production</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Connect to your live Salesforce org with real customer data. 
                    Use this for publishing articles to your production Knowledge base.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="environment"
                  value="sandbox"
                  checked={selectedEnvironment === 'sandbox'}
                  onChange={(e) => setSelectedEnvironment(e.target.value as SalesforceEnvironment)}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">Sandbox</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Connect to your Salesforce sandbox for testing and development. 
                    Safe environment for experimenting with articles and configurations.
                  </p>
                </div>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowEnvironmentSelector(false)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConnect(selectedEnvironment)}
              disabled={connectingState === 'connecting'}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-emerald-400 disabled:to-cyan-400 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg flex items-center space-x-2"
            >
              {connectingState === 'connecting' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LinkIcon className="w-4 h-4" />
              )}
              <span>{connectingState === 'connecting' ? 'Connecting...' : `Connect to ${selectedEnvironment}`}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Disconnect Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        onConfirm={handleDisconnect}
        title="Disconnect from Salesforce"
        message="This will disconnect your Salesforce integration and stop all sync operations. You'll need to reconnect to publish articles or sync categories. This action cannot be undone."
        confirmText="Disconnect"
        type="danger"
        isLoading={connectingState === 'disconnecting'}
      />

      {/* Delete Categories Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Clear Category Structure"
        message="This will delete all synced category groups, categories, and article type mappings. You'll need to sync again to restore the data. This action cannot be undone."
        confirmText="Clear All Data"
        type="danger"
        isLoading={syncingState === 'deleting'}
      />
    </>
  );
};

export default SalesforceIntegrationModal;