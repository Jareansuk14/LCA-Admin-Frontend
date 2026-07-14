import React, { useState } from 'react';
import { Input, Button, message, Spin } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { onlyDevAPI } from '../services/api';

const STORAGE_KEY = 'onlyDevVerified';

const OnlyDevGate = ({ children }) => {
  const [verified, setVerified] = useState(() => sessionStorage.getItem(STORAGE_KEY) === '1');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password.trim()) {
      message.error('กรุณากรอกรหัสผ่าน');
      return;
    }
    setLoading(true);
    try {
      const response = await onlyDevAPI.verify(password);
      if (response.success) {
        sessionStorage.setItem(STORAGE_KEY, '1');
        setVerified(true);
        message.success('ยืนยันสำเร็จ');
      } else {
        message.error(response.message || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'รหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  if (verified) return children;

  return (
    <div
      className="full-height flex-center"
      style={{ background: 'var(--lambo-black)', flexDirection: 'column', padding: 24 }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="lambo-brand" style={{ fontSize: '32px' }}>ONLY DEV</div>
        <span style={{ width: 40, height: 3, background: 'var(--lambo-gold)', display: 'inline-block', marginTop: 12 }} />
        <div style={{ color: 'var(--lambo-ash)', marginTop: 14, fontSize: 13, letterSpacing: '0.08em' }}>
          กรอกรหัสผ่านเพื่อเข้าถึงหน้านี้
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--lambo-charcoal)',
          border: '1px solid var(--lambo-border)',
          padding: '28px 24px',
        }}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: 'var(--lambo-ash)' }} />}
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPressEnter={handleSubmit}
          size="large"
          style={{ height: 44, marginBottom: 16 }}
        />
        <Button
          type="primary"
          block
          size="large"
          loading={loading}
          onClick={handleSubmit}
          style={{ height: 46, fontWeight: 600 }}
        >
          {loading ? <Spin size="small" /> : 'ยืนยัน'}
        </Button>
      </div>
    </div>
  );
};

export default OnlyDevGate;
