import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to continue');
    } else if (requiredRole && user?.role !== requiredRole) {
      toast.error(`Access denied. ${requiredRole} access required.`);
    }
  }, [isAuthenticated, user, requiredRole]);

  if (!isAuthenticated) {
    // Redirect to appropriate login page based on required role
    const loginRoutes = {
      admin: '/alogin',
      seller: '/slogin',
      user: '/login'
    };
    return <Navigate to={loginRoutes[requiredRole] || '/login'} state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate home page based on user's actual role
    const homeRoutes = {
      admin: '/ahome',
      seller: '/shome',
      user: '/uhome'
    };
    return <Navigate to={homeRoutes[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute; 