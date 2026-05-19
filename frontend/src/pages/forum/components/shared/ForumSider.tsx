import React from 'react';
import { Layout, Menu } from 'antd';
import { GlobalOutlined, TagsOutlined, UserOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { history } from 'umi';

const { Sider } = Layout;

interface ForumSiderProps {
  activeTab?: string;
  onChangeTab?: (key: string) => void;
}

export const ForumSider: React.FC<ForumSiderProps> = ({ activeTab, onChangeTab }) => {
  const handleClick = ({ key }: { key: string }) => {
    if (onChangeTab) {
      onChangeTab(key);
    } else {
      // Default fallback: redirect to /forum and pass tab key or state if needed
      history.push(`/forum?tab=${key}`);
    }
  };

  const selectedKeys = activeTab ? [activeTab] : [];

  return (
    <Sider
      width={210}
      style={{
        background: '#fff',
        borderRight: '1px solid #e3e6e8',
        position: 'fixed',
        height: 'calc(100vh - 56px)',
        left: 'auto'
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        onClick={handleClick}
        style={{ height: '100%', borderRight: 0, paddingTop: 24 }}
        items={[
          { key: 'home', icon: <GlobalOutlined />, label: 'Trang chủ' },
          { key: 'tags', icon: <TagsOutlined />, label: 'Thẻ phổ biến' },
          { key: 'lecturers', icon: <UserOutlined />, label: 'Đội ngũ giảng viên' },
          { key: 'my-questions', icon: <QuestionCircleOutlined />, label: 'Câu hỏi của tôi' },
        ]}
      />
    </Sider>
  );
};
