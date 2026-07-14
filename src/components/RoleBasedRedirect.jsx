import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'Admin':
      return <Navigate to="/dashboard" replace />;
    case 'Audit':
      return <Navigate to="/UpdateDATA" replace />;
    case 'Head':
      return <Navigate to="/AddData" replace />;
    case 'User':
    default:
      return <Navigate to="/login" replace />;
  }
};

export default RoleBasedRedirect;
