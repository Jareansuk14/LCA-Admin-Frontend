import React, { useState, useEffect } from 'react';
import { Layout, Table, Button, Card, message, Popconfirm, Space } from 'antd';
import { DownloadOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import AppHeader from '../components/AppHeader';
import { hookDataAPI } from '../services/api';
import dayjs from 'dayjs';

const { Content } = Layout;

const HookData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await hookDataAPI.getAll();
      if (response.success) setData(response.data || []);
    } catch {
      message.error('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDownload = async (record) => {
    setDownloadingId(record._id);
    try {
      const blob = await hookDataAPI.download(record._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `วันที่${dayjs(record.uploadedAt).format('DD-MM-YYYY')} เวลา ${dayjs(record.uploadedAt).format('HH.mm.ss')} จำนวน ${record.totalCount} เบอร์.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('ดาวน์โหลดไม่สำเร็จ');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (record) => {
    setDeletingId(record._id);
    try {
      const response = await hookDataAPI.delete(record._id);
      if (response.success) {
        message.success('ลบสำเร็จ');
        loadData();
      }
    } catch {
      message.error('ลบไม่สำเร็จ');
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    { title: 'ลำดับ', dataIndex: 'no', key: 'no', width: '7%', align: 'center' },
    { title: 'User', dataIndex: 'user', key: 'user', width: '12%', align: 'center' },
    { title: 'ทีม', dataIndex: 'team', key: 'team', width: '12%', align: 'center' },
    {
      title: 'วันเวลาที่อัพโหลด',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: '28%',
      align: 'center',
      render: (v) => dayjs(v).format('DD/MM/YYYY HH:mm:ss')
    },
    {
      title: 'จำนวนเบอร์',
      dataIndex: 'totalCount',
      key: 'totalCount',
      width: '12%',
      align: 'center',
      render: (v) => v?.toLocaleString()
    },
    {
      title: 'จัดการ',
      key: 'actions',
      width: '29%',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="small"
            loading={downloadingId === record._id}
            onClick={() => handleDownload(record)}
          >
            .txt
          </Button>
          <Popconfirm
            title="ยืนยันการลบ"
            description="ลบข้อมูลนี้ออกจากระบบ?"
            onConfirm={() => handleDelete(record)}
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={deletingId === record._id}
            >
              ลบ
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--lambo-black)' }}>
      <AppHeader title="Hook Data" />
      <Content style={{ padding: 24, background: 'var(--lambo-black)' }}>
        <Card
          className="lambo-panel"
          style={{ background: 'var(--lambo-iron)', border: '1px solid var(--lambo-border)' }}
          title={
            <div>
              <div className="lambo-section-title" style={{ fontSize: '20px' }}>ข้อมูลเบอร์จาก Local DATA</div>
              <span className="lambo-gold-bar" style={{ marginTop: 6 }} />
            </div>
          }
          extra={
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              รีเฟรช
            </Button>
          }
        >
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={data}
            loading={loading}
            tableLayout="fixed"
            pagination={{ pageSize: 20, showSizeChanger: true }}
            size="middle"
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default HookData;
