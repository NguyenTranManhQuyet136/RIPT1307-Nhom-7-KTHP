import React from 'react';
import { Typography, Card, Button, Divider, List, Pagination, Empty } from 'antd';
import { QuestionCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { history } from 'umi';
import PostItem from '../PostItem';
import { Post } from '../../types';

const { Title, Paragraph } = Typography;

interface MyQuestionsTabProps {
  user: any;
  posts: Post[];
  loading: boolean;
  myQuestionsCurrentPage: number;
  setMyQuestionsCurrentPage: (page: number) => void;
  setIsModalOpen: (open: boolean) => void;
  filterByTag: (tag: string | null) => void;
  handleStartEditPost: (post: Post) => void;
  handleDeletePost: (id: number) => void;
}

const MyQuestionsTab: React.FC<MyQuestionsTabProps> = ({
  user,
  posts,
  loading,
  myQuestionsCurrentPage,
  setMyQuestionsCurrentPage,
  setIsModalOpen,
  filterByTag,
  handleStartEditPost,
  handleDeletePost
}) => {
  if (!user) {
    return (
      <Card style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 500, margin: '64px auto', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 48, color: '#f48024', marginBottom: 16 }}>
          <QuestionCircleOutlined />
        </div>
        <Title level={3}>Câu hỏi của bạn</Title>
        <Paragraph type="secondary" style={{ fontSize: 14, marginBottom: 24 }}>
          Vui lòng đăng nhập vào tài khoản EduForum của bạn để theo dõi, quản lý và nhận thông báo phản hồi cho các câu hỏi học tập của mình.
        </Paragraph>
        <Button type="primary" size="large" onClick={() => history.push('/auth')} style={{ padding: '0 32px' }}>
          Đăng nhập ngay
        </Button>
      </Card>
    );
  }

  const filtered = posts.filter(post => post.author_username === user.username);
  const paginated = filtered.slice((myQuestionsCurrentPage - 1) * 15, myQuestionsCurrentPage * 15);

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0, fontWeight: 400 }}>Câu hỏi của tôi</Title>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalOpen(true)}
          style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.4)' }}
        >
          Đặt câu hỏi
        </Button>
      </div>
      <Divider style={{ margin: '0 0 16px 0' }} />
      {loading ? (
        <List loading={true} />
      ) : (
        <>
          {paginated.map(post => (
            <PostItem 
              key={post.id} 
              post={post} 
              isMyQuestionsTab={true} 
              filterByTag={filterByTag}
              handleStartEditPost={handleStartEditPost}
              handleDeletePost={handleDeletePost}
            />
          ))}
          {filtered.length > 0 && (
            <Pagination
              current={myQuestionsCurrentPage}
              onChange={setMyQuestionsCurrentPage}
              pageSize={15}
              total={filtered.length}
              showSizeChanger={false}
              style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}
            />
          )}
          {filtered.length === 0 && (
            <Empty description="Bạn chưa đăng câu hỏi nào. Hãy đặt câu hỏi học thuật đầu tiên của mình nhé!" style={{ marginTop: 64 }} />
          )}
        </>
      )}
    </div>
  );
};

export default MyQuestionsTab;
