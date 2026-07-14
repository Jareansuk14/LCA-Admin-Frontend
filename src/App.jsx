import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OnlyDev from './pages/OnlyDev';
import UpdateData from './pages/UpdateData';
import AddData from './pages/AddData';
import HookData from './pages/HookData';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            {/* Admin only */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Developer only - Admin only */}
            <Route
              path="/Only-Dev"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <OnlyDev />
                </ProtectedRoute>
              }
            />
            
            {/* Admin only (Admin bypasses role check on all routes) */}
            <Route
              path="/UpdateDATA"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <UpdateData />
                </ProtectedRoute>
              }
            />
            
            {/* Head + Admin */}
            <Route
              path="/AddData"
              element={
                <ProtectedRoute allowedRoles={['Head', 'Admin']}>
                  <AddData />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hookdata"
              element={
                <ProtectedRoute allowedRoles={['Head', 'Admin']}>
                  <HookData />
                </ProtectedRoute>
              }
            />
            
            {/* Default redirect based on role */}
            <Route path="/" element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            } />
            
            {/* 404 - redirect based on role */}
            <Route path="*" element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
