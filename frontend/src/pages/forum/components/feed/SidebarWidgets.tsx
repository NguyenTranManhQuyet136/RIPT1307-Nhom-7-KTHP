import React from 'react';
import { Layout, Card, Space, Tag, List, Typography } from 'antd';
import { TagsOutlined, GlobalOutlined } from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

interface TagType {
  id: number;
  name: string;
  slug: string;
  post_count: number;
}

interface SidebarWidgetsProps {
  tags: TagType[];
  totalPostsCount: number;
  studentStats: { total: number; online: number };
  lecturerStats: { total: number; online: number };
  filterByTag: (slug: string | null) => void;
  setActiveTab: (tab: string) => void;
}

export const SidebarWidgets: React.FC<SidebarWidgetsProps> = ({
  tags,
  totalPostsCount,
  studentStats,
  lecturerStats,
  filterByTag,
  setActiveTab
}) => {
  return (
    <Sider width={300} style={{ background: '#fff', padding: '24px 0 24px 24px' }}>
      <Card 
        title={<span style={{ display: 'flex', alignItems: 'center' }}><TagsOutlined style={{ marginRight: 8, color: '#f48024' }} /> Thẻ phổ biến</span>}
        size="small"
        bordered={true}
        style={{ 
          backgroundColor: '#fdfaf2', 
          borderColor: '#f5e8c7',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}
        headStyle={{ 
          backgroundColor: '#faf4e1', 
          borderBottom: '1px solid #f5e8c7',
          borderRadius: '8px 8px 0 0'
        }}
      >
        <Space wrap size={[4, 8]}>
          {tags.map(t => (
            <Tag 
              key={t.id} 
              style={{ 
                backgroundColor: '#e1ecf4', 
                color: '#39739d', 
                border: 'none', 
                cursor: 'pointer',
                margin: '2px' 
              }}
              onClick={() => {
                filterByTag(t.slug);
                setActiveTab('home');
              }}
            >
              {t.name} x {t.post_count}
            </Tag>
          ))}
        </Space>
        <div style={{ marginTop: 12 }}>
          <ButtonTypeLink onClick={() => setActiveTab('tags')} />
        </div>
      </Card>

      <Card 
        id="forum-stats-widget"
        title={<span style={{ display: 'flex', alignItems: 'center' }}><GlobalOutlined style={{ marginRight: 8, color: '#f48024' }} /> Thống kê diễn đàn</span>} 
        size="small" 
        style={{ 
          marginTop: 16, 
          borderRadius: '8px', 
          border: '1px solid #e3e6e8',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}
      >
        <List size="small">
          <List.Item style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f2f6', padding: '10px 0' }}>
            <Text type="secondary" style={{ fontSize: '13px' }}>Câu hỏi:</Text> <Text strong style={{ color: '#2c3e50', fontSize: '14px' }}>{totalPostsCount}</Text>
          </List.Item>
          <List.Item style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f2f6', padding: '10px 0' }}>
            <Text type="secondary" style={{ fontSize: '13px' }}>Học sinh:</Text> 
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Text strong style={{ color: '#2c3e50', fontSize: '14px' }}>{studentStats.total}</Text> 
              <Text type="success" style={{ fontSize: '12px', marginLeft: 8, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }}>
                <span className="online-dot-pulse"></span>
                0 online
              </Text>
            </span>
          </List.Item>
          <List.Item style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', border: 'none' }}>
            <Text type="secondary" style={{ fontSize: '13px' }}>Giảng viên:</Text> 
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Text strong style={{ color: '#2c3e50', fontSize: '14px' }}>{lecturerStats.total}</Text> 
              <Text type="success" style={{ fontSize: '12px', marginLeft: 8, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }}>
                <span className="online-dot-pulse"></span>
                0 online
              </Text>
            </span>
          </List.Item>
        </List>
      </Card>
    </Sider>
  );
};

// Internal utility to keep from declaring a separate file for link Button
const ButtonTypeLink: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <span 
      style={{ color: '#0074cc', cursor: 'pointer', fontSize: 13 }}
      onClick={onClick}
    >
      Xem tất cả thẻ
    </span>
  );
};
