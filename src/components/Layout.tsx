import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { canManageUsers } from '../utils/permissions';
import HelpDropdown from './HelpDropdown';
import OnboardingGuide from './OnboardingGuide';
import { useOnboarding } from '../hooks/useOnboarding';
import { 
  BookOpen, 
  Settings, 
  Upload, 
  LayoutDashboard, 
  LogOut, 
  User,
  Users
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, setUser } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { shouldShowGuide, markGuideComplete } = useOnboarding();
  const [showGuide, setShowGuide] = useState(shouldShowGuide());

  useEffect(() => {
    // Show guide for new users after a short delay
    if (shouldShowGuide()) {
      const timer = setTimeout(() => {
        setShowGuide(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowGuide]);
  const handleLogout = () => {
    localStorage.removeItem('kublish_user');
    setUser(null);
    navigate('/login');
  };

  const handleGuideComplete = () => {
    markGuideComplete();
    setShowGuide(false);
  };
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ...(canManageUsers(user) ? [{ path: '/admin', icon: Users, label: 'Admin Panel' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">K</span>
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Kublish
                  </span>
                </div>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                {navItems.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      location.pathname === path
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {user && (
              <div className="flex items-center space-x-4">
                <HelpDropdown onShowGuide={() => setShowGuide(true)} />
                
                <Link 
                  to="/user"
                  className="flex items-center space-x-3 hover:bg-white/60 px-3 py-2 rounded-lg transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 hover:text-gray-900">{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Onboarding Guide */}
      <OnboardingGuide
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        onComplete={handleGuideComplete}
      />
    </div>
  );
};

export default Layout;