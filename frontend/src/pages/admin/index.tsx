import React, { useState, useEffect } from 'react';
import {
  Layout, Button, Card, Space, Typography, Avatar, Row, Col,
  ConfigProvider, theme, message
} from 'antd';
import {
  TeamOutlined, SettingOutlined, FireOutlined,
  UsergroupAddOutlined, BookOutlined, CommentOutlined,
  SafetyCertificateOutlined, LockOutlined, ExclamationCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { history } from 'umi';
import moment from 'moment';
import 'moment/locale/vi';
import { AdminHeader } from './components/AdminHeader';
import { AdminSider } from './components/AdminSider';

moment.locale('vi');

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

interface StatsData {
  total_users: number;
  total_students: number;
  total_lecturers: number;
  total_admins: number;
  total_posts: number;
  total_comments: number;
  unverified_lecturers: number;
  locked_users: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

  const BASE_URL = 'http://localhost:8002';

  const showSuccess = (msg: string) => message.success(msg);
  const showError = (msg: string) => message.error(msg);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) { history.push('/auth'); return; }
    const parsed = JSON.parse(savedUser);
    if (parsed.role !== 'ADMIN') { history.push('/forum'); return; }
    setUser(parsed);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('access_token');
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/stats/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setStats(await res.json());
      } else {
        showError('Không thể tải dữ liệu thống kê');
      }
    } catch {
      showError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Tổng người dùng', value: stats?.total_users || 0, icon: <TeamOutlined />, color: '#1890ff', bg: '#e6f7ff' },
    { title: 'Giảng viên', value: stats?.total_lecturers || 0, icon: <SafetyCertificateOutlined />, color: '#722ed1', bg: '#f9f0ff' },
    { title: 'Bài đăng', value: stats?.total_posts || 0, icon: <BookOutlined />, color: '#f48024', bg: '#fff7e6' },
    { title: 'Bình luận', value: stats?.total_comments || 0, icon: <CommentOutlined />, color: '#52c41a', bg: '#f6ffed' },
  ];

  const alertCards = [
    { title: 'GV chờ duyệt', value: stats?.unverified_lecturers || 0, icon: <ExclamationCircleOutlined />, color: '#faad14', bg: '#fffbe6', onClick: () => history.push('/admin/users') },
    { title: 'Tài khoản bị khóa', value: stats?.locked_users || 0, icon: <LockOutlined />, color: '#ff4d4f', bg: '#fff2f0', onClick: () => history.push('/admin/users') },
    { title: 'Sinh viên', value: stats?.total_students || 0, icon: <UsergroupAddOutlined />, color: '#13c2c2', bg: '#e6fffb', onClick: () => history.push('/admin/users') },
    { title: 'Quản trị viên', value: stats?.total_admins || 0, icon: <SettingOutlined />, color: '#eb2f96', bg: '#fff0f6', onClick: () => history.push('/admin/users') },
  ];

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#f48024', borderRadius: 4, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' } }}>
      <style>{`
        .ant-popover, .ant-popover-content, .ant-dropdown, .ant-dropdown-menu { transition: none !important; animation: none !important; }
        .notification-item:hover { background-color: #e6f7ff !important; }
        .admin-stat-card { transition: all 0.3s ease; cursor: default; }
        .admin-stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
        .admin-alert-card { transition: all 0.3s ease; cursor: pointer; }
        .admin-alert-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; }
        .admin-sider .ant-menu-item-selected { background-color: #fff7e6 !important; color: #f48024 !important; }
        .admin-sider .ant-menu-item-selected::after { border-right-color: #f48024 !important; }
        .admin-sider .ant-menu-item:hover { color: #f48024 !important; }
      `}</style>
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <AdminHeader user={user} />

        <Layout style={{ marginTop: 56 }}>
          <AdminSider activeKey="dashboard" />

          {/* ── CONTENT ── */}
          <Content style={{ marginLeft: 200, padding: 24, minHeight: 'calc(100vh - 56px)', background: '#f5f5f5' }}>
            <div style={{ maxWidth: 1064, margin: '0 auto' }}>
              <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0, fontWeight: 600 }}>Tổng quan hệ thống</Title>
                <Text type="secondary">Xin chào, {user?.full_name || user?.username}! Đây là bảng điều khiển quản trị EduForum.</Text>
              </div>

              {/* Stats Cards */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {statCards.map((item, idx) => (
                  <Col xs={24} sm={12} lg={6} key={idx}>
                    <Card className="admin-stat-card" bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <Text type="secondary" style={{ fontSize: 13 }}>{item.title}</Text>
                          <div style={{ fontSize: 32, fontWeight: 700, color: item.color, lineHeight: 1.2, marginTop: 4 }}>{item.value}</div>
                        </div>
                        <div style={{ width: 56, height: 56, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: item.color }}>
                          {item.icon}
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Alert / Detail Cards */}
              <Row gutter={[16, 16]}>
                {alertCards.map((item, idx) => (
                  <Col xs={24} sm={12} lg={6} key={idx}>
                    <Card className="admin-alert-card" bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `3px solid ${item.color}` }} onClick={item.onClick}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: item.color }}>
                          {item.icon}
                        </div>
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>{item.title}</Text>
                          <div style={{ fontSize: 22, fontWeight: 700, color: item.color, lineHeight: 1.2 }}>{item.value}</div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Quick Actions */}
              <Card bordered={false} style={{ marginTop: 24, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <Title level={5} style={{ marginTop: 0 }}>Thao tác nhanh</Title>
                <Space size={12}>
                  <Button type="primary" icon={<TeamOutlined />} onClick={() => history.push('/admin/users')}>Quản lý người dùng</Button>
                  <Button icon={<FileTextOutlined />} onClick={() => history.push('/admin/posts')}>Quản lý bài đăng</Button>
                  <Button icon={<FireOutlined />} onClick={() => history.push('/forum')}>Về diễn đàn</Button>
                </Space>
              </Card>
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
