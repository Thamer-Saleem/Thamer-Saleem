import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LabReports from './pages/LabReports';
import Providers from './pages/Providers';
import Appointments from './pages/Appointments';
import Insurance from './pages/Insurance';
import Profile from './pages/Profile';
import AdminPortal from './pages/AdminPortal';

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { dir } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">م</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-3 text-sm">Loading Mua'afah...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50" dir={dir}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/labs" element={<LabReports />} />
        <Route path="/labs/:id" element={<LabReports />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/insurance" element={<Insurance />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/admin/*" element={<AdminPortal />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontFamily: 'inherit',
              },
            }}
          />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
