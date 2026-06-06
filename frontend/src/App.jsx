import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { LanguageProvider } from './context/LanguageContext';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Pages
import LoginPage from './pages/auth/LoginPage';
import ManagerAccessPage from './pages/auth/ManagerAccessPage';
import DashboardPage from './pages/admin/DashboardPage';
import AuditsPage from './pages/admin/AuditsPage';
import AuditCreatePage from './pages/admin/AuditCreatePage';
import ReportViewPage from './pages/manager/ReportViewPage';
import CriteriaPage from './pages/admin/CriteriaPage';
import OutletsPage from './pages/admin/OutletsPage';
import UsersPage from './pages/admin/UsersPage';

// API request
import { request } from './utils/request';
import { API_ENDPOINTS } from './utils/endpoints';

export default function App() {
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('velaskara_token');
    const localUser = localStorage.getItem('velaskara_user');
    
    if (token && localUser) {
      setUser(JSON.parse(localUser));
      // Optionally verify profile in background
      request.get(API_ENDPOINTS.AUTH.PROFILE)
        .then(res => {
          if (res.success) {
            setUser(res.user);
            localStorage.setItem('velaskara_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          // Token expired or invalid
          handleLogout();
        })
        .finally(() => {
          setCheckingAuth(false);
        });
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('velaskara_token');
    localStorage.removeItem('velaskara_user');
    setUser(null);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-coffee-950 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="animate-spin text-white" size={32} />
        <p className="text-sm font-semibold text-coffee-200">Verifikasi Autentikasi...</p>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <Router>
        <Toaster position="top-right" reverseOrder={false} />
        
        <Routes>
          {/* Auth routes */}
          <Route 
            path="/login" 
            element={user ? <Navigate to={user.role === 'manager' ? '/audits' : '/dashboard'} replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} 
          />
          <Route 
            path="/manager/login" 
            element={user ? <Navigate to="/audits" replace /> : <ManagerAccessPage onLoginSuccess={handleLoginSuccess} />} 
          />

          {/* Private Layout wrapper */}
          <Route
            path="/*"
            element={
              user ? (
                <div className="min-h-screen bg-gray-50 flex">
                  {/* Sidebar */}
                  <Sidebar 
                    isOpen={isSidebarOpen} 
                    toggleSidebar={toggleSidebar} 
                    user={user} 
                    onLogout={handleLogout}
                  />
                  
                  {/* Main Content Pane */}
                  <div className="flex-1 flex flex-col min-h-screen lg:pl-64 transition-all duration-300 min-w-0 w-full overflow-x-hidden">
                    <Header toggleSidebar={toggleSidebar} user={user} />
                    
                    <main className="flex-grow w-full max-w-full min-w-0 overflow-x-hidden">
                      <Routes>
                        {/* Shared Routes */}
                        <Route path="/audits" element={<AuditsPage user={user} />} />
                        <Route path="/report/:token" element={<ReportViewPage user={user} />} />

                        {/* Admin & Auditor Routes */}
                        {['admin', 'auditor'].includes(user.role) && (
                          <>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/audits/new" element={<AuditCreatePage />} />
                          </>
                        )}

                        {/* Admin Only Routes */}
                        {user.role === 'admin' && (
                          <>
                            <Route path="/criteria" element={<CriteriaPage />} />
                            <Route path="/outlets" element={<OutletsPage />} />
                            <Route path="/users" element={<UsersPage />} />
                            <Route path="/audits/edit/:id" element={<AuditCreatePage />} />
                          </>
                        )}

                        {/* Fallback inside dashboard */}
                        <Route 
                          path="*" 
                          element={<Navigate to={user.role === 'manager' ? '/audits' : '/dashboard'} replace />} 
                        />
                      </Routes>
                    </main>
                  </div>
                </div>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}
