import React, { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Button,
  Typography,
  Space,
  Popconfirm,
  message,
  Tag,
  Card,
  Dropdown,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LogoutOutlined,
  UserOutlined,
  MoreOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import UserModal from '../components/UserModal';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// Custom hook for responsive behavior
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, isTablet };
};

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingUser, setEditingUser] = useState(null);
  const { user, logout, isAdmin } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll();
      if (response.success) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Load users error:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setModalMode('create');
    setEditingUser(null);
    setModalVisible(true);
  };

  const handleEditUser = (record) => {
    setModalMode('edit');
    setEditingUser(record);
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await usersAPI.delete(userId);
      if (response.success) {
        message.success('ลบผู้ใช้สำเร็จ');
        loadUsers();
      }
    } catch (error) {
      console.error('Delete user error:', error);
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบผู้ใช้';
      message.error(errorMessage);
    }
  };

  const handleResetHwid = async (userId) => {
    try {
      const response = await usersAPI.resetHwid(userId);
      if (response.success) {
        message.success('รีเซ็ท HWID สำเร็จ');
        loadUsers();
      }
    } catch (error) {
      console.error('Reset HWID error:', error);
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการรีเซ็ท HWID';
      message.error(errorMessage);
    }
  };

  const handleToggleEnabled = async (record, checked) => {
    try {
      const response = await usersAPI.setEnabled(record._id, checked);
      if (response.success) {
        message.success(checked ? 'เปิดบัญชีแล้ว' : 'ปิดบัญชีแล้ว');
        loadUsers();
      }
    } catch (error) {
      console.error('Toggle enabled error:', error);
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะบัญชี';
      message.error(errorMessage);
      loadUsers(); // reload to revert UI
    }
  };

  const handleToggleFeatureFarm = async (record, checked) => {
    try {
      const response = await usersAPI.setFeatureFarm(record._id, checked);
      if (response.success) {
        message.success(checked ? 'ฟาม เปิดใช้งาน' : 'ฟาม ปิดใช้งาน');
        loadUsers();
      }
    } catch (error) {
      console.error('Toggle feature farm error:', error);
      message.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      loadUsers();
    }
  };

  const handleToggleFeatureBoard = async (record, checked) => {
    try {
      const response = await usersAPI.setFeatureBoard(record._id, checked);
      if (response.success) {
        message.success(checked ? 'บอร์ด เปิดใช้งาน' : 'บอร์ด ปิดใช้งาน');
        loadUsers();
      }
    } catch (error) {
      console.error('Toggle feature board error:', error);
      message.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      loadUsers();
    }
  };

  const handleModalSuccess = () => {
    setModalVisible(false);
    loadUsers();
  };

  const handleLogout = () => {
    logout();
    message.success('ออกจากระบบสำเร็จ');
  };

  // User menu for header
  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: `${user?.user} (${user?.role})`,
        disabled: true
      },
      {
        type: 'divider'
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'ออกจากระบบ',
        onClick: handleLogout
      }
    ]
  };

  // Table columns with responsive adjustments
  const columns = [
    {
      title: 'ลำดับ',
      key: 'index',
      width: isMobile ? 60 : 80,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      width: isMobile ? 102 : 166,
      align: 'center',
      render: (text) => <Text strong style={{ fontSize: isMobile ? '12px' : '14px' }}>{text}</Text>,
    },
    {
      title: 'ทีม',
      dataIndex: ['team', 'name'],
      key: 'team',
      width: isMobile ? 98 : 154,
      align: 'center',
      render: (teamName) => (
        teamName ? (
          <Tag 
            color="green"
            style={{ fontSize: isMobile ? '10px' : '12px' }}
          >
            {teamName}
          </Tag>
        ) : (
          <Text style={{ fontSize: isMobile ? '11px' : '12px', color: '#888888' }}>
            ไม่มีทีม
          </Text>
        )
      ),
    },
    {
      title: 'วันที่สร้าง',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: isMobile ? 120 : 150,
      align: 'center',
      render: (date) => (
        <Text style={{ fontSize: isMobile ? '11px' : '12px' }}>
          {isMobile ? dayjs(date).format('DD/MM/YY') : dayjs(date).format('DD/MM/YYYY HH:mm')}
        </Text>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: isMobile ? 80 : 100,
      align: 'center',
      render: (role) => (
        <Tag 
          color={role === 'Admin' ? 'red' : role === 'Audit' ? 'purple' : role === 'Head' ? 'orange' : 'blue'}
          style={{ fontSize: isMobile ? '10px' : '12px' }}
        >
          {role}
        </Tag>
      ),
    },
    {
      title: 'เปิด/ปิดบัญชี',
      dataIndex: 'enabled',
      key: 'enabled',
      width: isMobile ? 100 : 120,
      align: 'center',
      render: (enabled, record) => {
        const isCurrentUser = user && (
          (user._id && record._id && user._id === record._id) ||
          (user.id && record.id && user.id === record.id) ||
          (user.user && record.user && user.user === record.user)
        );
        const isOn = enabled !== false; // default true for existing users without field
        return (
          <Switch
            checked={isOn}
            checkedChildren="เปิด"
            unCheckedChildren="ปิด"
            onChange={(checked) => handleToggleEnabled(record, checked)}
            disabled={isCurrentUser}
            title={isCurrentUser ? 'ไม่สามารถปิดบัญชีของตัวเองได้' : (isOn ? 'เปิด - ล็อกอินโปรแกรมได้' : 'ปิด - ล็อกอินโปรแกรมไม่ได้')}
            style={isOn ? { background: '#52c41a' } : undefined}
          />
        );
      },
    },
    {
      title: 'ฟาม',
      dataIndex: 'featureFarm',
      key: 'featureFarm',
      width: isMobile ? 70 : 90,
      align: 'center',
      render: (featureFarm, record) => {
        const isOn = featureFarm !== false;
        return (
          <Switch
            checked={isOn}
            checkedChildren="เปิด"
            unCheckedChildren="ปิด"
            onChange={(checked) => handleToggleFeatureFarm(record, checked)}
            title={isOn ? 'เปิด - แสดงปุ่มจัดการไลน์ไก่' : 'ปิด - ซ่อนปุ่มจัดการไลน์ไก่'}
            style={isOn ? { background: '#52c41a' } : undefined}
          />
        );
      },
    },
    {
      title: 'บอร์ด',
      dataIndex: 'featureBoard',
      key: 'featureBoard',
      width: isMobile ? 70 : 90,
      align: 'center',
      render: (featureBoard, record) => {
        const isOn = featureBoard !== false;
        return (
          <Switch
            checked={isOn}
            checkedChildren="เปิด"
            unCheckedChildren="ปิด"
            onChange={(checked) => handleToggleFeatureBoard(record, checked)}
            title={isOn ? 'เปิด - แสดงปุ่ม + เพิ่มบัญชี' : 'ปิด - ซ่อนปุ่ม + เพิ่มบัญชี'}
            style={isOn ? { background: '#52c41a' } : undefined}
          />
        );
      },
    },
    {
      title: 'HWID',
      dataIndex: 'hwid',
      key: 'hwid',
      width: isMobile ? 80 : 100,
      align: 'center',
      render: (hwid, record) => (
        hwid ? (
          <Popconfirm
            title="ยืนยันการรีเซ็ท HWID"
            description="คุณแน่ใจหรือไม่ที่จะรีเซ็ท HWID ของบัญชีนี้?"
            onConfirm={() => handleResetHwid(record._id)}
            okText="รีเซ็ท"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
          >
            <CheckCircleOutlined 
              style={{ 
                color: '#52c41a', 
                fontSize: isMobile ? '16px' : '18px',
                cursor: 'pointer'
              }} 
            />
          </Popconfirm>
        ) : (
          <Text style={{ fontSize: isMobile ? '11px' : '12px', color: '#888888' }}>
            -
          </Text>
        )
      ),
    },
    {
      title: 'จัดการ',
      key: 'actions',
      width: isMobile ? 80 : 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        // Try multiple ways to check if it's current user
        const isCurrentUser = user && (
          (user._id && record._id && user._id === record._id) ||
          (user.id && record.id && user.id === record.id) ||
          (user.user && record.user && user.user === record.user)
        );
        
        return (
          <Space size="small">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditUser(record)}
              style={{ color: '#ffffff' }}
            />
            {!isCurrentUser && (
              <Popconfirm
                title="ยืนยันการลบ"
                description="คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?"
                onConfirm={() => handleDeleteUser(record._id)}
                okText="ลบ"
                cancelText="ยกเลิก"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#000000' }}>
      <Header
        style={{
          background: '#000000',
          borderBottom: '1px solid #333333',
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '56px',
          lineHeight: '56px'
        }}
      >
        <Title level={3} style={{ color: '#ffffff', margin: 0, fontSize: '22px', fontWeight: 'bold' }}>
          LCA-Admin
        </Title>
        <Space size="middle" align="center">
          {isAdmin() && (
            <Space size="middle">
              <Button
                type="text"
                onClick={() => navigate('/dashboard')}
                style={{
                  color: '#00C300',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                Dashboard
              </Button>
              {user?.user === 'Bnz82' && (
                <Button
                  type="text"
                  onClick={() => navigate('/UpdateDATA')}
                  style={{
                    color: '#00C300',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  Data dashboard
                </Button>
              )}
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

      <Content style={{ padding: '16px', background: '#000000' }}>
        <div className="responsive-container">
          <Card
            style={{
              background: '#000000',
              border: '1px solid #333333'
            }}
          >
            <div className="responsive-flex" style={{ marginBottom: 16 }}>
              <Title level={4} style={{ color: '#ffffff', margin: 0, fontSize: '16px' }}>
                จัดการผู้ใช้
              </Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddUser}
                size="small"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#ffffff',
                  color: '#000000',
                  whiteSpace: 'nowrap'
                }}
              >
                เพิ่มบัญชี
              </Button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <Table
                columns={columns}
                dataSource={users}
                rowKey="_id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: !isMobile,
                  showQuickJumper: !isMobile,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} จาก ${total} รายการ`,
                  size: isMobile ? 'small' : 'default'
                }}
                style={{
                  background: '#000000',
                  minWidth: isMobile ? '500px' : '600px'
                }}
                size={isMobile ? 'small' : 'default'}
                scroll={{ x: isMobile ? 500 : undefined }}
              />
            </div>
          </Card>

          <UserModal
            visible={modalVisible}
            mode={modalMode}
            editingUser={editingUser}
            onCancel={() => setModalVisible(false)}
            onSuccess={handleModalSuccess}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default Dashboard;
