import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    if (isAuthenticated() && user) {
      navigate(getRedirectPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values);
      if (result.success) {
        message.success('เข้าสู่ระบบสำเร็จ');
        navigate(getRedirectPath(result.user.role), { replace: true });
      } else {
        message.error(result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch {
      message.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="full-height flex-center"
      style={{
        background: 'var(--lambo-black)',
        flexDirection: 'column',
        padding: '24px',
        position: 'relative',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div className="lambo-brand" style={{ fontSize: '56px', lineHeight: 1 }}>
          LCA
        </div>
        <span style={{ width: 56, height: 3, background: 'var(--lambo-gold)', display: 'inline-block', marginTop: 14 }} />
        <div
          className="lambo-brand"
          style={{ fontSize: '12px', color: 'var(--lambo-ash)', letterSpacing: '0.3em', marginTop: 18 }}
        >
          ADMIN CONTROL
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'var(--lambo-charcoal)',
          border: '1px solid var(--lambo-border)',
          padding: '32px 28px',
        }}
      >
        <Form name="login" size="large" onFinish={onFinish} autoComplete="off" layout="vertical">
          <Form.Item
            label="ชื่อผู้ใช้"
            name="user"
            rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'var(--lambo-ash)' }} />}
              placeholder="ชื่อผู้ใช้"
              style={{ height: '44px' }}
            />
          </Form.Item>

          <Form.Item
            label="รหัสผ่าน"
            name="password"
            rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--lambo-ash)' }} />}
              placeholder="รหัสผ่าน"
              style={{ height: '44px' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ height: '46px', fontSize: '15px', fontWeight: 600 }}
            >
              {loading ? <Spin size="small" /> : 'เข้าสู่ระบบ'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;
