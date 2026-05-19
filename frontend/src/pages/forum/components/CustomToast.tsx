import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface CustomToastProps {
  activeToast: any;
  setActiveToast: (toast: any) => void;
  handleReadNotification: (notification: any) => void;
  user: any;
  BASE_URL: string;
}

const CustomToast: React.FC<CustomToastProps> = ({
  activeToast,
  setActiveToast,
  handleReadNotification,
  user,
  BASE_URL,
}) => {
  if (!activeToast) return null;

  return (
    <div 
      onClick={() => {
        if (activeToast.type === 'SUCCESS' || activeToast.type === 'ERROR' || activeToast.type === 'WARNING') {
          setActiveToast(null);
        } else {
          handleReadNotification(activeToast);
          setActiveToast(null);
        }
      }}
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        width: 300,
        background: '#fff',
        borderRadius: 0,
        border: '1px solid #e3e6e8',
        padding: '14px 18px',
        cursor: 'pointer',
        zIndex: 9999,
        display: 'flex',
        gap: 12,
        alignItems: 'center'
      }}
    >
      {activeToast.actor_avatar ? (
        <Avatar 
          size={42} 
          src={activeToast.actor_avatar.startsWith('http') ? activeToast.actor_avatar : `${BASE_URL}${activeToast.actor_avatar}`} 
          style={{ flexShrink: 0 }} 
        />
      ) : activeToast.type === 'WELCOME' ? (
        <Avatar size={42} style={{ backgroundColor: '#f48024', flexShrink: 0 }} icon={<UserOutlined />} />
      ) : (activeToast.type === 'REPLY_POST' || activeToast.type === 'REPLY_COMMENT' || activeToast.type === 'NEW_POST') ? (
        activeToast.actor_name ? (
          <Avatar size={42} style={{ backgroundColor: '#0074cc', flexShrink: 0, fontWeight: 700, fontSize: 18 }}>
            {activeToast.actor_name.charAt(0).toUpperCase()}
          </Avatar>
        ) : (
          <Avatar size={42} style={{ backgroundColor: '#0074cc', flexShrink: 0 }} icon={<UserOutlined />} />
        )
      ) : user && user.avatar ? (
        <Avatar size={42} src={user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`} style={{ flexShrink: 0 }} />
      ) : user && user.username ? (
        <Avatar size={42} style={{ backgroundColor: '#f48024', flexShrink: 0, fontWeight: 700, fontSize: 18 }}>
          {user.username.charAt(0).toUpperCase()}
        </Avatar>
      ) : (
        <Avatar size={42} style={{ backgroundColor: '#f48024', flexShrink: 0 }} icon={<UserOutlined />} />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ 
          fontSize: 14, 
          fontWeight: 700, 
          color: activeToast.type === 'SUCCESS' ? '#5eba7d' : 
                 activeToast.type === 'ERROR' ? '#d12d2d' : '#f48024',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 2
        }}>
          {activeToast.type === 'SUCCESS' ? 'Thành công' :
           activeToast.type === 'ERROR' ? 'Thất bại' :
           activeToast.type === 'WARNING' ? 'Cảnh báo' : 'Thông báo'}
        </div>
        <div style={{ 
          fontSize: 12.5, 
          color: '#232629', 
          lineHeight: 1.4, 
          display: '-webkit-box', 
          WebkitLineClamp: 3, 
          WebkitBoxOrient: 'vertical', 
          overflow: 'hidden' 
        }}>
          {activeToast.message}
        </div>
      </div>
    </div>
  );
};

export default CustomToast;
