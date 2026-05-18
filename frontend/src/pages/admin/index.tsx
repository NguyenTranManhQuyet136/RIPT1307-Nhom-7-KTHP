import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Button, Card, Space, Typography, Avatar, Row, Col,
  ConfigProvider, theme, Statistic, Popover, Badge, Dropdown, List, Empty
} from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined, TeamOutlined, FileTextOutlined, UserOutlined,
  LogoutOutlined, BellOutlined, SettingOutlined, FireOutlined,
  UsergroupAddOutlined, BookOutlined, CommentOutlined,
  SafetyCertificateOutlined, LockOutlined, ExclamationCircleOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { history } from 'umi';
import moment from 'moment';
import 'moment/locale/vi';

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notificationLimit, setNotificationLimit] = useState<number>(10);
  const [activeToast, setActiveToast] = useState<{ id: any; type: string; message: string } | null>(null);

  const BASE_URL = 'http://localhost:8002';

  const showSuccess = (msg: string) => setActiveToast({ id: Date.now(), type: 'SUCCESS', message: msg });
  const showError = (msg: string) => setActiveToast({ id: Date.now(), type: 'ERROR', message: msg });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) { history.push('/auth'); return; }
    const parsed = JSON.parse(savedUser);
    if (parsed.role !== 'ADMIN') { history.push('/forum'); return; }
    setUser(parsed);
    fetchStats();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => setActiveToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

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
    } catch { showError('Lỗi kết nối server'); }
    finally { setLoading(false); }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/notifications/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (e) { console.error(e); }
  };

  const handleReadNotification = async (item: any) => {
    if (!item.is_read) {
      const token = localStorage.getItem('access_token');
      try {
        await fetch(`${BASE_URL}/api/notifications/${item.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ is_read: true })
        });
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
        setUnreadCount(c => Math.max(0, c - 1));
      } catch (e) { console.error(e); }
    }
    if (item.target_post_id) history.push(`/forum/post/${item.target_post_id}`);
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${BASE_URL}/api/notifications/mark_all_as_read/`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => { localStorage.clear(); history.push('/auth'); };

  const userMenuItems: MenuProps['items'] = [
    { key: 'forum', icon: <FireOutlined />, label: 'Về diễn đàn', onClick: () => history.push('/forum') },
    { key: 'profile', icon: <UserOutlined />, label: 'Tài khoản', onClick: () => history.push('/forum/profile') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout },
  ];

  const notificationContent = (
    <div style={{ width: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
        <Text strong style={{ fontSize: 16 }}>Thông báo</Text>
        {unreadCount > 0 && <a onClick={handleMarkAllAsRead} style={{ color: '#f48024', fontSize: 13 }}>Đánh dấu tất cả đã đọc</a>}
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifications.length > 0 ? (
          <>
            <List
              itemLayout="horizontal"
              dataSource={notifications.slice(0, notificationLimit)}
              renderItem={(item) => (
                <List.Item
                  onClick={() => handleReadNotification(item)}
                  style={{ cursor: 'pointer', padding: '10px 12px', borderRadius: 4, backgroundColor: item.is_read ? '#fff' : '#f0f8ff', marginBottom: 4, border: 'none' }}
                  className="notification-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                    <Avatar style={{ backgroundColor: '#f48024', flexShrink: 0 }} icon={<UserOutlined />} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#232629', fontWeight: item.is_read ? 400 : 500 }}>{item.message}</div>
                      <div style={{ fontSize: 11, color: '#6a737c', marginTop: 4 }}>{moment(item.created_at).fromNow()}</div>
                    </div>
                    {!item.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f48024', flexShrink: 0 }} />}
                  </div>
                </List.Item>
              )}
            />
            {notifications.length > notificationLimit && (
              <div style={{ textAlign: 'center', padding: '4px 0', borderTop: '1px solid #f0f0f0' }}>
                <Button type="text" onClick={(e) => { e.stopPropagation(); setNotificationLimit(prev => prev + 10); }} style={{ color: '#f48024', fontWeight: 500, fontSize: 13, width: '100%' }}>
                  Xem thêm
                </Button>
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <Empty description="Không có thông báo nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )}
      </div>
    </div>
  );

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
        {/* ── HEADER ── */}
        <Header style={{ background: '#fff', borderTop: '3px solid #f48024', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: 0, height: 56, display: 'flex', alignItems: 'center', position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1264, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => history.push('/admin')}>
              <FireOutlined style={{ color: '#f48024', marginRight: 4 }} />
              <span>edu<Text strong style={{ color: '#f48024' }}>forum</Text></span>
              <Text style={{ fontSize: 12, color: '#f48024', marginLeft: 8, fontWeight: 600, border: '1px solid #f48024', borderRadius: 3, padding: '1px 6px' }}>ADMIN</Text>
            </div>
            <div style={{ flex: 1 }} />
            <Space size={20}>
              {user && (
                <>
                  <Popover content={notificationContent} title={null} trigger="click" placement="bottom" transitionName="" motion={{ motionName: '' }}>
                    <Badge count={unreadCount} size="small" overflowCount={99}>
                      <Button type="text" icon={<BellOutlined style={{ fontSize: 20, color: '#525960' }} />} />
                    </Badge>
                  </Popover>
                  <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                    {user.avatar ? (
                      <Avatar src={user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`} style={{ cursor: 'pointer', border: '1px solid #e3e6e8' }} />
                    ) : (
                      <Avatar style={{ backgroundColor: '#f48024', cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>{user.username?.charAt(0).toUpperCase()}</Avatar>
                    )}
                  </Dropdown>
                </>
              )}
            </Space>
          </div>
        </Header>

        <Layout style={{ marginTop: 56 }}>
          {/* ── SIDER ── */}
          <Sider width={200} className="admin-sider" style={{ background: '#fff', borderRight: '1px solid #e3e6e8', position: 'fixed', height: 'calc(100vh - 56px)', left: 0, top: 56, zIndex: 100 }}>
            <Menu
              mode="inline"
              defaultSelectedKeys={['dashboard']}
              style={{ height: '100%', borderRight: 0, paddingTop: 16 }}
              onClick={({ key }) => {
                if (key === 'dashboard') history.push('/admin');
                if (key === 'users') history.push('/admin/users');
                if (key === 'posts') history.push('/admin/posts');
              }}
              items={[
                { key: 'dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
                { key: 'users', icon: <TeamOutlined />, label: 'Quản lý người dùng' },
                { key: 'posts', icon: <FileTextOutlined />, label: 'Quản lý bài đăng' },
              ]}
            />
          </Sider>

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

        {/* ── TOAST ── */}
        {activeToast && (
          <div onClick={() => setActiveToast(null)} style={{ position: 'fixed', bottom: 16, left: 16, width: 300, background: '#fff', borderRadius: 0, border: '1px solid #e3e6e8', padding: '14px 18px', cursor: 'pointer', zIndex: 9999, display: 'flex', gap: 12, alignItems: 'center' }}>
            <Avatar size={42} style={{ backgroundColor: activeToast.type === 'SUCCESS' ? '#52c41a' : '#ff4d4f', flexShrink: 0 }} icon={activeToast.type === 'SUCCESS' ? <ArrowUpOutlined /> : <ExclamationCircleOutlined />} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: activeToast.type === 'SUCCESS' ? '#52c41a' : '#ff4d4f' }}>
                {activeToast.type === 'SUCCESS' ? 'Thành công' : 'Lỗi'}
              </div>
              <div style={{ fontSize: 12.5, color: '#232629', lineHeight: 1.4 }}>{activeToast.message}</div>
            </div>
          </div>
        )}
      </Layout>
    </ConfigProvider>
  );
}
