import { User } from '../types';

export const canViewAllArticles = (user: User | null): boolean => {
  return user?.role === 'Admin' || user?.role === 'Editor';
};

export const canEditAllArticles = (user: User | null): boolean => {
  return user?.role === 'Admin';
};

export const canEditOwnArticles = (user: User | null): boolean => {
  return user?.role === 'Admin' || user?.role === 'Editor';
};

export const canDeleteArticles = (user: User | null): boolean => {
  return user?.role === 'Admin';
};

export const canManageUsers = (user: User | null): boolean => {
  return user?.role === 'Admin';
};

export const canPublishArticles = (user: User | null): boolean => {
  return user?.role === 'Admin' || user?.role === 'Editor';
};

export const canViewDrafts = (user: User | null): boolean => {
  return user?.role === 'Admin' || user?.role === 'Editor';
};

export const canCreateArticles = (user: User | null): boolean => {
  return user?.role === 'Admin' || user?.role === 'Editor';
};

export const isOwnerOrAdmin = (user: User | null, articleOwner: string): boolean => {
  if (!user) return false;
  return user.role === 'Admin' || user.name === articleOwner;
};