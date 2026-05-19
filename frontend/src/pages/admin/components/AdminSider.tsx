import React from 'react';
import { Layout, Menu } from 'antd';
import { DashboardOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import { history } from 'umi';

const { Sider } = Layout;

interface AdminSiderProps {
  activeKey: 'dashboard' | 'users' | 'posts';
}

export const AdminSider: React.FC<AdminSiderProps> = ({ activeKey }) => {
  const handleClick = ({ key }: { key: string }) => {
    if (key === 'dashboard') history.push('/admin');
    if (key === 'users') history.push('/admin/users');
    if (key === 'posts') history.push('/admin/posts');
  };

  return (
    <Sider width={200} className="admin-sider" style={{ background: '#fff', borderRight: '1px solid #e3e6e8', position: 'fixed', height: 'calc(100vh - 56px)', left: 0, top: 56, zIndex: 100 }}>
      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        style={{ height: '100%', borderRight: 0, paddingTop: 16 }}
        onClick={handleClick}
        items={[
          { key: 'dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
          { key: 'users', icon: <TeamOutlined />, label: 'Quản lý người dùng' },
          { key: 'posts', icon: <FileTextOutlined />, label: 'Quản lý bài đăng' },
        ]}
      />
    </Sider>
  );
};
