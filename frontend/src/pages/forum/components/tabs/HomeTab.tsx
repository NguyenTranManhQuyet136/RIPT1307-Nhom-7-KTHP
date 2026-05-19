import React, { useState, useEffect, useRef } from 'react';
import { Typography, Button, Row, Col, Card, Space, Tag, List, Pagination, Empty } from 'antd';
import { PlusOutlined, MessageOutlined, FireOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { history } from 'umi';
import moment from 'moment';
import PostItem from '../PostItem';
import { Post } from '../../types';

const { Title, Paragraph, Text } = Typography;

interface HomeTabProps {
  posts: Post[];
  loading: boolean;
  fullSearchText: string;
  selectedTags: string[];
  ordering: string;
  unanswered: boolean;
  handleOrderingChange: (order: string) => void;
  toggleUnanswered: () => void;
  homeCurrentPage: number;
  setHomeCurrentPage: (page: number) => void;
  setIsModalOpen: (open: boolean) => void;
  filterByTag: (tag: string | null) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({
  posts,
  loading,
  fullSearchText,
  selectedTags,
  ordering,
  unanswered,
  handleOrderingChange,
  toggleUnanswered,
  homeCurrentPage,
  setHomeCurrentPage,
  setIsModalOpen,
  filterByTag
}) => {
  const hotPosts = posts.slice().sort((a, b) => b.score - a.score || b.view_count - a.view_count).slice(0, 12);
  const totalPages = Math.max(1, Math.ceil(hotPosts.length / 3));

  const [carouselPage, setCarouselPage] = useState(0);
  const timerRef = useRef<any>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCarouselPage(prev => (prev + 1) % totalPages);
    }, 4000);
  };

  useEffect(() => {
    if (totalPages > 1 && !fullSearchText && !selectedTags.length) {
      startTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalPages, fullSearchText, selectedTags]);

  const handlePrev = () => {
    setCarouselPage(prev => (prev - 1 + totalPages) % totalPages);
    if (totalPages > 1) startTimer();
  };

  const handleNext = () => {
    setCarouselPage(prev => (prev + 1) % totalPages);
    if (totalPages > 1) startTimer();
  };

  return (
    <>
      <style>{`
        .hot-post-title {
          transition: all 0.2s;
        }
        .hot-post-title:hover {
          text-decoration: underline;
        }
      `}</style>
      {!fullSearchText && !selectedTags.length && (
        <div style={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #f48024 100%)',
          borderRadius: '8px',
          padding: '32px 40px',
          color: '#fff',
          marginBottom: '32px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            right: '-10%',
            top: '-30%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            left: '40%',
            bottom: '-20%',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
            pointerEvents: 'none'
          }} />
          
          <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 700, fontSize: '28px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            Chào mừng bạn đến với EduForum!
          </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', marginTop: '12px', marginBottom: '24px', maxWidth: '680px', lineHeight: '1.6' }}>
            EduForum là không gian trao đổi học thuật sôi nổi, nơi các bạn sinh viên thỏa sức chia sẻ thắc mắc và các Thầy/Cô cố vấn chuyên môn luôn sẵn lòng đồng hành giải đáp kiến thức.
          </Paragraph>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button 
              type="primary" 
              size="large" 
              icon={<PlusOutlined />} 
              onClick={() => setIsModalOpen(true)}
              style={{ 
                backgroundColor: '#f48024', 
                borderColor: '#f48024',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(244, 128, 36, 0.4)'
              }}
            >
              Đặt câu hỏi ngay
            </Button>
            <Button 
              ghost 
              size="large" 
              onClick={() => {
                const element = document.getElementById('forum-stats-widget');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ 
                color: '#fff', 
                borderColor: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 600
              }}
            >
              Khám phá diễn đàn
            </Button>
          </div>
        </div>
      )}

      {!fullSearchText && !selectedTags.length && hotPosts.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#2c3e50' }}>
              Chủ đề đang thảo luận sôi nổi
            </Title>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                  shape="circle" 
                  icon={<LeftOutlined />} 
                  onClick={handlePrev} 
                  size="small"
                />
                <Button 
                  shape="circle" 
                  icon={<RightOutlined />} 
                  onClick={handleNext} 
                  size="small"
                />
              </div>
            )}
          </div>
          
          <div style={{ position: 'relative', overflow: 'hidden', margin: '-8px', padding: '8px' }}>
            <div style={{ 
              display: 'flex', 
              transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)', 
              transform: `translateX(-${carouselPage * (100 / totalPages)}%)`,
              width: `${totalPages * 100}%`
            }}>
              {Array.from({ length: totalPages }).map((_, pageIdx) => {
                const pagePosts = hotPosts.slice(pageIdx * 3, pageIdx * 3 + 3);
                return (
                  <div key={pageIdx} style={{ width: `${100 / totalPages}%`, flexShrink: 0 }}>
                    <Row gutter={[16, 16]} style={{ margin: 0 }}>
                      {pagePosts.map(hotPost => (
                        <Col xs={24} sm={8} key={hotPost.id}>
                          <Card
                            onClick={() => history.push(`/forum/post/${hotPost.id}`)}
                            bodyStyle={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
                            style={{ 
                              height: '180px', 
                              borderRadius: '8px', 
                              border: '1px solid #e3e6e8',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {hotPost.tags.slice(0, 2).map(t => (
                                    <Tag key={t.id} color="#e1ecf4" style={{ color: '#39739d', border: 'none', margin: 0, fontSize: 11, fontWeight: 500 }}>
                                      {t.name}
                                    </Tag>
                                  ))}
                                  {hotPost.tags.length > 2 && (
                                    <Tag color="#e1ecf4" style={{ color: '#39739d', border: 'none', margin: 0, fontSize: 11, fontWeight: 500 }}>
                                      +{hotPost.tags.length - 2}
                                    </Tag>
                                  )}

                                </div>
                                <Space size={10} style={{ color: '#8c8c8c', fontSize: '12px' }}>
                                  <span><MessageOutlined /> {hotPost.comment_count || 0}</span>
                                  <span><FireOutlined /> {hotPost.score || 0}</span>
                                </Space>
                              </div>
                              <Title level={5} ellipsis={{ rows: 2 }} className="hot-post-title" style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0074cc', lineHeight: '1.4' }}>
                                {hotPost.title}
                              </Title>
                              <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: '13px', color: '#525960', margin: '6px 0 0 0', lineHeight: '1.5' }}>
                                {hotPost.content}
                              </Paragraph>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px', justifyContent: 'space-between' }}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                bởi <Text 
                                  strong 
                                  style={{ 
                                    color: '#4a5568', 
                                    maxWidth: 80, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis', 
                                    whiteSpace: 'nowrap',
                                    display: 'inline-block',
                                    verticalAlign: 'middle'
                                  }}
                                  title={hotPost.author_name || (hotPost as any).author}
                                >
                                  {hotPost.author_name || (hotPost as any).author}
                                </Text>
                              </Text>
                              <span style={{ fontSize: '11px', color: '#a0aec0' }}>{moment(hotPost.created_at).fromNow()}</span>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{
        position: 'sticky',
        top: 56, // header height
        backgroundColor: '#fff',
        zIndex: 99,
        padding: '16px 0',
        margin: '0 -24px 24px -24px',
        paddingLeft: '24px',
        paddingRight: '24px',
        borderBottom: '1px solid #eff0f1'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title level={2} style={{ margin: 0, fontWeight: 400 }}>
            {fullSearchText ? (
              <>
                Kết quả cho: <span style={{ fontWeight: 600 }}>"{fullSearchText.length > 50 ? fullSearchText.substring(0, 50) + '...' : fullSearchText}"</span>
              </>
            ) : (
              'Tất cả câu hỏi'
            )}
          </Title>
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
        {selectedTags.length > 0 && (
          <div style={{ marginTop: 8, marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {selectedTags.map(tag => (
              <Tag 
                key={tag} 
                color="#e1ecf4" 
                style={{ 
                  border: 'none', 
                  color: '#39739d', 
                  fontWeight: 500, 
                  padding: '2px 8px', 
                  borderRadius: '3px',
                  fontSize: '13px'
                }}
              >
                #{tag}
              </Tag>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 18 }}>{posts.length} câu hỏi</Text>
          <Space.Compact block={false}>
            <Button 
              type={ordering === '-created_at' ? 'primary' : 'default'}
              onClick={() => handleOrderingChange('-created_at')}
            >
              Mới nhất
            </Button>
            <Button 
              type={ordering === '-view_count' ? 'primary' : 'default'}
              onClick={() => handleOrderingChange('-view_count')}
            >
              Phổ biến
            </Button>
            <Button 
              type={unanswered ? 'primary' : 'default'}
              onClick={toggleUnanswered}
            >
              Chưa trả lời
            </Button>
          </Space.Compact>
        </div>
      </div>

      {loading ? (
        <List loading={true} />
      ) : posts.length > 0 ? (
        <>
          {posts.slice((homeCurrentPage - 1) * 15, homeCurrentPage * 15).map(post => <PostItem key={post.id} post={post} filterByTag={filterByTag} />)}
          <Pagination 
            current={homeCurrentPage} 
            onChange={setHomeCurrentPage} 
            pageSize={15} 
            total={posts.length} 
            showSizeChanger={false} 
            style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }} 
          />
        </>
      ) : (
        <Empty description="Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!" style={{ marginTop: 64 }} />
      )}
    </>
  );
};

export default HomeTab;
