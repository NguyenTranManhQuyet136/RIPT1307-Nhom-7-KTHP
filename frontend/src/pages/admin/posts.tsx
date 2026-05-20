import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Button, Card, Space, Typography, Avatar, Table,
  ConfigProvider, theme, Popover, Badge, Dropdown, Empty, Tag, Input,
  Drawer, Tooltip, Popconfirm, Divider, Row, Col, Statistic
} from 'antd';
import {
  DashboardOutlined, TeamOutlined, FileTextOutlined, UserOutlined,
  LogoutOutlined, BellOutlined, FireOutlined, SearchOutlined,
  DeleteOutlined, EyeOutlined, ArrowUpOutlined, ExclamationCircleOutlined,
  MessageOutlined, StarOutlined
} from '@ant-design/icons';
import { history } from 'umi';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function AdminPosts() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeToast, setActiveToast] = useState<{ id: any; type: string; message: string } | null>(null);

  // Detail Drawer state
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postDetailLoading, setPostDetailLoading] = useState(false);

  const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://eduforum-1am3.onrender.com' 
    : 'http://localhost:8002';


  const showSuccess = (msg: string) => setActiveToast({ id: Date.now(), type: 'SUCCESS', message: msg });
  const showError = (msg: string) => setActiveToast({ id: Date.now(), type: 'ERROR', message: msg });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) { history.push('/auth'); return; }
    const parsed = JSON.parse(savedUser);
    if (parsed.role !== 'ADMIN') { history.push('/forum'); return; }
    setUser(parsed);
    
    fetchPosts();
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

  const fetchPosts = async (search?: string) => {
    const token = localStorage.getItem('access_token');
    setLoading(true);
    try {
      let url = `${BASE_URL}/api/admin/posts/`;
      if (search) url += `?search=${encodeURIComponent(search)}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.results || (Array.isArray(data) ? data : []));
      } else {
        showError('Không thể tải danh sách bài đăng');
      }
    } catch { showError('Lỗi kết nối server'); }
    finally { setLoading(false); }
  };

  const fetchPostDetail = async (postId: number) => {
    const token = localStorage.getItem('access_token');
    setPostDetailLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/posts/${postId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedPost(await res.json());
      } else {
        showError('Không thể tải chi tiết bài đăng');
        setIsDetailDrawerOpen(false);
      }
    } catch { 
      showError('Lỗi kết nối server');
      setIsDetailDrawerOpen(false);
    }
    finally { setPostDetailLoading(false); }
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

  // ── ACTIONS ──

  const handleDeletePost = async (postId: number) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/posts/${postId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok || res.status === 204) {
        showSuccess('Đã xóa bài đăng thành công. Email thông báo đã được gửi cho tác giả.');
        fetchPosts(searchQuery);
        if (selectedPost && selectedPost.id === postId) {
          setIsDetailDrawerOpen(false);
        }
      } else {
        showError('Có lỗi xảy ra khi xóa bài đăng');
      }
    } catch { showError('Lỗi kết nối server'); }
  };

  const handleOpenDetail = (record: any) => {
    setIsDetailDrawerOpen(true);
    fetchPostDetail(record.id);
  };

  // ── RENDER HELPERS ──

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: '35%',
      render: (text: string, record: any) => (
        <div>
          <a onClick={() => handleOpenDetail(record)} style={{ fontWeight: 500, color: '#0074cc' }}>
            {text.length > 60 ? text.substring(0, 60) + '...' : text}
          </a>
          {record.tags && record.tags.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {record.tags.map((tag: any) => (
                <Tag key={tag.id} style={{ color: '#39739d', backgroundColor: '#e1ecf4', border: 'none' }}>
                  {tag.name}
                </Tag>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Tác giả',
      key: 'author',
      render: (_: any, record: any) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#f48024' }}>
            {record.author_name ? record.author_name.charAt(0).toUpperCase() : '?'}
          </Avatar>
          <Text>{record.author_name}</Text>
        </Space>
      ),
    },
    {
      title: 'Tương tác',
      key: 'stats',
      render: (_: any, record: any) => (
        <Space size="middle" style={{ color: '#6a737c' }}>
          <Tooltip title="Lượt xem"><Space size={4}><EyeOutlined /> {record.view_count}</Space></Tooltip>
          <Tooltip title="Bình luận"><Space size={4}><MessageOutlined /> {record.comment_count}</Space></Tooltip>
          <Tooltip title="Điểm Vote">
            <Space size={4} style={{ color: record.score > 0 ? '#52c41a' : record.score < 0 ? '#ff4d4f' : undefined }}>
              <StarOutlined /> {record.score}
            </Space>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Ngày đăng',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => moment(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleOpenDetail(record)} />
          </Tooltip>

          <Popconfirm
            title="Xóa bài đăng này?"
            description="Hành động này không thể hoàn tác. Một email thông báo sẽ được gửi cho tác giả."
            onConfirm={() => handleDeletePost(record.id)}
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
          >
            <Tooltip title="Xóa bài viết">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleLogout = () => { localStorage.clear(); history.push('/auth'); };

  const notificationContent = (
    <div style={{ width: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
        <Text strong style={{ fontSize: 16 }}>Thông báo</Text>
      </div>
      <div style={{ padding: '24px 0', textAlign: 'center' }}>
        <Empty description="Tính năng đang cập nhật" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    </div>
  );

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#f48024', borderRadius: 4, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' } }}>
      <style>{`
        .ant-popover, .ant-popover-content, .ant-dropdown, .ant-dropdown-menu { transition: none !important; animation: none !important; }
        .admin-sider .ant-menu-item-selected { background-color: #fff7e6 !important; color: #f48024 !important; }
        .admin-sider .ant-menu-item-selected::after { border-right-color: #f48024 !important; }
        .admin-sider .ant-menu-item:hover { color: #f48024 !important; }
      `}</style>
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        {/* ── HEADER ── */}
        <Header style={{ background: '#fff', borderTop: '3px solid #f48024', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: 0, height: 56, display: 'flex', alignItems: 'center', position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1264, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => history.push('/admin')}>
              <img src="/favicon.png" alt="EduForum Logo" style={{ height: 28, marginRight: 8, objectFit: 'contain' }} />
              <span>edu<Text strong style={{ color: '#f48024' }}>forum</Text></span>
              <Text style={{ fontSize: 12, color: '#f48024', marginLeft: 8, fontWeight: 600, border: '1px solid #f48024', borderRadius: 3, padding: '1px 6px' }}>ADMIN</Text>
            </div>
            <div style={{ flex: 1 }} />
            <Space size={20}>
              {user && (
                <>
                  <Popover content={notificationContent} title={null} trigger="click" placement="bottom">
                    <Badge count={unreadCount} size="small" overflowCount={99}>
                      <Button type="text" icon={<BellOutlined style={{ fontSize: 20, color: '#525960' }} />} />
                    </Badge>
                  </Popover>
                  <Dropdown 
                    menu={{ items: [
                      { key: 'forum', icon: <FireOutlined />, label: 'Về diễn đàn', onClick: () => history.push('/forum') },
                      { key: 'profile', icon: <UserOutlined />, label: 'Tài khoản', onClick: () => history.push('/forum/profile') },
                      { type: 'divider' },
                      { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout },
                    ]}} 
                    placement="bottom" 
                    arrow 
                    trigger={['click']}
                    transitionName=""
                    motion={{ motionName: '' }}
                  >
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
              defaultSelectedKeys={['posts']}
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
          <Content style={{ marginLeft: 200, padding: 24, minHeight: 'calc(100vh - 56px)' }}>
            <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>Quản lý Bài đăng</Title>
                <Space>
                  <Input 
                    placeholder="Tìm tiêu đề, tác giả..." 
                    prefix={<SearchOutlined />}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onPressEnter={() => fetchPosts(searchQuery)}
                    style={{ width: 250 }}
                    allowClear
                  />
                  <Button type="primary" onClick={() => fetchPosts(searchQuery)}>Tìm kiếm</Button>
                </Space>
              </div>

              <Table 
                columns={columns} 
                dataSource={posts} 
                rowKey="id" 
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            </Card>
          </Content>
        </Layout>

        {/* ── DETAIL DRAWER ── */}
        <Drawer
          title={<Text strong style={{ fontSize: 18 }}>Chi tiết bài đăng</Text>}
          placement="right"
          onClose={() => setIsDetailDrawerOpen(false)}
          open={isDetailDrawerOpen}
          width={700}
        >
          {postDetailLoading ? (
            <div style={{ textAlign: 'center', padding: 50 }}>Đang tải...</div>
          ) : selectedPost ? (
            <div>
              <Title level={3}>{selectedPost.title}</Title>
              <Space style={{ marginBottom: 16 }}>
                <Avatar style={{ backgroundColor: '#f48024' }} size="small">
                  {selectedPost.author_name ? selectedPost.author_name.charAt(0).toUpperCase() : '?'}
                </Avatar>
                <Text strong style={{ color: '#0074cc' }}>{selectedPost.author_name}</Text>
                <Text type="secondary">•</Text>
                <Text type="secondary">{moment(selectedPost.created_at).format('DD/MM/YYYY HH:mm')}</Text>
              </Space>

              <div style={{ marginBottom: 24 }}>
                {selectedPost.tags?.map((tag: any) => (
                  <Tag key={tag.id} style={{ color: '#39739d', backgroundColor: '#e1ecf4', border: 'none', padding: '2px 8px' }}>
                    {tag.name}
                  </Tag>
                ))}
              </div>

              <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 16, lineHeight: 1.6 }}>
                {selectedPost.content}
              </Paragraph>

              <Divider />

              <Row gutter={16} style={{ textAlign: 'center' }}>
                <Col span={8}>
                  <Statistic title="Lượt xem" value={selectedPost.view_count} prefix={<EyeOutlined />} />
                </Col>
                <Col span={8}>
                  <Statistic title="Điểm Vote" value={selectedPost.score} prefix={<StarOutlined />} valueStyle={{ color: selectedPost.score > 0 ? '#52c41a' : selectedPost.score < 0 ? '#ff4d4f' : undefined }} />
                </Col>
                <Col span={8}>
                  <Statistic title="Bình luận" value={selectedPost.comment_count} prefix={<MessageOutlined />} />
                </Col>
              </Row>

              <Divider />

              <div style={{ textAlign: 'right' }}>
                <Popconfirm
                  title="Xóa bài đăng này?"
                  description="Hành động này không thể hoàn tác. Một email thông báo sẽ được gửi cho tác giả."
                  onConfirm={() => handleDeletePost(selectedPost.id)}
                  okText="Xóa"
                  okButtonProps={{ danger: true }}
                  cancelText="Hủy"
                >
                  <Button danger icon={<DeleteOutlined />} type="primary">Xóa bài viết</Button>
                </Popconfirm>
              </div>
            </div>
          ) : (
            <Empty description="Không tìm thấy dữ liệu" />
          )}
        </Drawer>

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
