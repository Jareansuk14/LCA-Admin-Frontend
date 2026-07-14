import React, { useState, useEffect } from 'react';
import { Layout, Table, Button, Card, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import AppHeader from '../components/AppHeader';
import { hookDataAPI } from '../services/api';
import dayjs from 'dayjs';

const { Content } = Layout;

const HookData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

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
      a.download = record.fileName || `${record.user}_${dayjs(record.uploadedAt).format('YYYY-MM-DD')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('ดาวน์โหลดไม่สำเร็จ');
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    { title: 'ลำดับ', dataIndex: 'no', key: 'no', width: 70, align: 'center' },
    { title: 'User', dataIndex: 'user', key: 'user' },
    { title: 'ทีม', dataIndex: 'team', key: 'team' },
    {
      title: 'วันเวลาที่อัพโหลด',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: (v) => dayjs(v).format('DD/MM/YYYY HH:mm:ss')
    },
    {
      title: 'จำนวนเบอร์',
      dataIndex: 'totalCount',
      key: 'totalCount',
      align: 'right',
      render: (v) => v?.toLocaleString()
    },
    {
      title: 'ดาวน์โหลด',
      key: 'download',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          size="small"
          loading={downloadingId === record._id}
          onClick={() => handleDownload(record)}
        >
          .txt
        </Button>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <AppHeader title="Hook Data" />
      <Content style={{ padding: 24 }}>
        <Card
          style={{ background: '#141414', border: '1px solid #333' }}
          title={<span style={{ color: '#fff' }}>ข้อมูลเบอร์จาก Local DATA</span>}
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
            pagination={{ pageSize: 20, showSizeChanger: true }}
            size="middle"
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default HookData;
