import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  Button, 
  Input, 
  Card, 
  Tag, 
  Space, 
  Typography, 
  Avatar, 
  Row, 
  Col, 
  Modal, 
  Form, 
  message, 
  ConfigProvider, 
  theme,
  List,
  Divider,
  Empty,
  Badge,
  Tooltip,
  Dropdown
} from 'antd';
import type { MenuProps } from 'antd';
import { 
  GlobalOutlined, 
  QuestionCircleOutlined, 
  TagsOutlined, 
  UserOutlined, 
  SearchOutlined, 
  PlusOutlined,
  EyeOutlined,
  LogoutOutlined,
  FireOutlined,
  BellOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { history } from 'umi';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const { Header, Content, Sider } = Layout;
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
  tags: TagType[];
  comment_count: number;
  view_count: number;
  score: number;
  created_at: string;
}

const ForumPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [user, setUser] = useState<any>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [unanswered, setUnanswered] = useState(false);

  const BASE_URL = 'http://localhost:8002';

  const fetchData = async (params: { tag?: string; search?: string; ordering?: string; unanswered?: boolean } = {}) => {
    setLoading(true);
    try {
      const { 
        tag = selectedTag, 
        search = searchQuery, 
        ordering: ord = ordering, 
        unanswered: unans = unanswered 
      } = params;

      const queryParams = new URLSearchParams();
      if (tag) queryParams.append('tag', tag);
      if (search) queryParams.append('search', search);
      if (ord) queryParams.append('ordering', ord);
      if (unans) queryParams.append('unanswered', 'true');

      const url = `${BASE_URL}/api/posts/?${queryParams.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      message.error('Không thể tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/tags/`);
      const data = await res.json();
      setTags(data.slice(0, 10));
    } catch (error) {
      console.error('Lỗi tải tags', error);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchData();
    fetchTags();
  }, []);

  const handleCreatePost = async (values: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để đăng bài');
      history.push('/auth');
      return;
    }

    setLoading(true);
    try {
      const tag_names = values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [];
      const res = await fetch(`${BASE_URL}/api/posts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: values.title,
          content: values.content,
          tag_names: tag_names
        })
      });

      if (res.ok) {
        message.success('Đăng bài thành công!');
        setIsModalOpen(false);
        form.resetFields();
        fetchData();
        fetchTags();
      } else {
        message.error('Có lỗi xảy ra khi đăng bài');
      }
    } catch (error) {
      message.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    history.push('/auth');
  };

  const filterByTag = (tagName: string | null) => {
    setSelectedTag(tagName);
    fetchData({ tag: tagName || undefined });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    fetchData({ search: value });
  };

  const handleOrderingChange = (newOrdering: string) => {
    setOrdering(newOrdering);
    fetchData({ ordering: newOrdering });
  };

  const toggleUnanswered = () => {
    const newVal = !unanswered;
    setUnanswered(newVal);
    fetchData({ unanswered: newVal });
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: 'Tài khoản' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout },
  ];

  const PostItem = ({ post }: { post: Post }) => (
    <div style={{ padding: '16px 0', borderBottom: '1px solid #eff0f1' }}>
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
          <div style={{ fontSize: 12 }}>
            <EyeOutlined /> {post.view_count} lượt xem
          </div>
        </Col>
        <Col span={20}>
          <Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
            <a
              style={{ color: '#0074cc', fontSize: 17, fontWeight: 400, cursor: 'pointer' }}
              onClick={() => history.push(`/forum/post/${post.id}`)}
            >
              {post.title}
            </a>
          </Title>
          <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#3c4146', marginBottom: 8 }}>
            {post.content}
          </Paragraph>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <div style={{ fontSize: 12, color: '#6a737c', marginLeft: 'auto' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 4 }} />
              <Text strong style={{ color: '#0074cc' }}>{post.author_name}</Text>
              <Text style={{ marginLeft: 4 }}>hỏi {moment(post.created_at).fromNow()}</Text>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );

  return (
    <ConfigProvider 
      theme={{ 
        algorithm: theme.defaultAlgorithm, 
        token: { 
          colorPrimary: '#f48024', 
          borderRadius: 4,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        } 
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#fff' }}>
        <Header style={{ 
          background: '#fff', 
          borderTop: '3px solid #f48024', 
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
          padding: 0,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          position: 'fixed',
          width: '100%',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1264, margin: '0 auto' }}>
            <div 
              style={{ fontSize: 22, fontWeight: 800, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', width: 164 }}
              onClick={() => { filterByTag(null); history.push('/forum'); }}
            >
              <FireOutlined style={{ color: '#f48024', marginRight: 4 }} />
              <span>edu<Text strong style={{ color: '#f48024' }}>forum</Text></span>
            </div>

            <div style={{ flex: 1, padding: '0 24px 0 0' }}>
              <Input.Search 
                placeholder="Tìm kiếm câu hỏi..." 
                onSearch={handleSearch}
                allowClear
                style={{ borderRadius: 3 }}
                enterButton={
                  <Button type="primary" style={{ backgroundColor: '#f48024', borderColor: '#f48024' }}>
                    <SearchOutlined />
                  </Button>
                }
              />
            </div>

            <Space size={20}>
              {user ? (
                <>
                  <Badge count={0} size="small">
                    <Button type="text" icon={<BellOutlined style={{ fontSize: 20, color: '#525960' }} />} />
                  </Badge>
                  <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                    <Avatar 
                      style={{ backgroundColor: '#f48024', cursor: 'pointer' }} 
                      icon={<UserOutlined />} 
                    />
                  </Dropdown>
                </>
              ) : (
                <>
                  <Button onClick={() => history.push('/auth')}>Đăng nhập</Button>
                  <Button type="primary" onClick={() => history.push('/auth')}>Đăng ký</Button>
                </>
              )}
            </Space>
          </div>
        </Header>

        <Layout style={{ marginTop: 56, maxWidth: 1264, margin: '56px auto 0', width: '100%', background: '#fff' }}>
          <Sider width={164} style={{ background: '#fff', borderRight: '1px solid #e3e6e8', position: 'fixed', height: 'calc(100vh - 56px)', left: 'auto' }}>
            <Menu
              mode="inline"
              defaultSelectedKeys={['home']}
              style={{ height: '100%', borderRight: 0, paddingTop: 24 }}
              items={[
                { key: 'home', icon: <GlobalOutlined />, label: 'Trang chủ' },
                { key: 'public', label: 'CỘNG ĐỒNG', type: 'group', children: [
                  { key: 'questions', icon: <QuestionCircleOutlined />, label: 'Câu hỏi' },
                  { key: 'tags', icon: <TagsOutlined />, label: 'Thẻ (Tags)' },
                  { key: 'users', icon: <UserOutlined />, label: 'Người dùng' },
                ]}
              ]}
            />
          </Sider>

          <Content style={{ padding: '24px', marginLeft: 164, minHeight: 280, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Title level={2} style={{ margin: 0, fontWeight: 400 }}>
                {selectedTag ? `Câu hỏi gắn thẻ [${selectedTag}]` : 'Tất cả câu hỏi'}
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
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

            <Divider style={{ margin: '0 0 0 0' }} />

            {loading ? (
              <List loading={true} />
            ) : posts.length > 0 ? (
              posts.map(post => <PostItem key={post.id} post={post} />)
            ) : (
              <Empty description="Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!" style={{ marginTop: 64 }} />
            )}
          </Content>

          <Sider width={300} style={{ background: '#fff', padding: '24px 0 24px 24px' }}>
            <Card 
              title={<span style={{ display: 'flex', alignItems: 'center' }}><TagsOutlined style={{ marginRight: 8 }} /> Thẻ phổ biến</span>}
              size="small"
              bordered={true}
              style={{ backgroundColor: '#fdf7e2', borderColor: '#f1e5bc' }}
              headStyle={{ backgroundColor: '#fbf3d5', borderBottom: '1px solid #f1e5bc' }}
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
                    onClick={() => filterByTag(t.slug)}
                  >
                    {t.name} x {t.post_count}
                  </Tag>
                ))}
              </Space>
              <div style={{ marginTop: 12 }}>
                <Button type="link" style={{ padding: 0 }} onClick={() => filterByTag(null)}>Xem tất cả thẻ</Button>
              </div>
            </Card>

            <Card 
              title="Thống kê diễn đàn" 
              size="small" 
              style={{ marginTop: 16 }}
            >
              <List size="small">
                <List.Item>
                  <Text type="secondary">Tổng số câu hỏi:</Text> <Text strong>{posts.length}</Text>
                </List.Item>
                <List.Item>
                  <Text type="secondary">Thành viên:</Text> <Text strong>128</Text>
                </List.Item>
              </List>
            </Card>
          </Sider>
        </Layout>

        <Modal
          title={<Title level={3} style={{ margin: 0 }}>Đặt câu hỏi cho cộng đồng</Title>}
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={800}
          centered
        >
          <Paragraph type="secondary">
            Hãy mô tả chi tiết vấn đề của bạn. Một câu hỏi tốt sẽ nhận được câu trả lời nhanh và chính xác hơn.
          </Paragraph>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreatePost}
            requiredMark={false}
          >
            <Form.Item 
              label={<Text strong>Tiêu đề</Text>} 
              name="title" 
              rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
              extra="Nêu rõ nội dung chính của câu hỏi (Ví dụ: Làm sao để cài đặt Docker trên Windows?)"
            >
              <Input placeholder="Tiêu đề câu hỏi..." size="large" />
            </Form.Item>

            <Form.Item 
              label={<Text strong>Nội dung chi tiết</Text>} 
              name="content" 
              rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}
            >
              <Input.TextArea rows={8} placeholder="Mô tả chi tiết vấn đề, các bước bạn đã thử..." />
            </Form.Item>

            <Form.Item 
              label={<Text strong>Thẻ (Tags)</Text>} 
              name="tags" 
              extra="Phân cách các thẻ bằng dấu phẩy (Ví dụ: python, django, docker)"
            >
              <Input prefix={<TagsOutlined />} placeholder="java, spring-boot, reactjs..." />
            </Form.Item>

            <div style={{ textAlign: 'right', marginTop: 24 }}>
              <Space>
                <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="primary" htmlType="submit" size="large" loading={loading}>
                  Đăng câu hỏi
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>
      </Layout>
    </ConfigProvider>
  );
};

export default ForumPage;
