import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, Typography, Card } from 'antd';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const getRedirectPath = (role) => {
  switch (role) {
    case 'Admin':
      return '/dashboard';
    case 'Audit':
      return '/UpdateDATA';
    case 'Head':
      return '/AddData';
    default:
      return '/login';
  }
};

const ProtectedRoute = ({ 
  children, 
  allowedRoles = null,
  requireSpecificUser = null,
  requireSpecificUserForAdmin = null
}) => {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const location = useLocation();
  const [countdown, setCountdown] = useState(3);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (shouldRedirect && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (shouldRedirect && countdown === 0) {
      const redirectPath = getRedirectPath(user?.role);
      if (redirectPath === '/login') {
        logout();
      }
      window.location.href = redirectPath;
    }
  }, [shouldRedirect, countdown, user, logout]);

  if (loading) {
    return (
      <div className="flex-center full-height">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User role cannot access any page
  if (user?.role === 'User') {
    if (!shouldRedirect) {
      setShouldRedirect(true);
    }
    return (
      <AccessDeniedCard 
        countdown={countdown} 
        message="บัญชี User ไม่สามารถเข้าถึงหน้านี้ได้"
        redirectMessage="กำลังออกจากระบบ"
      />
    );
  }

  // Check allowedRoles
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (!shouldRedirect) {
      setShouldRedirect(true);
    }
    return (
      <AccessDeniedCard 
        countdown={countdown} 
        message={`คุณไม่มีสิทธิ์เข้าถึงหน้านี้`}
        redirectMessage={`กำลังไปยังหน้าที่เหมาะสม`}
      />
    );
  }

  // Check requireSpecificUser (for all roles)
  if (requireSpecificUser && user?.user !== requireSpecificUser) {
    if (!shouldRedirect) {
      setShouldRedirect(true);
    }
    return (
      <AccessDeniedCard 
        countdown={countdown} 
        message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้"
        redirectMessage="กำลังไปยังหน้าที่เหมาะสม"
      />
    );
  }

  // Check requireSpecificUserForAdmin (only applies to Admin role)
  if (requireSpecificUserForAdmin && user?.role === 'Admin' && user?.user !== requireSpecificUserForAdmin) {
    if (!shouldRedirect) {
      setShouldRedirect(true);
    }
    return (
      <AccessDeniedCard 
        countdown={countdown} 
        message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้"
        redirectMessage="กำลังไปยังหน้าที่เหมาะสม"
      />
    );
  }

  return children;
};

const AccessDeniedCard = ({ countdown, message, redirectMessage }) => (
  <div className="full-height flex-center" style={{ background: '#000000' }}>
    <Card
      style={{
        width: 400,
        backgroundColor: '#111111',
        border: '1px solid #333333',
        boxShadow: '0 4px 12px rgba(255, 255, 255, 0.05)',
        textAlign: 'center'
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ color: '#ff4d4f', marginBottom: 16 }}>
          Access Denied
        </Title>
        <Text style={{ color: '#ffffff', fontSize: 16 }}>
          {message}
        </Text>
      </div>
      
      <div style={{ marginBottom: 24 }}>
        <Text style={{ color: '#8c8c8c', fontSize: 14 }}>
          {redirectMessage}
        </Text>
        <div style={{ marginTop: 8 }}>
          <Title 
            level={1} 
            style={{ 
              color: '#ff4d4f', 
              margin: 0, 
              fontSize: 48,
              fontWeight: 'bold'
            }}
          >
            {countdown}
          </Title>
        </div>
      </div>
      
      <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
        ระบบจะนำคุณไปยังหน้าที่เหมาะสมโดยอัตโนมัติ
      </Text>
    </Card>
  </div>
);

export default ProtectedRoute;
