import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  GlobalOutlined, 
  TagsOutlined, 
  UserOutlined, 
  QuestionCircleOutlined 
} from '@ant-design/icons';

const { Sider } = Layout;

interface ForumSidebarProps {
  activeTab: string;
  setActiveTab: (key: string) => void;
  filterByTag: (tag: string | null) => void;
  fetchData: (params: { tag?: string; search?: string }) => void;
}

const ForumSidebar: React.FC<ForumSidebarProps> = ({
  activeTab,
  setActiveTab,
  filterByTag,
  fetchData,
}) => {
  return (
    <Sider width={210} style={{ background: '#fff', borderRight: '1px solid #e3e6e8', position: 'fixed', height: 'calc(100vh - 56px)', left: 'auto' }}>
      <Menu
        mode="inline"
        selectedKeys={[activeTab]}
        onClick={({ key }) => {
          if (key === 'home') {
            filterByTag(null);
            fetchData({ tag: undefined, search: '' });
          }
          setActiveTab(key);
        }}
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

export default ForumSidebar;
