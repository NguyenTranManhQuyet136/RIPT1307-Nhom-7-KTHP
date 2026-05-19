import React from 'react';
import { Row, Col, Typography, Tag, Avatar, Space } from 'antd';
import { EyeOutlined, ClockCircleOutlined, UserOutlined, CheckCircleFilled } from '@ant-design/icons';
import { history } from 'umi';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;

interface TagType {
  id: number;
  name: string;
  slug: string;
  post_count: number;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_username?: string;
  author_avatar?: string;
  author_role?: string;
  author_is_verified?: boolean;
  tags: TagType[];
  comment_count: number;
  view_count: number;
  score: number;
  is_edited?: boolean;
  created_at: string;
}

interface PostItemProps {
  post: Post;
  isMyQuestionsTab?: boolean;
  filterByTag: (slug: string | null) => void;
  handleStartEditPost: (post: Post) => void;
  handleDeletePost: (postId: number) => void;
}

const getRoleBadge = (role?: string, isVerified?: boolean) => {
  if (role === 'LECTURER') {
    if (isVerified) {
      return (
        <Tag color="processing" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, margin: 0, fontSize: 10 }}>
          <CheckCircleFilled style={{ color: '#52c41a' }} /> Giảng viên
        </Tag>
      );
    } else {
      return (
        <Tag color="warning" style={{ margin: 0, fontSize: 10 }}>
          Giảng viên (Chưa xác thực)
        </Tag>
      );
    }
  }
  if (role === 'ADMIN') {
    return <Tag color="red" style={{ margin: 0, fontSize: 10 }}>Admin</Tag>;
  }
  if (role === 'STUDENT') {
    return <Tag color="cyan" style={{ margin: 0, fontSize: 10 }}>Sinh viên</Tag>;
  }
  return null;
};

export const PostItem: React.FC<PostItemProps> = ({
  post,
  isMyQuestionsTab,
  filterByTag,
  handleStartEditPost,
  handleDeletePost
}) => {
  return (
    <div className="post-item-card" style={{ padding: '16px 12px', borderBottom: '1px solid #eff0f1', borderRadius: '6px', transition: 'all 0.3s ease' }}>
      <Row gutter={16}>
        <Col span={4} style={{ textAlign: 'right', color: '#6a737c' }}>
          <div style={{ marginBottom: 8 }}>
            <Text 
              strong 
              style={{ 
                color: post.score > 0 ? '#5eba7d' : post.score < 0 ? '#d12d2d' : '#0c0d0e' 
              }}
            >
              {post.score}
            </Text> 
            <Text 
              style={{ 
                fontSize: '12px',
                color: post.score > 0 ? '#5eba7d' : post.score < 0 ? '#d12d2d' : '#6a737c',
                marginLeft: 4
              }}
            >
              votes
            </Text>
          </div>
          <div style={{ border: '1px solid #5eba7d', borderRadius: 3, padding: '2px 4px', color: '#5eba7d', marginBottom: 8 }}>
            <Text strong style={{ color: '#5eba7d' }}>{post.comment_count}</Text> <Text style={{ fontSize: '12px', color: '#5eba7d' }}>câu trả lời</Text>
          </div>
          <div style={{ fontSize: 12, marginBottom: 4 }}>
            <EyeOutlined /> {post.view_count} lượt xem
          </div>
          <div style={{ fontSize: 12, color: '#6a737c' }}>
            <ClockCircleOutlined /> {moment(post.created_at).fromNow()}
          </div>
        </Col>
        <Col span={20} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <Title level={4} style={{ marginTop: 0, marginBottom: 4, flex: 1, marginRight: 16 }}>
              <a
                className="post-title-link"
                style={{ color: '#0074cc', fontSize: 17, fontWeight: 400, cursor: 'pointer' }}
                onClick={() => history.push(`/forum/post/${post.id}`)}
              >
                {post.title}
              </a>
            </Title>
            {post.is_edited && (
              <span style={{ fontSize: 11, fontStyle: 'italic', color: '#f48024', backgroundColor: '#fff8f2', padding: '1px 6px', borderRadius: 4, border: '1px solid #fce3cf', userSelect: 'none', flexShrink: 0 }}>
                đã chỉnh sửa
              </span>
            )}
          </div>
          <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#3c4146', marginBottom: 8, flexGrow: 1 }}>
            {post.content}
          </Paragraph>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Space size={4}>
                {post.tags.map(t => (
                  <Tag 
                    key={t.id} 
                    style={{ 
                      backgroundColor: '#e1ecf4', 
                      color: '#39739d', 
                      border: 'none', 
                      cursor: 'pointer' 
                    }}
                    onClick={() => filterByTag(t.slug)}
                  >
                    {t.name}
                  </Tag>
                ))}
              </Space>
            </div>
            {isMyQuestionsTab ? (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                <a 
                  style={{ color: '#0074cc', fontSize: 13, fontWeight: 500 }}
                  onClick={() => handleStartEditPost(post)}
                >
                  Chỉnh sửa
                </a>
                <span style={{ color: '#d6d9dc' }}>|</span>
                <a 
                  style={{ color: '#c02d2d', fontSize: 13, fontWeight: 500 }}
                  onClick={() => handleDeletePost(post.id)}
                >
                  Xóa
                </a>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#6a737c', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                {post.author_avatar ? (
                  <Avatar 
                    size="small" 
                    src={post.author_avatar.startsWith('http') ? post.author_avatar : `http://localhost:8002${post.author_avatar}`} 
                  />
                ) : post.author_name ? (
                  <Avatar 
                    size="small" 
                    style={{ 
                      backgroundColor: post.author_role === 'LECTURER' ? '#0074cc' : '#f48024', 
                      fontWeight: 700, 
                      fontSize: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {post.author_name.charAt(0).toUpperCase()}
                  </Avatar>
                ) : (
                  <Avatar 
                    size="small" 
                    icon={<UserOutlined />} 
                  />
                )}
                <Text 
                  strong 
                  style={{ 
                    color: '#0074cc', 
                    maxWidth: 120, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    verticalAlign: 'middle'
                  }}
                  title={post.author_name}
                >
                  {post.author_name}
                </Text>
                
                {getRoleBadge(post.author_role, post.author_is_verified)}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};
