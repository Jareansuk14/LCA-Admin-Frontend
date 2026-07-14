import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, message, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { usersAPI, teamsAPI } from '../services/api';

// Custom hook for responsive behavior
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

const { Option } = Select;

const UserModal = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  editingUser = null,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [showNewTeamInput, setShowNewTeamInput] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const { isMobile } = useResponsive();

  // Load teams when modal opens
  useEffect(() => {
    if (visible) {
      loadTeams();
    }
  }, [visible]);

  // Load teams function
  const loadTeams = async () => {
    setLoadingTeams(true);
    try {
      const response = await teamsAPI.getAll();
      if (response.success) {
        setTeams(response.teams);
      }
    } catch (error) {
      console.error('Load teams error:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลทีม');
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && editingUser) {
        // Set form values for editing
        form.setFieldsValue({
          user: editingUser.user,
          role: editingUser.role,
          team: editingUser.team?._id || null,
          password: '' // Don't show existing password
        });
      } else {
        // Reset form for creating
        form.resetFields();
        setShowNewTeamInput(false);
        setNewTeamName('');
      }
    }
  }, [visible, mode, editingUser, form]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      message.error('กรุณากรอกชื่อทีม');
      return;
    }

    try {
      setCreatingTeam(true);
      const response = await teamsAPI.create({ name: newTeamName.trim() });
      if (response.success) {
        message.success('สร้างทีมสำเร็จ');
        // Add new team to list and select it
        setTeams([...teams, response.team]);
        form.setFieldsValue({ team: response.team._id });
        setShowNewTeamInput(false);
        setNewTeamName('');
      }
    } catch (error) {
      console.error('Create team error:', error);
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างทีม';
      message.error(errorMessage);
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Prepare data
      const userData = {
        ...values,
        team: values.team || null
      };

      let result;
      if (mode === 'create') {
        result = await usersAPI.create(userData);
        message.success('เพิ่มผู้ใช้สำเร็จ');
      } else {
        // For editing, only send password if it's not empty
        const updateData = { 
          role: values.role,
          team: values.team || null
        };
        if (values.password && values.password.trim()) {
          updateData.password = values.password;
        }
        
        result = await usersAPI.update(editingUser._id, updateData);
        message.success('อัปเดตผู้ใช้สำเร็จ');
      }

      if (result.success) {
        form.resetFields();
        setShowNewTeamInput(false);
        setNewTeamName('');
        onSuccess();
      }
    } catch (error) {
      console.error('User modal error:', error);
      const errorMessage = error.response?.data?.message || 
        (mode === 'create' ? 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้' : 'เกิดข้อผิดพลาดในการอัปเดตผู้ใช้');
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setShowNewTeamInput(false);
    setNewTeamName('');
    onCancel();
  };

  return (
    <Modal
      title={mode === 'create' ? 'เพิ่มผู้ใช้ใหม่' : 'แก้ไขผู้ใช้'}
      open={visible}
      onCancel={handleCancel}
      destroyOnClose
      width={isMobile ? '90%' : 520}
      style={{
        top: isMobile ? '10%' : '20%'
      }}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        size="large"
      >
        <Form.Item
          label="ชื่อผู้ใช้"
          name="user"
          rules={[
            { required: true, message: 'กรุณากรอกชื่อผู้ใช้' },
            { min: 3, message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' },
            { max: 50, message: 'ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร' }
          ]}
        >
          <Input 
            placeholder="กรอกชื่อผู้ใช้"
            disabled={mode === 'edit'} // Don't allow username change in edit mode
            style={{
              height: '40px'
            }}
          />
        </Form.Item>

        <Form.Item
          label={mode === 'create' ? 'รหัสผ่าน' : 'รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)'}
          name="password"
          rules={mode === 'create' ? [
            { required: true, message: 'กรุณากรอกรหัสผ่าน' },
            { min: 4, message: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร' }
          ] : [
            { min: 4, message: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร' }
          ]}
        >
          <Input.Password 
            placeholder={mode === 'create' ? 'กรอกรหัสผ่าน' : 'กรอกรหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)'}
            style={{
              height: '40px'
            }}
          />
        </Form.Item>

        <Form.Item
          label="บทบาท"
          name="role"
          rules={[
            { required: true, message: 'กรุณาเลือกบทบาท' }
          ]}
        >
          <Select 
            placeholder="เลือกบทบาท"
            style={{
              height: '40px'
            }}
          >
            <Option value="Admin">Admin</Option>
            <Option value="Head">Head</Option>
            <Option value="User">User</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="ทีม"
          name="team"
        >
          <Select 
            placeholder="เลือกทีม (ไม่บังคับ)"
            allowClear
            loading={loadingTeams}
            style={{
              height: '40px'
            }}
            dropdownRender={(menu) => (
              <>
                {menu}
                <div style={{ padding: '8px', borderTop: '1px solid var(--lambo-border)' }}>
                  {showNewTeamInput ? (
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        placeholder="ชื่อทีมใหม่"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        onPressEnter={handleCreateTeam}
                        style={{ height: '32px' }}
                      />
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreateTeam}
                        loading={creatingTeam}
                        style={{ height: '32px' }}
                      >
                        สร้าง
                      </Button>
                      <Button
                        onClick={() => {
                          setShowNewTeamInput(false);
                          setNewTeamName('');
                        }}
                        style={{ height: '32px' }}
                      >
                        ยกเลิก
                      </Button>
                    </Space.Compact>
                  ) : (
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={() => setShowNewTeamInput(true)}
                      style={{ width: '100%', color: 'var(--lambo-gold)' }}
                    >
                      สร้างทีมใหม่
                    </Button>
                  )}
                </div>
              </>
            )}
          >
            {teams.map(team => (
              <Option key={team._id} value={team._id}>
                {team.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>

      {/* Custom Footer Buttons */}
      <div style={{
        marginTop: 24,
        paddingTop: 16,
        borderTop: '1px solid var(--lambo-border)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
      }}>
        <Button
          onClick={handleCancel}
          style={{
            height: '40px',
            minWidth: '80px',
            border: '1px solid var(--lambo-border)',
            backgroundColor: 'transparent',
            color: 'var(--lambo-white)',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          ยกเลิก
        </Button>
        <Button
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          style={{
            height: '40px',
            minWidth: '80px',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          {mode === 'create' ? 'เพิ่ม' : 'บันทึก'}
        </Button>
      </div>
    </Modal>
  );
};

export default UserModal;
