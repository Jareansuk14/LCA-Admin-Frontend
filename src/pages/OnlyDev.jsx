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
  Select,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LogoutOutlined,
  UserOutlined,
  MoreOutlined,
  PoweroffOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, teamsAPI } from '../services/api';
import UserModal from '../components/UserModal';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import dayjs from 'dayjs';

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

const OnlyDev = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingUser, setEditingUser] = useState(null);
  const { user, logout } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const { statuses } = useOnlineStatus();

  // Load users and teams on component mount
  useEffect(() => {
    loadUsers();
    loadTeams();
  }, []);

  // Filter users when selectedTeam or showOnlineOnly or statuses changes
  useEffect(() => {
    filterUsers();
  }, [selectedTeam, allUsers, showOnlineOnly, statuses]);

  const loadTeams = async () => {
    try {
      const response = await teamsAPI.getAll();
      if (response.success) {
        setTeams(response.teams || []);
      }
    } catch (error) {
      console.error('Load teams error:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll();
      if (response.success) {
        // Sort users: latest login first, null values last
        const sortedUsers = [...response.users].sort((a, b) => {
          const aDate = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : null;
          const bDate = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : null;
          
          // Handle null values - always push to bottom
          if (aDate === null && bDate === null) return 0;
          if (aDate === null) return 1; // null goes to bottom
          if (bDate === null) return -1; // null goes to bottom
          
          // Sort descending: latest first (bDate - aDate)
          return bDate - aDate;
        });
        setAllUsers(sortedUsers);
      }
    } catch (error) {
      console.error('Load users error:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = allUsers;
    
    // Filter by team
    if (selectedTeam !== 'all') {
      if (selectedTeam === 'no-team') {
        filtered = filtered.filter(user => !user.team);
      } else {
        filtered = filtered.filter(user => user.team?._id === selectedTeam);
      }
    }
    
    // Filter by online status
    if (showOnlineOnly) {
      filtered = filtered.filter(user => {
        const status = statuses[user._id];
        return status?.isOnline === true;
      });
    }
    
    setUsers(filtered);
  };

  const handleTeamChange = (value) => {
    setSelectedTeam(value);
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

  const handleToggleShutdown = async (userId, currentCommand) => {
    try {
      const response = await usersAPI.toggleShutdown(userId);
      if (response.success) {
        if (currentCommand === 'shutdown') {
          message.success('ยกเลิกคำสั่งปิดตัวแล้ว');
        } else {
          message.success('ตั้งค่าปิดตัวแล้ว');
        }
        loadUsers();
      }
    } catch (error) {
      console.error('Toggle shutdown error:', error);
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาด';
      message.error(errorMessage);
    }
  };

  const handleToggleFeatureLocalData = async (record, checked) => {
    try {
      const response = await usersAPI.setFeatureLocalData(record._id, checked);
      if (response.success) {
        message.success(checked ? 'Local DATA เปิดใช้งาน' : 'Local DATA ปิดใช้งาน');
        loadUsers();
      }
    } catch (error) {
      console.error('Toggle feature local data error:', error);
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

  // Table columns with responsive adjustments and additional columns for last login
  const columns = [
    {
      title: 'ลำดับ',
      key: 'index',
      width: isMobile ? 50 : 70,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      width: isMobile ? 100 : 120,
      align: 'center',
      render: (text) => <Text strong style={{ fontSize: isMobile ? '12px' : '14px' }}>{text}</Text>,
    },
    {
      title: 'ทีม',
      dataIndex: ['team', 'name'],
      key: 'team',
      width: isMobile ? 120 : 180,
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
      title: 'ล็อกอินล่าสุด',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: isMobile ? 120 : 150,
      align: 'center',
      render: (date) => (
        <Text style={{ fontSize: isMobile ? '11px' : '12px', color: date ? '#ffffff' : '#8c8c8c' }}>
          {date ? (isMobile ? dayjs(date).format('DD/MM/YY HH:mm') : dayjs(date).format('DD/MM/YYYY HH:mm:ss')) : 'ยังไม่เคยล็อกอิน'}
        </Text>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'lastLoginIP',
      key: 'lastLoginIP',
      width: isMobile ? 100 : 140,
      align: 'center',
      render: (ip) => (
        <Text style={{ fontSize: isMobile ? '11px' : '12px', color: ip ? '#1890ff' : '#8c8c8c' }}>
          {ip || 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: isMobile ? 70 : 90,
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
      title: 'เวอร์ชัน',
      dataIndex: 'clientVersion',
      key: 'clientVersion',
      width: isMobile ? 80 : 100,
      align: 'center',
      render: (clientVersion) => (
        <Text style={{ fontSize: isMobile ? '11px' : '12px', color: clientVersion ? '#ffffff' : '#888888' }}>
          {clientVersion || '-'}
        </Text>
      ),
    },
    {
      title: 'สถานะ',
      key: 'status',
      width: isMobile ? 120 : 150,
      align: 'center',
      render: (_, record) => {
        const status = statuses[record._id];
        const isOnline = status?.isOnline || false;
        const durationText = status?.durationText || '0:00:00';
        
        return (
          <Tag color={isOnline ? 'green' : 'default'}>
            {isOnline ? `ออนไลน์ ${durationText}` : `ออฟไลน์ ${durationText}`}
          </Tag>
        );
      },
    },
    {
      title: 'Local DATA',
      dataIndex: 'featureLocalData',
      key: 'featureLocalData',
      width: isMobile ? 90 : 110,
      align: 'center',
      render: (featureLocalData, record) => {
        const isOn = featureLocalData === true;
        return (
          <Switch
            checked={isOn}
            checkedChildren="เปิด"
            unCheckedChildren="ปิด"
            onChange={(checked) => handleToggleFeatureLocalData(record, checked)}
            title={isOn ? 'เปิด - แสดงปุ่มอัพโหลดไฟล์ Local' : 'ปิด - ซ่อนปุ่มอัพโหลดไฟล์ Local'}
            style={isOn ? { background: '#52c41a' } : undefined}
          />
        );
      },
    },
    {
      title: 'ปิดตัว',
      key: 'shutdown',
      width: isMobile ? 70 : 90,
      align: 'center',
      render: (_, record) => {
        const hasPendingShutdown = record.pendingCommand === 'shutdown';
        
        return (
          <Popconfirm
            title={hasPendingShutdown ? "ยกเลิกคำสั่งปิดตัว" : "ยืนยันการปิดตัว"}
            description={hasPendingShutdown ? "คุณต้องการยกเลิกคำสั่งปิดตัวหรือไม่?" : "คำสั่งนี้จะปิดโปรแกรมและลบไฟล์ทั้งหมด คุณแน่ใจหรือไม่?"}
            onConfirm={() => handleToggleShutdown(record._id, record.pendingCommand)}
            okText={hasPendingShutdown ? "ยกเลิก" : "ปิดตัว"}
            cancelText="ปิด"
            okButtonProps={{ danger: !hasPendingShutdown }}
          >
            <Button
              type="text"
              icon={<PoweroffOutlined />}
              size="small"
              danger={!hasPendingShutdown}
              style={hasPendingShutdown ? { color: '#8c8c8c' } : undefined}
              title={hasPendingShutdown ? 'คำสั่งปิดตัวถูกตั้งค่าแล้ว - กดเพื่อยกเลิก' : 'ตั้งค่าปิดตัวและลบไฟล์'}
            />
          </Popconfirm>
        );
      },
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
        <Title level={3} style={{ color: '#ffffff', margin: 0, fontSize: '18px' }}>
          LineAdmin - Developer Mode
        </Title>
        <Dropdown menu={userMenu} trigger={['click']}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ color: '#ffffff' }}
            size="small"
          />
        </Dropdown>
      </Header>

      <Content style={{ padding: '16px', background: '#000000', maxWidth: '100%' }}>
        <div className="responsive-container" style={{ maxWidth: '100%' }}>
          <Card
            style={{
              background: '#000000',
              border: '1px solid #333333',
              maxWidth: '100%'
            }}
          >
            <div className="responsive-flex" style={{ marginBottom: 16 }}>
              <Title level={4} style={{ color: '#ffffff', margin: 0, fontSize: '16px' }}>
                จัดการผู้ใช้ (Developer View)
              </Title>
              <Space wrap>
                <Select
                  value={selectedTeam}
                  onChange={handleTeamChange}
                  style={{ width: isMobile ? 150 : 200 }}
                  placeholder="เลือกทีม"
                >
                  <Select.Option value="all">ทุกทีม</Select.Option>
                  <Select.Option value="no-team">ไม่มีทีม</Select.Option>
                  {teams.map(team => (
                    <Select.Option key={team._id} value={team._id}>
                      {team.name}
                    </Select.Option>
                  ))}
                </Select>
                <Space style={{ color: '#ffffff', fontSize: isMobile ? '12px' : '14px' }}>
                  <span>ออนไลน์เท่านั้น:</span>
                  <Switch
                    checked={showOnlineOnly}
                    onChange={setShowOnlineOnly}
                    size="small"
                  />
                </Space>
              </Space>
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
                  minWidth: isMobile ? '700px' : '900px'
                }}
                size={isMobile ? 'small' : 'default'}
                scroll={{ x: isMobile ? 700 : undefined }}
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

export default OnlyDev;


