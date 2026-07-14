import React from 'react';
import { Layout, Button, Typography, Space, Dropdown, message } from 'antd';
import { LogoutOutlined, UserOutlined, MoreOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header } = Layout;
const { Title } = Typography;

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/UpdateDATA', label: 'Update Data' },
  { path: '/AddData', label: 'Add Data' },
  { path: '/hookdata', label: 'Hook Data' },
];

const AppHeader = ({ title }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    message.success('ออกจากระบบสำเร็จ');
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: `${user?.user} (${user?.role})`,
        disabled: true,
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'ออกจากระบบ',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Header
      style={{
        background: '#000000',
        borderBottom: '1px solid #333333',
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '56px',
        lineHeight: '56px',
      }}
    >
      <Title level={3} style={{ color: '#ffffff', margin: 0, fontSize: '22px', fontWeight: 'bold' }}>
        {title}
      </Title>
      <Space size="middle" align="center">
        {isAdmin() && (
          <Space size="middle">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  type="text"
                  onClick={() => navigate(item.path)}
                  style={{
                    color: isActive ? '#ffffff' : '#00C300',
                    fontWeight: isActive ? '600' : '500',
                    fontSize: '14px',
                    borderBottom: isActive ? '2px solid #00C300' : 'none',
                    borderRadius: 0,
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Space>
        )}
        <Dropdown menu={userMenu} trigger={['click']}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ color: '#ffffff' }}
            size="small"
          />
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AppHeader;
