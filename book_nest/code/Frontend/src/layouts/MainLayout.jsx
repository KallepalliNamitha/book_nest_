import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import { Toaster } from 'react-hot-toast';
import MainNavbar from '../components/MainNavbar';
import Unavbar from '../User/Unavbar';
import Snavbar from '../Seller/Snavbar';
import Anavbar from '../Admin/Anavbar';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const renderNavbar = () => {
    // Public routes that should always show MainNavbar
    const publicRoutes = ['/', '/login', '/signup', '/slogin', '/ssignup', '/alogin', '/asignup'];
    if (publicRoutes.includes(location.pathname)) {
      return <MainNavbar />;
    }

    // Protected routes - show role-specific navbar if authenticated
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'seller':
          return <Snavbar />;
        case 'admin':
          return <Anavbar />;
        case 'user':
          return <Unavbar />;
        default:
          return <MainNavbar />;
      }
    }

    // Default to MainNavbar if no other conditions are met
    return <MainNavbar />;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      {renderNavbar()}
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout; 