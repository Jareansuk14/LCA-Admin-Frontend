import React, { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Button,
  Typography,
  Space,
  Tag,
  Card,
  Modal,
  Upload,
  message,
  List,
  Spin,
  Select,
  Input
} from 'antd';
import {
  PlusOutlined,
  HistoryOutlined,
  InboxOutlined
} from '@ant-design/icons';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { phoneDataAPI, teamsAPI } from '../services/api';
import dayjs from 'dayjs';

const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
};

const { Content } = Layout;
const { Title, Text } = Typography;
const { Dragger } = Upload;
const LAST_EXTRA_PHONE_KEY = 'addDataLastExtraPhone';

const isValidExtraPhone = (phone) => /^(06|08|09)\d{8}$/.test(phone);

const AddData = () => {
  const [members, setMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadAllModalVisible, setUploadAllModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [validatedData, setValidatedData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [canUpload, setCanUpload] = useState(true);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [fileName, setFileName] = useState('');
  const [extraPhone, setExtraPhone] = useState('');
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  
  const canFilterTeam = ['Head', 'Admin'].includes(user?.role);

  useEffect(() => {
    if (canFilterTeam) {
      loadTeams();
    }
    loadTeamMembers();

    const savedExtraPhone = localStorage.getItem(LAST_EXTRA_PHONE_KEY);
    if (savedExtraPhone) {
      setExtraPhone(savedExtraPhone);
    }
  }, []);

  useEffect(() => {
    if (canFilterTeam) {
      loadTeamMembers(selectedTeam === 'all' ? null : selectedTeam);
    }
  }, [selectedTeam]);

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

  const loadTeamMembers = async (teamId = null) => {
    setLoading(true);
    try {
      const response = await phoneDataAPI.getTeamMembers(teamId);
      if (response.success) {
        setMembers(response.members || []);
        setCanUpload(response.canUpload !== false);
        
        if (teamId === null) {
          setAllMembers(response.members || []);
        }
      }
    } catch (error) {
      console.error('Load team members error:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDataClick = (record) => {
    if (!canUpload) {
      message.warning('คุณไม่มีสิทธิ์อัพโหลดข้อมูล');
      return;
    }
    setSelectedUser(record);
    setPhoneNumbers([]);
    setValidatedData(null);
    setFileName('');
    setUploadModalVisible(true);
  };

  const handleUploadAllClick = () => {
    if (!canUpload) {
      message.warning('คุณไม่มีสิทธิ์อัพโหลดข้อมูล');
      return;
    }
    setPhoneNumbers([]);
    setValidatedData(null);
    setFileName('');
    setUploadAllModalVisible(true);
  };

  const handleExtraPhoneChange = (e) => {
    const sanitizedPhone = e.target.value.replace(/\D/g, '').slice(0, 10);
    setExtraPhone(sanitizedPhone);

    if (isValidExtraPhone(sanitizedPhone)) {
      localStorage.setItem(LAST_EXTRA_PHONE_KEY, sanitizedPhone);
    }
  };

  const handleHistoryClick = async (record) => {
    setSelectedUser(record);
    setHistoryModalVisible(true);
    setHistoryLoading(true);
    
    try {
      const response = await phoneDataAPI.getHistory(record._id);
      if (response.success) {
        setHistory(response.history || []);
      }
    } catch (error) {
      console.error('Load history error:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดประวัติ');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (extraPhone && !isValidExtraPhone(extraPhone)) {
      message.error('กรุณากรอกเบอร์ 10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09');
      return Upload.LIST_IGNORE;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      const combinedPhoneNumbers = extraPhone ? [extraPhone, ...lines] : lines;
      setPhoneNumbers(combinedPhoneNumbers);
      
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setFileName(fileNameWithoutExt);
      
      try {
        const response = await phoneDataAPI.validate(combinedPhoneNumbers);
        if (response.success) {
          setValidatedData(response);
        }
      } catch (error) {
        console.error('Validate error:', error);
        message.error('เกิดข้อผิดพลาดในการตรวจสอบเบอร์โทร');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleUpload = async () => {
    if (!validatedData || validatedData.validCount === 0) {
      message.error('ไม่มีเบอร์โทรที่ถูกต้อง');
      return;
    }
    
    setUploading(true);
    try {
      const response = await phoneDataAPI.upload(selectedUser._id, validatedData.phoneNumbers, fileName.trim() || 'PHONE');
      if (response.success) {
        message.success(`อัพโหลดสำเร็จ ${response.data.totalCount} เบอร์`);
        setUploadModalVisible(false);
        setPhoneNumbers([]);
        setValidatedData(null);
        setFileName('');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('เกิดข้อผิดพลาดในการอัพโหลด');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadAll = async () => {
    if (!validatedData || validatedData.validCount === 0) {
      message.error('ไม่มีเบอร์โทรที่ถูกต้อง');
      return;
    }

    if (allMembers.length === 0) {
      message.error('ไม่มีสมาชิกในระบบ');
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const member of allMembers) {
        try {
          await phoneDataAPI.upload(member._id, validatedData.phoneNumbers, fileName.trim() || 'PHONE');
          successCount++;
        } catch (error) {
          console.error(`Upload to ${member.user} failed:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        message.success(`อัพโหลดสำเร็จ ${successCount} คน${failCount > 0 ? ` (ล้มเหลว ${failCount} คน)` : ''}`);
        setUploadAllModalVisible(false);
        setPhoneNumbers([]);
        setValidatedData(null);
        setFileName('');
      } else {
        message.error('อัพโหลดล้มเหลวทั้งหมด');
      }
    } catch (error) {
      console.error('Upload all error:', error);
      message.error('เกิดข้อผิดพลาดในการอัพโหลด');
    } finally {
      setUploading(false);
    }
  };

  const handleTeamChange = (value) => {
    setSelectedTeam(value);
  };

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
      width: isMobile ? 100 : 150,
      align: 'center',
      render: (text) => <Text strong style={{ fontSize: isMobile ? '12px' : '14px' }}>{text}</Text>,
    },
    {
      title: 'ทีม',
      dataIndex: ['team', 'name'],
      key: 'team',
      width: isMobile ? 100 : 150,
      align: 'center',
      render: (teamName) => (
        teamName ? (
          <Tag color="cyan" style={{ fontSize: isMobile ? '10px' : '12px' }}>
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
      width: isMobile ? 120 : 180,
      align: 'center',
      render: (date) => (
        <Text style={{ fontSize: isMobile ? '11px' : '12px', color: date ? '#ffffff' : '#8c8c8c' }}>
          {date ? (isMobile ? dayjs(date).format('DD/MM/YY HH:mm') : dayjs(date).format('DD/MM/YYYY HH:mm:ss')) : 'ยังไม่เคยล็อกอิน'}
        </Text>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: isMobile ? 70 : 100,
      align: 'center',
      render: (role) => (
        <Tag 
          color={role === 'Admin' ? 'red' : role === 'Head' ? 'orange' : 'blue'}
          style={{ fontSize: isMobile ? '10px' : '12px' }}
        >
          {role}
        </Tag>
      ),
    },
    {
      title: canUpload ? 'AddData' : 'ประวัติ',
      key: 'addData',
      width: isMobile ? 80 : 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          {canUpload && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="small"
              onClick={() => handleAddDataClick(record)}
              style={{ 
                backgroundColor: '#52c41a', 
                borderColor: '#52c41a',
                fontSize: isMobile ? '10px' : '12px'
              }}
            />
          )}
          <Button
            type="text"
            icon={<HistoryOutlined />}
            size="small"
            onClick={() => handleHistoryClick(record)}
            style={{ color: '#1890ff' }}
          />
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#000000' }}>
      <AppHeader title="Add Data" />

      <Content style={{ padding: '16px', background: '#000000' }}>
        <Card
          style={{
            background: '#000000',
            border: '1px solid #333333'
          }}
        >
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Title level={4} style={{ color: '#ffffff', margin: 0, fontSize: '16px' }}>
              รายชื่อสมาชิก
            </Title>
            <Space>
              {canUpload && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleUploadAllClick}
                  style={{ 
                    backgroundColor: '#1890ff', 
                    borderColor: '#1890ff',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: 'bold'
                  }}
                >
                  อัพ DATA ให้ทุกคน
                </Button>
              )}
              {canFilterTeam && (
                <Select
                  value={selectedTeam}
                  onChange={handleTeamChange}
                  style={{ width: isMobile ? 150 : 200 }}
                  placeholder="เลือกทีม"
                >
                  <Select.Option value="all">ทุกทีม</Select.Option>
                  {teams.map(team => (
                    <Select.Option key={team._id} value={team._id}>
                      {team.name}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </Space>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <Table
              columns={columns}
              dataSource={members}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: !isMobile,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} จาก ${total} รายการ`,
                size: isMobile ? 'small' : 'default'
              }}
              style={{
                background: '#000000',
                minWidth: isMobile ? '500px' : '700px'
              }}
              size={isMobile ? 'small' : 'default'}
              scroll={{ x: isMobile ? 500 : undefined }}
            />
          </div>
        </Card>
      </Content>

      <Modal
        title={`อัพโหลดเบอร์โทรให้ ${selectedUser?.user}`}
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setPhoneNumbers([]);
          setValidatedData(null);
          setFileName('');
        }}
        footer={
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              key="upload"
              type="primary"
              loading={uploading}
              disabled={!validatedData || validatedData.validCount === 0 || (extraPhone && !isValidExtraPhone(extraPhone))}
              onClick={handleUpload}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', minWidth: 80, height: 36 }}
            >
              อัพโหลด
            </Button>
          </div>
        }
        width={600}
      >
        <Input
          value={extraPhone}
          onChange={handleExtraPhoneChange}
          maxLength={10}
          placeholder="เพิ่มเบอร์ด้านบนสุด เช่น 08xxxxxxxx"
          inputMode="numeric"
          status={extraPhone && !isValidExtraPhone(extraPhone) ? 'error' : ''}
          style={{ marginBottom: 8 }}
        />

        <Dragger
          accept=".txt"
          beforeUpload={handleFileUpload}
          showUploadList={false}
          style={{ marginBottom: 16 }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: '#52c41a', fontSize: 48 }} />
          </p>
          <p className="ant-upload-text">คลิกหรือลากไฟล์ .txt มาวางที่นี่</p>
          <p className="ant-upload-hint">
            รูปแบบ: เบอร์โทร 1 แถว 1 เบอร์
          </p>
        </Dragger>

        {fileName && (
          <Card size="small" style={{ marginBottom: 16, background: '#f0f0f0' }}>
            <Text>ชื่อไฟล์: <Text strong>{fileName} จาก {user?.user}</Text></Text>
          </Card>
        )}

        {validatedData && (
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>จำนวนเบอร์ทั้งหมด: <Text strong>{validatedData.originalCount}</Text></Text>
              <Text>เบอร์ที่ถูกต้อง: <Text strong style={{ color: '#52c41a' }}>{validatedData.validCount}</Text></Text>
              <Text>เบอร์ที่ไม่ถูกต้อง/ซ้ำ: <Text strong style={{ color: '#ff4d4f' }}>{validatedData.invalidCount}</Text></Text>
              {extraPhone && isValidExtraPhone(extraPhone) && (
                <Text>เบอร์ออดิท: <Text strong>{extraPhone}</Text></Text>
              )}
            </Space>
          </Card>
        )}
      </Modal>

      <Modal
        title={`ประวัติการอัพโหลดของ ${selectedUser?.user}`}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              key="close" 
              onClick={() => setHistoryModalVisible(false)}
              style={{ minWidth: 80, height: 36 }}
            >
              ปิด
            </Button>
          </div>
        }
        width={500}
      >
        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Spin />
          </div>
        ) : (
          <List
            dataSource={history}
            locale={{ emptyText: 'ไม่มีประวัติการอัพโหลด' }}
            renderItem={(item) => (
              <List.Item>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>
                      {item.fileName 
                        ? `${item.fileName} จาก ${item.uploadedBy?.user || 'N/A'}`
                        : `จาก ${item.uploadedBy?.user || 'N/A'} ${dayjs(item.uploadedAt).format('DD MMM YYYY HH:mm')}`
                      }
                    </Text>
                  </Space>
                  <Space>
                    <Text>{item.totalCount} เบอร์</Text>
                    {item.isDeleted ? (
                      <Tag color="red">ลบแล้ว</Tag>
                    ) : (
                      <Tag color={item.isDownloaded ? 'green' : 'orange'}>
                        {item.isDownloaded ? 'ดาวน์โหลดแล้ว' : 'รอดาวน์โหลด'}
                      </Tag>
                    )}
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    เมื่อ: {dayjs(item.uploadedAt).format('DD/MM/YYYY HH:mm:ss')}
                  </Text>
                  {item.isDownloaded && item.downloadedAt && !item.isDeleted && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ดาวน์โหลดเมื่อ: {dayjs(item.downloadedAt).format('DD/MM/YYYY HH:mm:ss')}
                    </Text>
                  )}
                  {item.isDeleted && item.deletedAt && (
                    <Text type="secondary" style={{ fontSize: 12, color: '#ff4d4f' }}>
                      ลบเมื่อ: {dayjs(item.deletedAt).format('DD/MM/YYYY HH:mm:ss')}
                    </Text>
                  )}
                </Space>
              </List.Item>
            )}
          />
        )}
      </Modal>

      <Modal
        title="อัพโหลดเบอร์โทรให้ทุกคน"
        open={uploadAllModalVisible}
        onCancel={() => {
          setUploadAllModalVisible(false);
          setPhoneNumbers([]);
          setValidatedData(null);
          setFileName('');
        }}
        footer={
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              key="upload"
              type="primary"
              loading={uploading}
              disabled={!validatedData || validatedData.validCount === 0 || (extraPhone && !isValidExtraPhone(extraPhone))}
              onClick={handleUploadAll}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', minWidth: 180, height: 36 }}
            >
              {uploading ? 'กำลังอัพโหลด...' : `อัพโหลดให้ทุกคน (${allMembers.length} คน)`}
            </Button>
          </div>
        }
        width={600}
      >
        <Input
          value={extraPhone}
          onChange={handleExtraPhoneChange}
          maxLength={10}
          placeholder="เพิ่มเบอร์ออดิท"
          inputMode="numeric"
          status={extraPhone && !isValidExtraPhone(extraPhone) ? 'error' : ''}
          style={{ marginBottom: 8 }}
        />

        <Dragger
          accept=".txt"
          beforeUpload={handleFileUpload}
          showUploadList={false}
          style={{ marginBottom: 16 }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: '#52c41a', fontSize: 48 }} />
          </p>
          <p className="ant-upload-text">คลิกหรือลากไฟล์ .txt มาวางที่นี่</p>
          <p className="ant-upload-hint">
            รูปแบบ: เบอร์โทร 1 แถว 1 เบอร์
          </p>
        </Dragger>

        {fileName && (
          <Card size="small" style={{ marginBottom: 16, background: '#f0f0f0' }}>
            <Text>ชื่อไฟล์: <Text strong>{fileName} จาก {user?.user}</Text></Text>
          </Card>
        )}

        {validatedData && (
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>จำนวนเบอร์ทั้งหมด: <Text strong>{validatedData.originalCount}</Text></Text>
              <Text>เบอร์ที่ถูกต้อง: <Text strong style={{ color: '#52c41a' }}>{validatedData.validCount}</Text></Text>
              <Text>เบอร์ที่ไม่ถูกต้อง/ซ้ำ: <Text strong style={{ color: '#ff4d4f' }}>{validatedData.invalidCount}</Text></Text>
              {extraPhone && isValidExtraPhone(extraPhone) && (
                <Text>เบอร์ออดิท: <Text strong>{extraPhone}</Text></Text>
              )}
            </Space>
          </Card>
        )}
      </Modal>
    </Layout>
  );
};

export default AddData;
