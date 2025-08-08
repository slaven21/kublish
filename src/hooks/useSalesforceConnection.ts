import { useState, useEffect } from 'react';

export interface SalesforceConnection {
  isConnected: boolean;
  instanceUrl?: string;
  username?: string;
  accessToken?: string;
  lastSyncTime?: string;
}

export const useSalesforceConnection = () => {
  const [connection, setConnection] = useState<SalesforceConnection>({
    isConnected: true, // Mock connected state
    instanceUrl: 'https://company.my.salesforce.com',
    username: 'admin@company.com',
    accessToken: 'mock-token',
    lastSyncTime: new Date().toISOString()
  });

  const [loading, setLoading] = useState(false);

  const connect = async () => {
    setLoading(true);
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 1000));
    setConnection({
      isConnected: true,
      instanceUrl: 'https://company.my.salesforce.com',
      username: 'admin@company.com',
      accessToken: 'mock-token',
      lastSyncTime: new Date().toISOString()
    });
    setLoading(false);
  };

  const disconnect = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setConnection({ isConnected: false });
    setLoading(false);
  };

  return {
    connection,
    loading,
    connect,
    disconnect
  };
};