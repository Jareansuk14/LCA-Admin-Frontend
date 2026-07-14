import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

const getRedirectPath = (role) => {
  switch (role) {
    case 'Admin':
      return '/dashboard';
    case 'Head':
      return '/AddData';
    default:
      return '/login';
  }
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated() && user) {
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values);
      
      if (result.success) {
        message.success('เข้าสู่ระบบสำเร็จ');
        const redirectPath = getRedirectPath(result.user.role);
        navigate(redirectPath, { replace: true });
      } else {
        message.error(result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="full-height flex-center responsive-padding" style={{ background: '#000000' }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#111111',
          border: '1px solid #333333',
          boxShadow: '0 4px 12px rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="text-center mb-4">
          <Title level={2} style={{ color: '#ffffff', marginBottom: 8, fontSize: '20px' }}>
            LCA-Admin
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            เข้าสู่ระบบ
          </Text>
        </div>

        <Form
          name="login"
          size="large"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="ชื่อผู้ใช้"
            name="user"
            rules={[
              {
                required: true,
                message: 'กรุณากรอกชื่อผู้ใช้',
              },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#8c8c8c' }} />}
              placeholder="ชื่อผู้ใช้"
              style={{
                backgroundColor: '#1a1a1a',
                borderColor: '#333333',
                color: '#ffffff',
                height: '40px'
              }}
            />
          </Form.Item>

          <Form.Item
            label="รหัสผ่าน"
            name="password"
            rules={[
              {
                required: true,
                message: 'กรุณากรอกรหัสผ่าน',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#8c8c8c' }} />}
              placeholder="รหัสผ่าน"
              style={{
                backgroundColor: '#1a1a1a',
                borderColor: '#333333',
                color: '#ffffff',
                height: '40px'
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#ffffff',
                color: '#000000',
                fontWeight: 500,
                height: '44px',
                fontSize: '16px'
              }}
            >
              {loading ? <Spin size="small" /> : 'เข้าสู่ระบบ'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
