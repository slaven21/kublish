import { User } from '../types';

// Authentication API functions
export const loginWithCredentials = async (email: string, password: string): Promise<{ user: User; accessToken: string }> => {
  // Simulate API call delay and rate limiting
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Simulate login validation
  if (!email.includes('@') || password.length < 6) {
    throw new Error('Invalid credentials. Please check your email and password.');
  }
  
  // Simulate occasional failures for rate limiting
  if (Math.random() < 0.1) {
    throw new Error('Too many login attempts. Please try again in a few minutes.');
  }
  
  // Mock user data based on email
  const mockUsers: Record<string, User> = {
    'admin@company.com': {
      id: 'user-admin',
      name: 'Admin User',
      email: 'admin@company.com',
      accessToken: 'mock-admin-token',
      role: 'Admin'
    },
    'editor@company.com': {
      id: 'user-editor',
      name: 'Editor User',
      email: 'editor@company.com',
      accessToken: 'mock-editor-token',
      role: 'Editor'
    },
    'viewer@company.com': {
      id: 'user-viewer',
      name: 'Viewer User',
      email: 'viewer@company.com',
      accessToken: 'mock-viewer-token',
      role: 'Viewer'
    }
  };
  
  const user = mockUsers[email.toLowerCase()];
  if (!user) {
    throw new Error('Invalid credentials. Please check your email and password.');
  }
  
  // In a real implementation, this would:
  // 1. Hash and compare password
  // 2. Generate JWT token
  // 3. Set secure httpOnly cookies
  // 4. Log login attempt
  // 5. Implement rate limiting
  
  console.log('User logged in:', email);
  
  return {
    user,
    accessToken: user.accessToken
  };
};

export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Always return success to prevent email enumeration
  return {
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.'
  };
};

export const createAccount = async (email: string, password: string, name: string): Promise<{ success: boolean; message: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate validation
  if (!email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  
  if (!name.trim()) {
    throw new Error('Please enter your full name.');
  }
  
  // Simulate occasional failures
  if (Math.random() < 0.1) {
    throw new Error('An account with this email already exists.');
  }
  
  return {
    success: true,
    message: 'Account created successfully. Please check your email to verify your account.'
  };
};