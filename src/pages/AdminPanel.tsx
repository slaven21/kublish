import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { getUsers, updateUserRole, deleteUser, createUser, getSalesforceConnection, connectSalesforce, disconnectSalesforce, SalesforceConnection } from '../api/usersAPI';
import { canManageUsers } from '../utils/permissions';
import { Link } from 'react-router-dom';
import { User } from '../types';
import SalesforceIntegrationModal from '../components/SalesforceIntegrationModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Modal from '../components/Modal';
import { 
  Users, 
  Shield, 
  Edit, 
  Eye, 
  Save, 
  Trash2, 
  CheckCircle,
  X,
  UserPlus,
  Crown,
  ChevronDown,
  Plus,
  Mail,
  FileText,
  Database
} from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { user } = useAppContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, 'Admin' | 'Editor' | 'Viewer'>>({});
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserData, setCreateUserData] = useState({ email: '', role: 'Viewer' as 'Admin' | 'Editor' | 'Viewer' });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showSalesforceModal, setShowSalesforceModal] = useState(false);

  useEffect(() => {
    if (!canManageUsers(user)) {
      return;
    }
    
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      showNotification('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleRoleChange = (userId: string, newRole: 'Admin' | 'Editor' | 'Viewer') => {
    setPendingChanges(prev => ({
      ...prev,
      [userId]: newRole
    }));
  };

  const handleSaveRole = async (userId: string) => {
    const newRole = pendingChanges[userId];
    if (!newRole) return;

    setSaving(userId);
    try {
      await updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      // Clear pending change
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      
      showNotification('success', `User role updated to ${newRole}`);
    } catch (error) {
      showNotification('error', `Failed to update role: ${error}`);
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeleting(userId);
    try {
      await deleteUser(userId);
      
      // Remove from local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      showNotification('success', 'User deleted successfully');
    } catch (error) {
      showNotification('error', `Failed to delete user: ${error}`);
    } finally {
      setDeleting(null);
      setShowDeleteModal(null);
    }
  };

  const handleCreateUser = async () => {
    if (!createUserData.email.trim()) {
      showNotification('error', 'Email is required');
      return;
    }

    if (!createUserData.email.includes('@')) {
      showNotification('error', 'Please enter a valid email address');
      return;
    }

    setIsCreatingUser(true);
    try {
      const result = await createUser(createUserData.email, createUserData.role);
      
      if (result.user) {
        // Add to local state
        setUsers(prev => [result.user!, ...prev]);
      }
      
      showNotification('success', result.message);
      setShowCreateUserModal(false);
      setCreateUserData({ email: '', role: 'Viewer' });
    } catch (error) {
      showNotification('error', `Failed to create user: ${error}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'Editor':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'Viewer':
        return <Eye className="w-4 h-4 text-gray-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200';
      case 'Editor':
        return 'from-blue-100 to-indigo-100 text-blue-700 border-blue-200';
      case 'Viewer':
        return 'from-gray-100 to-slate-100 text-gray-700 border-gray-200';
      default:
        return 'from-purple-100 to-blue-100 text-purple-700 border-purple-200';
    }
  };

  if (!canManageUsers(user)) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-gray-600">Manage users and organization settings</p>
          </div>
        </div>

        {/* Integration Management */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Salesforce Integration</h2>
                <p className="text-sm text-gray-600">Manage connection and sync data categories</p>
              </div>
              <button
                onClick={() => setShowSalesforceModal(true)}
                className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <Database className="w-5 h-5" />
                <span>Manage Salesforce Integration</span>
              </button>
            </div>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'Admin').length}
                </div>
                <div className="text-sm text-gray-600">Admins</div>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center">
                <Edit className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'Editor').length}
                </div>
                <div className="text-sm text-gray-600">Editors</div>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-slate-400 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'Viewer').length}
                </div>
                <div className="text-sm text-gray-600">Viewers</div>
              </div>
            </div>
          </div>
        </div>
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
            <X className="w-5 h-5" />
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

      {/* Users Table */}
      <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              <p className="text-sm text-gray-600 mt-1">{users.length} users total</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/logs"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>View Logs</span>
              </Link>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New User</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((userItem) => {
                  const pendingRole = pendingChanges[userItem.id];
                  const hasChanges = pendingRole && pendingRole !== userItem.role;
                  
                  return (
                    <tr key={userItem.id} className="hover:bg-white/40 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {userItem.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{userItem.name}</div>
                            {userItem.id === user?.id && (
                              <div className="text-xs text-purple-600 font-medium">You</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {userItem.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r border ${getRoleColor(userItem.role)}`}>
                          {getRoleIcon(userItem.role)}
                          <span>{userItem.role}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <select
                            value={pendingRole || userItem.role}
                            onChange={(e) => handleRoleChange(userItem.id, e.target.value as 'Admin' | 'Editor' | 'Viewer')}
                            disabled={userItem.id === user?.id}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="Admin">Admin</option>
                            <option value="Editor">Editor</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {hasChanges && (
                            <button
                              onClick={() => handleSaveRole(userItem.id)}
                              disabled={saving === userItem.id}
                              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-emerald-400 disabled:to-cyan-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-sm flex items-center space-x-1"
                            >
                              {saving === userItem.id ? (
                                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                              <span>Save</span>
                            </button>
                          )}
                          
                          {userItem.id !== user?.id && (
                            <button
                              onClick={() => setShowDeleteModal(userItem.id)}
                              disabled={deleting === userItem.id}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-lg transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete User Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={() => showDeleteModal && handleDeleteUser(showDeleteModal)}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        type="danger"
        isLoading={!!deleting}
      />

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateUserModal}
        onClose={() => {
          setShowCreateUserModal(false);
          setCreateUserData({ email: '', role: 'Viewer' });
        }}
        title="Create New User"
        size="md"
      >
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={createUserData.email}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={isCreatingUser}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      value={createUserData.role}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, role: e.target.value as 'Admin' | 'Editor' | 'Viewer' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
                      disabled={isCreatingUser}
                    >
                      <option value="Viewer">Viewer</option>
                      <option value="Editor">Editor</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  An invitation email will be sent to the user with instructions to set up their account.
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowCreateUserModal(false);
                setCreateUserData({ email: '', role: 'Viewer' });
              }}
              disabled={isCreatingUser}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateUser}
              disabled={isCreatingUser || !createUserData.email.trim()}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-emerald-400 disabled:to-cyan-400 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg flex items-center space-x-2"
            >
              {isCreatingUser ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Salesforce Integration Modal */}
      <SalesforceIntegrationModal
        isOpen={showSalesforceModal}
        onClose={() => setShowSalesforceModal(false)}
        onComplete={() => {
          showNotification('success', 'Salesforce integration updated successfully');
        }}
      />
    </div>
  );
};

export default AdminPanel;