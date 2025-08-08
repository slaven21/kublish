import { User } from '../types';

// Simulated API functions for user management
export const getUsers = async (): Promise<User[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real implementation, this would make a REST API call to fetch users
  return [
    {
      id: 'user-1',
      name: 'John Salesforce',
      email: 'john@company.com',
      accessToken: 'mock-sf-access-token-1',
      role: 'Admin'
    },
    {
      id: 'user-2',
      name: 'Jane Editor',
      email: 'jane@company.com',
      accessToken: 'mock-sf-access-token-2',
      role: 'Editor'
    },
    {
      id: 'user-3',
      name: 'Bob Viewer',
      email: 'bob@company.com',
      accessToken: 'mock-sf-access-token-3',
      role: 'Viewer'
    },
    {
      id: 'user-4',
      name: 'Alice Writer',
      email: 'alice@company.com',
      accessToken: 'mock-sf-access-token-4',
      role: 'Editor'
    }
  ];
};

export const updateUserRole = async (userId: string, role: 'Admin' | 'Editor' | 'Viewer'): Promise<{ success: boolean; message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate occasional failures
  if (Math.random() < 0.1) {
    throw new Error('Network timeout - please try again');
  }
  
  // In a real implementation, this would PUT/PATCH to user management API
  console.log('Updating user role:', userId, role);
  
  return {
    success: true,
    message: `User role updated to ${role} successfully`
  };
};

export const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate occasional failures
  if (Math.random() < 0.1) {
    throw new Error('Cannot delete user - please try again');
  }
  
  // In a real implementation, this would DELETE to user management API
  console.log('Deleting user:', userId);
  
  return {
    success: true,
    message: 'User deleted successfully'
  };
};

export const createUser = async (email: string, role: 'Admin' | 'Editor' | 'Viewer'): Promise<{ success: boolean; message: string; user?: User }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Simulate occasional failures
  if (Math.random() < 0.1) {
    throw new Error('Failed to create user - please try again');
  }
  
  // Check if email already exists (simulate)
  const existingUsers = await getUsers();
  if (existingUsers.some(user => user.email === email)) {
    throw new Error('User with this email already exists');
  }
  
  // In a real implementation, this would POST to user management API
  const newUser: User = {
    id: `user-${Date.now()}`,
    name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    email,
    accessToken: `mock-sf-access-token-${Date.now()}`,
    role
  };
  
  console.log('Creating user:', newUser);
  
  return {
    success: true,
    message: `User created successfully. Invitation sent to ${email}`,
    user: newUser
  };
};

// Salesforce Organization Integration API
export interface SalesforceConnection {
  isConnected: boolean;
  username?: string;
  lastSyncTime?: string;
  syncTarget?: string;
  connectionId?: string;
}

export const getSalesforceConnection = async (): Promise<SalesforceConnection> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real implementation, this would GET from /api/org/salesforce
  return {
    isConnected: true,
    username: 'admin@company.salesforce.com',
    lastSyncTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    syncTarget: 'Knowledge Base (Production)',
    connectionId: 'sf-conn-12345'
  };
};

export const connectSalesforce = async (environment: 'production' | 'sandbox' = 'production'): Promise<{ success: boolean; message: string; connection?: SalesforceConnection }> => {
  // Simulate OAuth flow delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate occasional failures
  if (Math.random() < 0.15) {
    throw new Error('Salesforce connection failed - please try again');
  }
  
  // In a real implementation, this would:
  // 1. Use correct OAuth endpoint based on environment
  // 2. Log the chosen environment
  // 3. Store environment info with credentials
  const connection: SalesforceConnection = {
    isConnected: true,
    username: `admin@company.${environment === 'sandbox' ? 'sandbox.' : ''}salesforce.com`,
    lastSyncTime: new Date().toISOString(),
    syncTarget: `Knowledge Base (${environment === 'production' ? 'Production' : 'Sandbox'})`,
    connectionId: `sf-conn-${Date.now()}`
  };
  
  console.log(`Connecting to Salesforce ${environment}:`, connection);
  
  return {
    success: true,
    message: `Successfully connected to Salesforce ${environment}`,
    connection
  };
};

export const disconnectSalesforce = async (): Promise<{ success: boolean; message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real implementation, this would revoke tokens and clear connection
  console.log('Disconnecting from Salesforce');
  
  return {
    success: true,
    message: 'Successfully disconnected from Salesforce'
  };
};