import React, { useState, useEffect } from 'react';
import { Layout, Typography, Space, Popover, Badge, Button, Dropdown, Avatar, List, Empty } from 'antd';
import { BellOutlined, UserOutlined, SettingOutlined, LogoutOutlined, FireOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { history } from 'umi';
import moment from 'moment';

const { Header } = Layout;
const { Text } = Typography;

const BASE_URL = 'http://localhost:8002';

interface AdminHeaderProps {
  user?: any;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ user }) => {
  const [localUser, setLocalUser] = useState<any>(null);
  const activeUser = user || localUser;

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notificationLimit, setNotificationLimit] = useState<number>(10);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setLocalUser(JSON.parse(savedUser));
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

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
    } catch (e) {
      console.error(e);
    }
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
      } catch (e) {
        console.error(e);
      }
    }
    if (item.target_post_id) {
      history.push(`/forum/post/${item.target_post_id}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${BASE_URL}/api/notifications/mark_all_as_read/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    history.push('/auth');
  };

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
        {unreadCount > 0 && (
          <a onClick={handleMarkAllAsRead} style={{ color: '#f48024', fontSize: 13 }}>
            Đánh dấu tất cả đã đọc
          </a>
        )}
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
                    {item.actor_avatar ? (
                      <Avatar 
                        src={item.actor_avatar.startsWith('http') ? item.actor_avatar : `${BASE_URL}${item.actor_avatar}`} 
                        style={{ flexShrink: 0 }} 
                      />
                    ) : (
                      <Avatar style={{ backgroundColor: '#f48024', flexShrink: 0 }} icon={<UserOutlined />} />
                    )}
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

  return (
    <Header style={{ background: '#fff', borderTop: '3px solid #f48024', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: 0, height: 56, display: 'flex', alignItems: 'center', position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1264, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => history.push('/admin')}>
          <img src="/favicon.png" alt="EduForum Logo" style={{ height: 28, marginRight: 8, objectFit: 'contain' }} />
          <span>edu<Text strong style={{ color: '#f48024' }}>forum</Text></span>
          <Text style={{ fontSize: 12, color: '#f48024', marginLeft: 8, fontWeight: 600, border: '1px solid #f48024', borderRadius: 3, padding: '1px 6px' }}>ADMIN</Text>
        </div>
        <div style={{ flex: 1 }} />
        <Space size={20}>
          {activeUser && (
            <>
              <Popover content={notificationContent} title={null} trigger="click" placement="bottom" transitionName="" motion={{ motionName: '' }}>
                <Badge count={unreadCount} size="small" overflowCount={99}>
                  <Button type="text" icon={<BellOutlined style={{ fontSize: 20, color: '#525960' }} />} />
                </Badge>
              </Popover>
              <Dropdown 
                menu={{ items: userMenuItems }} 
                placement="bottom" 
                arrow 
                trigger={['click']}
                transitionName=""
                motion={{ motionName: '' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                  {activeUser.avatar ? (
                    <Avatar src={activeUser.avatar.startsWith('http') ? activeUser.avatar : `${BASE_URL}${activeUser.avatar}`} style={{ border: '1px solid #e3e6e8' }} />
                  ) : (
                    <Avatar style={{ backgroundColor: '#f48024', fontWeight: 700, fontSize: 18 }}>{activeUser.username?.charAt(0).toUpperCase()}</Avatar>
                  )}
                  <span 
                    style={{ 
                      fontWeight: 500, 
                      color: '#3c4146', 
                      fontSize: 14,
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                      verticalAlign: 'middle'
                    }}
                    title={activeUser.full_name || activeUser.username}
                  >
                    {activeUser.full_name || activeUser.username}
                  </span>
                </div>
              </Dropdown>
            </>
          )}
        </Space>
      </div>
    </Header>
  );
};
