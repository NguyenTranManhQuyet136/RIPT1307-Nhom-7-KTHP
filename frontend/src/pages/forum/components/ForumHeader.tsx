import React from 'react';
import { Layout, Typography, Badge, Button, Avatar, Popover, Dropdown, List, Empty } from 'antd';
import { 
  SearchOutlined, 
  BellOutlined, 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined 
} from '@ant-design/icons';
import { history } from 'umi';
import moment from 'moment';
import type { MenuProps } from 'antd';

const { Header } = Layout;
const { Text } = Typography;

interface ForumHeaderProps {
  user: any;
  unreadCount: number;
  notifications: any[];
  notificationLimit: number;
  setNotificationLimit: React.Dispatch<React.SetStateAction<number>>;
  handleReadNotification: (item: any) => void;
  handleMarkAllAsRead: () => void;
  handleLogout: () => void;
  filterByTag: (tag: string | null) => void;
  executeSearch: () => void;
  editorRef: React.RefObject<HTMLDivElement>;
  editorEmpty: boolean;
  setEditorEmpty: React.Dispatch<React.SetStateAction<boolean>>;
  isFocused: boolean;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
  handleEditorInput: (e: React.FormEvent<HTMLDivElement>) => void;
  handleEditorKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  BASE_URL: string;
}

const ForumHeader: React.FC<ForumHeaderProps> = ({
  user,
  unreadCount,
  notifications,
  notificationLimit,
  setNotificationLimit,
  handleReadNotification,
  handleMarkAllAsRead,
  handleLogout,
  filterByTag,
  executeSearch,
  editorRef,
  editorEmpty,
  setEditorEmpty,
  isFocused,
  setIsFocused,
  handleEditorInput,
  handleEditorKeyDown,
  BASE_URL
}) => {
  const userMenuItems: MenuProps['items'] = [
    ...(user?.role === 'ADMIN' ? [{ key: 'admin', icon: <SettingOutlined />, label: 'Trang quản trị', onClick: () => history.push('/admin') }] : []),
    { key: 'profile', icon: <UserOutlined />, label: 'Tài khoản', onClick: () => history.push('/forum/profile') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout },
  ];

  const notificationContent = (
    <div style={{ width: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
        <Text strong style={{ fontSize: 16 }}>Thông báo</Text>
        {unreadCount > 0 && (
          <a onClick={handleMarkAllAsRead} className="notification-action-link">
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
                  style={{
                    cursor: 'pointer',
                    padding: '10px 12px',
                    borderRadius: 4,
                    backgroundColor: item.is_read ? '#fff' : '#f0f8ff',
                    transition: 'background-color 0.2s',
                    marginBottom: 4,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                  className="notification-item"
                >
                  {item.actor_avatar ? (
                    <Avatar 
                      src={item.actor_avatar.startsWith('http') ? item.actor_avatar : `${BASE_URL}${item.actor_avatar}`} 
                      style={{ flexShrink: 0 }} 
                    />
                  ) : (
                    <Avatar 
                      style={{ backgroundColor: item.notification_type === 'WELCOME' ? '#f48024' : '#0074cc', flexShrink: 0 }}
                      icon={<UserOutlined />}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: 13, 
                      color: '#232629', 
                      lineHeight: 1.4,
                      fontWeight: item.is_read ? 400 : 500 
                    }}>
                      {item.message}
                    </div>
                    <div style={{ fontSize: 11, color: '#6a737c', marginTop: 4 }}>
                      {moment(item.created_at).fromNow()}
                    </div>
                  </div>
                  {!item.is_read && (
                    <div style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: '#f48024', 
                      flexShrink: 0 
                    }} />
                  )}
                </List.Item>
              )}
            />
            {notifications.length > notificationLimit && (
              <div style={{ textAlign: 'center', padding: '4px 0', borderTop: '1px solid #f0f0f0', marginTop: 4 }}>
                <Button 
                  type="text" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotificationLimit(prev => prev + 10);
                  }}
                  className="notification-more-btn"
                >
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
    <Header style={{ 
      background: '#fff', 
      borderTop: '3px solid #f48024', 
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
      padding: 0,
      height: 56,
      display: 'flex',
      alignItems: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1264, margin: '0 auto' }}>
        <div 
          style={{ fontSize: 22, fontWeight: 800, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', width: 164 }}
          onClick={() => { filterByTag(null); history.push('/forum'); }}
        >
          <img src="/favicon.png" alt="EduForum Logo" style={{ height: 28, marginRight: 8, objectFit: 'contain' }} />
          <span>edu<Text strong style={{ color: '#f48024' }}>forum</Text></span>
        </div>

        <div style={{ flex: 1, padding: '0 24px 0 0', margin: '0 0 0 46px', display: 'flex', alignItems: 'center', maxWidth: 800 }}>
        <style>{`
          .forum-search-editor {
            position: relative;
            border: 1px solid #d9d9d9;
            border-radius: 3px 0 0 3px;
            padding: 4px 11px;
            height: 32px;
            box-sizing: border-box;
            white-space: nowrap;
            overflow-x: auto;
            overflow-y: hidden;
            outline: none;
            background-color: #fff;
            flex: 1;
            min-width: 0;
            width: 0;
            cursor: text;
            font-size: 14px;
            line-height: 22px;
            transition: all 0.3s;
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          .forum-search-editor::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
          }
          .forum-search-editor:hover {
            border-color: #f48024;
          }
          .forum-search-editor:focus {
            border-color: #f48024;
            box-shadow: 0 0 0 2px rgba(244, 128, 36, 0.2);
          }
          .forum-search-editor.show-placeholder:before {
            content: attr(placeholder);
            color: #bfbfbf;
            cursor: text;
            pointer-events: none;
            position: absolute;
            left: 11px;
            top: 4px;
          }
          .forum-search-tag {
            background-color: #e1ecf4;
            color: #39739d;
            border-radius: 2px;
            padding: 0 6px;
            margin: 0 2px;
            display: inline-block;
            font-weight: 500;
            user-select: none;
          }
          .forum-search-tag:hover {
            background-color: #d0e3f0;
          }
          .notification-item:hover {
            background-color: #e6f7ff !important;
          }
          .notification-action-link {
            color: #f48024 !important;
            font-size: 13px;
            transition: color 0.2s;
          }
          .notification-action-link:hover {
            color: #e06d0f !important;
          }
          .notification-more-btn {
            color: #f48024 !important;
            font-weight: 500;
            font-size: 13px;
            width: 100%;
            padding: 4px 0;
            transition: all 0.2s;
          }
          .notification-more-btn:hover {
            color: #e06d0f !important;
            background-color: #fdf6f0 !important;
          }
          .ant-popover, .ant-popover-content, .ant-dropdown, .ant-dropdown-menu {
            transition: none !important;
            animation: none !important;
          }
          .online-dot-pulse {
            display: inline-block;
            width: 6px;
            height: 6px;
            background-color: #52c41a;
            border-radius: 50%;
            margin-right: 6px;
            box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7);
            animation: pulse 1.6s infinite;
            vertical-align: middle;
          }
          @keyframes pulse {
            0% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7);
            }
            70% {
              transform: scale(1);
              box-shadow: 0 0 0 5px rgba(82, 196, 26, 0);
            }
            100% {
              transform: scale(0.95);
              box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
            }
          }
          .post-item-card:hover {
            background-color: #fafbfc;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          }
          .post-title-link:hover {
            text-decoration: underline !important;
          }
        `}</style>
        <div
          ref={editorRef}
          className={`forum-search-editor ${editorEmpty ? 'show-placeholder' : ''}`}
          contentEditable
          onInput={handleEditorInput}
          onKeyDown={handleEditorKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Tìm kiếm... (Sử dụng #tag để lọc theo thẻ)"
          style={{
            borderColor: isFocused ? '#f48024' : '#d9d9d9',
            boxShadow: isFocused ? '0 0 0 2px rgba(244, 128, 36, 0.2)' : 'none',
          }}
        />
        <Button 
          type="primary" 
          icon={<SearchOutlined />} 
          onClick={executeSearch}
          style={{ 
            backgroundColor: '#f48024', 
            borderColor: '#f48024', 
            borderTopLeftRadius: 0, 
            borderBottomLeftRadius: 0,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {user ? (
          <>
            <Popover
              content={notificationContent}
              title={null}
              trigger="click"
              placement="bottom"
              overlayClassName="notification-popover"
              transitionName=""
              motion={{ motionName: '' }}
              getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
            >
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
                  {user && user.avatar ? (
                    <Avatar 
                      src={user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`} 
                      style={{ border: '1px solid #e3e6e8' }} 
                    />
                  ) : user && user.username ? (
                    <Avatar 
                      style={{ backgroundColor: '#f48024', fontWeight: 700, fontSize: 18 }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  ) : (
                    <Avatar 
                      style={{ backgroundColor: '#f48024' }} 
                      icon={<UserOutlined />} 
                    />
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
                    title={user?.full_name || user?.username}
                  >
                    {user?.full_name || user?.username}
                  </span>
                </div>
              </Dropdown>
            </>
          ) : (
            <>
              <Button onClick={() => history.push('/auth')}>Đăng nhập</Button>
              <Button type="primary" onClick={() => history.push('/auth')} style={{ backgroundColor: '#f48024', borderColor: '#f48024' }}>Đăng ký</Button>
            </>
          )}
        </div>
      </div>
    </Header>
  );
};

export default ForumHeader;
