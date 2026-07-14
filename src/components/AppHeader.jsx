import React from 'react';
import { Layout, Button, Dropdown, message } from 'antd';
import { LogoutOutlined, UserOutlined, MoreOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header } = Layout;

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
      { type: 'divider' },
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
        background: 'var(--lambo-black)',
        borderBottom: '1px solid var(--lambo-border)',
        padding: '0 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '64px',
        lineHeight: '64px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="lambo-brand" style={{ fontSize: '22px' }}>LCA</span>
        <span style={{ width: 28, height: 2, background: 'var(--lambo-gold)', display: 'inline-block' }} />
        {title && (
          <span
            className="lambo-brand"
            style={{ fontSize: '13px', color: 'var(--lambo-ash)', letterSpacing: '0.12em' }}
          >
            {title}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {isAdmin() && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: isActive ? 'var(--lambo-gold)' : 'var(--lambo-white)',
                    fontFamily: 'var(--font-display)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '0 0 2px',
                    borderBottom: isActive ? '2px solid var(--lambo-gold)' : '2px solid transparent',
                    lineHeight: '40px',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
        <Dropdown menu={userMenu} trigger={['click']}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ color: 'var(--lambo-white)' }}
            size="small"
          />
        </Dropdown>
      </div>
    </Header>
  );
};

export default AppHeader;
