import React, { useState, useEffect } from 'react';
import {
  Layout,
  Button,
  Input,
  Tag,
  Space,
  Typography,
  Avatar,
  message,
  ConfigProvider,
  theme,
  Badge,
  Tooltip,
  Dropdown,
  Spin,
  Empty,
  Popover,
  List
} from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  FireOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { history, useParams } from 'umi';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface TagType {
  id: number;
  name: string;
  slug: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  author_name: string;
  tags: TagType[];
  view_count: number;
  score: number;
  user_vote: number;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

interface CommentReply {
  id: number;
  post: number;
  author: string;
  author_name: string;
  author_role: string;
  content: string;
  parent: number;
  is_accepted: boolean;
  score: number;
  user_vote: number;
  replies: CommentReply[];
  created_at: string;
}

interface CommentType {
  id: number;
  post: number;
  author: string;
  author_name: string;
  author_role: string;
  content: string;
  parent: number | null;
  is_accepted: boolean;
  score: number;
  user_vote: number;
  replies: CommentReply[];
  created_at: string;
}

const getRoleBadge = (role: string) => {
  if (role === 'LECTURER') {
    return <Tag color="blue" style={{ fontSize: 11, marginLeft: 6, borderRadius: 3 }}>Giảng viên</Tag>;
  }
  if (role === 'ADMIN') {
    return <Tag color="red" style={{ fontSize: 11, marginLeft: 6, borderRadius: 3 }}>Admin</Tag>;
  }
  return null;
};

const ReplyItem: React.FC<{ reply: CommentReply; onVote: (id: number, val: number) => void }> = ({ reply, onVote }) => (
  <div style={{
    marginLeft: 40,
    padding: '12px 16px',
    backgroundColor: '#f8f9f9',
    borderLeft: '3px solid #e3e6e8',
    marginBottom: 8,
    borderRadius: '0 4px 4px 0'
  }}>
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 24 }}>
        <CaretUpOutlined 
          style={{ cursor: 'pointer', color: reply.user_vote === 1 ? '#f48024' : '#babfc4', fontSize: 18 }} 
          onClick={() => onVote(reply.id, 1)}
        />
        <Text strong style={{ fontSize: 13, color: '#6a737c' }}>{reply.score}</Text>
        <CaretDownOutlined 
          style={{ cursor: 'pointer', color: reply.user_vote === -1 ? '#39739d' : '#babfc4', fontSize: 18 }} 
          onClick={() => onVote(reply.id, -1)}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <Text strong style={{ color: '#0074cc', fontSize: 13 }}>{reply.author_name}</Text>
          {getRoleBadge(reply.author_role)}
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            {moment(reply.created_at).fromNow()}
          </Text>
        </div>
        <Paragraph style={{ margin: 0, color: '#3c4146', fontSize: 14, whiteSpace: 'pre-wrap' }}>
          {reply.content}
        </Paragraph>
      </div>
    </div>
  </div>
);

interface CommentItemProps {
  comment: CommentType;
  canAccept: boolean;
  replyingTo: number | null;
  replyContent: string;
  submitting: boolean;
  onToggleReply: (id: number) => void;
  onReplyContentChange: (value: string) => void;
  onSubmitReply: (parentId: number) => void;
  onCancelReply: () => void;
  onAccept: (id: number) => void;
  onVote: (id: number, val: number) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  canAccept,
  replyingTo,
  replyContent,
  submitting,
  onToggleReply,
  onReplyContentChange,
  onSubmitReply,
  onCancelReply,
  onAccept,
  onVote
}) => (
  <div style={{ borderBottom: '1px solid #e3e6e8', padding: '20px 0' }}>
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 48,
        gap: 4,
        paddingTop: 4
      }}>
        <Button 
          type="text" 
          icon={<CaretUpOutlined style={{ fontSize: 32, color: comment.user_vote === 1 ? '#f48024' : '#babfc4' }} />} 
          onClick={() => onVote(comment.id, 1)}
          style={{ padding: 0, height: 'auto' }} 
        />
        <Text strong style={{ fontSize: 22, color: '#6a737c' }}>{comment.score}</Text>
        <Button 
          type="text" 
          icon={<CaretDownOutlined style={{ fontSize: 32, color: comment.user_vote === -1 ? '#39739d' : '#babfc4' }} />} 
          onClick={() => onVote(comment.id, -1)}
          style={{ padding: 0, height: 'auto' }} 
        />
        {canAccept ? (
          <Tooltip title={comment.is_accepted ? "Bỏ chấp nhận câu trả lời" : "Chấp nhận câu trả lời"}>
            <Button
              type="text"
              icon={comment.is_accepted ? 
                <CheckCircleFilled style={{ fontSize: 28, color: '#5eba7d' }} /> : 
                <CheckCircleOutlined style={{ fontSize: 28, color: '#babfc4' }} />
              }
              onClick={() => onAccept(comment.id)}
              style={{ padding: 0, height: 'auto', marginTop: 8 }}
            />
          </Tooltip>
        ) : comment.is_accepted ? (
          <Tooltip title="Câu trả lời đã được chấp nhận">
            <CheckCircleFilled style={{ fontSize: 28, color: '#5eba7d', marginTop: 8 }} />
          </Tooltip>
        ) : null}
      </div>

      <div style={{ flex: 1 }}>
        {comment.is_accepted && (
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', color: '#5eba7d' }}>
            <CheckOutlined style={{ marginRight: 8, fontSize: 16, fontWeight: 'bold' }} />
            <Text strong style={{ color: '#5eba7d', fontSize: 14 }}>CÂU TRẢ LỜI ĐƯỢC CHẤP NHẬN</Text>
          </div>
        )}
        <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: '#232629', marginBottom: 12, whiteSpace: 'pre-wrap' }}>
          {comment.content}
        </Paragraph>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="link"
            size="small"
            style={{ padding: 0, color: '#6a737c', fontSize: 13 }}
            icon={<MessageOutlined />}
            onClick={() => onToggleReply(comment.id)}
          >
            Phản hồi
          </Button>
          <div style={{
            backgroundColor: comment.is_accepted ? '#d3f0df' : '#e1ecf4',
            borderRadius: 4,
            padding: '8px 10px',
            fontSize: 12
          }}>
            <Avatar size="small" style={{ backgroundColor: '#f48024', marginRight: 6 }} icon={<UserOutlined />} />
            <Text strong style={{ color: '#0074cc' }}>{comment.author_name}</Text>
            {getRoleBadge(comment.author_role)}
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>trả lời {moment(comment.created_at).fromNow()}</Text>
          </div>
        </div>

        {replyingTo === comment.id && (
          <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f8f9f9', borderRadius: 4, border: '1px solid #e3e6e8' }}>
            <TextArea
              rows={3}
              value={replyContent}
              onChange={(e) => onReplyContentChange(e.target.value)}
              placeholder={`Phản hồi cho ${comment.author_name}...`}
              style={{ marginBottom: 8 }}
            />
            <Space>
              <Button type="primary" size="small" loading={submitting} onClick={() => onSubmitReply(comment.id)}>Gửi phản hồi</Button>
              <Button size="small" onClick={onCancelReply}>Hủy</Button>
            </Space>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {comment.replies.map(reply => (
              <ReplyItem key={reply.id} reply={reply} onVote={onVote} />
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const BASE_URL = 'http://localhost:8002';

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}/api/posts/${id}/`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else {
        message.error('Không tìm thấy bài viết');
        history.push('/forum');
      }
    } catch (error) {
      message.error('Lỗi kết nối server');
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}/api/comments/?post=${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Lỗi tải bình luận', error);
    }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/notifications/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        const unread = data.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      console.error('Lỗi tải thông báo', e);
    }
  };

  const handleReadNotification = async (notification: any) => {
    if (!notification.is_read) {
      const token = localStorage.getItem('access_token');
      try {
        await fetch(`${BASE_URL}/api/notifications/${notification.id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ is_read: true })
        });
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(c => Math.max(0, c - 1));
      } catch (e) {
        console.error(e);
      }
    }
    
    if (notification.target_post_id) {
      history.push(`/forum/post/${notification.target_post_id}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${BASE_URL}/api/notifications/mark_all_as_read/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        message.success('Đã đánh dấu tất cả thông báo là đã đọc');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    let interval: any;
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      fetchNotifications();
      interval = setInterval(fetchNotifications, 10000);
    }
    const loadData = async () => {
      setLoading(true);
      await fetchPost();
      await fetchComments();
      setLoading(false);
    };
    loadData();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id]);

  const handleLogout = () => {
    localStorage.clear();
    history.push('/auth');
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: 'Tài khoản' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout },
  ];

  const handlePostVote = async (value: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để vote');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/posts/${id}/vote/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value })
      });
      if (res.ok) {
        const data = await res.json();
        setPost(prev => prev ? { ...prev, score: data.score, user_vote: data.user_vote } : null);
      }
    } catch (error) {
      message.error('Lỗi khi vote bài viết');
    }
  };

  const handleCommentVote = async (commentId: number, value: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để vote');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/comments/${commentId}/vote/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value })
      });
      if (res.ok) {
        await fetchComments(); // Reload để cập nhật điểm và trạng thái vote cho cả reply
      }
    } catch (error) {
      message.error('Lỗi khi vote bình luận');
    }
  };

  const handleSubmitAnswer = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để trả lời');
      history.push('/auth');
      return;
    }
    if (!answerContent.trim()) {
      message.warning('Vui lòng nhập nội dung câu trả lời');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ post: Number(id), content: answerContent })
      });
      if (res.ok) {
        message.success('Đã đăng câu trả lời!');
        setAnswerContent('');
        await fetchComments();
      } else {
        const err = await res.json();
        message.error(err.detail || 'Có lỗi xảy ra');
      }
    } catch (error) {
      message.error('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để phản hồi');
      history.push('/auth');
      return;
    }
    if (!replyContent.trim()) {
      message.warning('Vui lòng nhập nội dung phản hồi');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/api/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ post: Number(id), content: replyContent, parent: parentId })
      });
      if (res.ok) {
        message.success('Đã đăng phản hồi!');
        setReplyContent('');
        setReplyingTo(null);
        await fetchComments();
      } else {
        const err = await res.json();
        message.error(err.detail || 'Có lỗi xảy ra');
      }
    } catch (error) {
      message.error('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (commentId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/comments/${commentId}/accept/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        message.success('Đã cập nhật trạng thái chấp nhận!');
        await fetchComments();
      } else {
        const err = await res.json();
        message.error(err.detail || 'Không thể cập nhật');
      }
    } catch (error) {
      message.error('Lỗi kết nối server');
    }
  };

  const handleToggleReply = (commentId: number) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyContent('');
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Empty description="Không tìm thấy bài viết" />
      </div>
    );
  }

  const isPostAuthor = user && user.username === post.author_name;
  const isLecturer = user && user.role === 'LECTURER';
  const canAccept = isPostAuthor || isLecturer;

  const notificationContent = (
    <div style={{ width: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
        <Text strong style={{ fontSize: 16 }}>Thông báo</Text>
        {unreadCount > 0 && (
          <a onClick={handleMarkAllAsRead} style={{ fontSize: 13, color: '#0074cc' }}>
            Đánh dấu tất cả đã đọc
          </a>
        )}
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifications.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
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
                <Avatar 
                  style={{ backgroundColor: item.notification_type === 'WELCOME' ? '#f48024' : '#0074cc', flexShrink: 0 }}
                  icon={<UserOutlined />}
                />
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
        ) : (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <Empty description="Không có thông báo nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )}
      </div>
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
          <style>{`
            .notification-item:hover {
              background-color: #e6f7ff !important;
            }
          `}</style>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
            <div
              style={{ fontSize: 22, fontWeight: 800, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', marginRight: 24 }}
              onClick={() => history.push('/forum')}
            >
              <FireOutlined style={{ color: '#f48024', marginRight: 4 }} />
              <span>edu<Text strong style={{ color: '#f48024' }}>forum</Text></span>
            </div>
            <div style={{ flex: 1, padding: '0 24px 0 0' }}>
              <Input
                prefix={<SearchOutlined style={{ color: '#838c95' }} />}
                placeholder="Tìm kiếm câu hỏi..."
                style={{ borderRadius: 3, border: '1px solid #babfc4' }}
              />
            </div>
            <Space size={20}>
              {user ? (
                <>
                  <Popover
                    content={notificationContent}
                    title={null}
                    trigger="click"
                    placement="bottomRight"
                    overlayClassName="notification-popover"
                  >
                    <Badge count={unreadCount} size="small" overflowCount={99}>
                      <Button type="text" icon={<BellOutlined style={{ fontSize: 20, color: '#525960' }} />} />
                    </Badge>
                  </Popover>
                  <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                    <Avatar style={{ backgroundColor: '#f48024', cursor: 'pointer' }} icon={<UserOutlined />} />
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

        <Content style={{ marginTop: 56, maxWidth: 1100, margin: '56px auto 0', width: '100%', padding: '0 24px' }}>
          <div style={{ padding: '16px 0' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => history.push('/forum')}
              style={{ color: '#6a737c', marginBottom: 16, paddingLeft: 0 }}
            >
              Quay lại danh sách câu hỏi
            </Button>

            <div style={{ borderBottom: '1px solid #e3e6e8', paddingBottom: 16, marginBottom: 16 }}>
              <Title level={2} style={{ margin: 0, fontWeight: 400, color: '#3b4045', marginBottom: 8 }}>
                {post.title}
              </Title>
              <Space size={16} style={{ color: '#6a737c', fontSize: 13 }}>
                <span><ClockCircleOutlined style={{ marginRight: 4 }} />Hỏi {moment(post.created_at).fromNow()}</span>
                <span>Lượt xem: {post.view_count}</span>
                <span>Cập nhật: {moment(post.updated_at).fromNow()}</span>
              </Space>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48, gap: 4, paddingTop: 4 }}>
                <Button 
                  type="text" 
                  icon={<CaretUpOutlined style={{ fontSize: 32, color: post.user_vote === 1 ? '#f48024' : '#babfc4' }} />} 
                  onClick={() => handlePostVote(1)}
                  style={{ padding: 0, height: 'auto' }} 
                />
                <Text strong style={{ fontSize: 22, color: '#6a737c' }}>{post.score}</Text>
                <Button 
                  type="text" 
                  icon={<CaretDownOutlined style={{ fontSize: 32, color: post.user_vote === -1 ? '#39739d' : '#babfc4' }} />} 
                  onClick={() => handlePostVote(-1)}
                  style={{ padding: 0, height: 'auto' }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: '#232629', marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </Paragraph>
                <Space size={4} style={{ marginBottom: 16 }}>
                  {post.tags.map(t => (
                    <Tag key={t.id} style={{ backgroundColor: '#e1ecf4', color: '#39739d', border: 'none', cursor: 'pointer' }} onClick={() => history.push('/forum')}>
                      {t.name}
                    </Tag>
                  ))}
                </Space>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ backgroundColor: '#e1ecf4', borderRadius: 4, padding: '8px 10px', fontSize: 12 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>đã hỏi {moment(post.created_at).fromNow()}</Text>
                    <br />
                    <Avatar size="small" style={{ backgroundColor: '#f48024', marginRight: 6, marginTop: 4 }} icon={<UserOutlined />} />
                    <Text strong style={{ color: '#0074cc' }}>{post.author_name}</Text>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderBottom: '1px solid #e3e6e8', paddingBottom: 12, marginBottom: 4 }}>
              <Title level={3} style={{ margin: 0, fontWeight: 400, color: '#3b4045' }}>
                {comments.length} Câu trả lời
              </Title>
            </div>

            <div style={{ marginLeft: 48 }}>
              {comments.length > 0 ? (
                comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    canAccept={!!canAccept}
                    replyingTo={replyingTo}
                    replyContent={replyContent}
                    submitting={submitting}
                    onToggleReply={handleToggleReply}
                    onReplyContentChange={setReplyContent}
                    onSubmitReply={handleSubmitReply}
                    onCancelReply={handleCancelReply}
                    onAccept={handleAcceptAnswer}
                    onVote={handleCommentVote}
                  />
                ))
              ) : (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 15 }}>Chưa có câu trả lời nào. Hãy là người đầu tiên trả lời!</Text>
                </div>
              )}
            </div>

            <div style={{ marginTop: 32, paddingBottom: 48 }}>
              <Title level={3} style={{ fontWeight: 400, color: '#3b4045', marginBottom: 16 }}>Câu trả lời của bạn</Title>
              {user ? (
                <>
                  <TextArea
                    rows={5}
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    placeholder="Viết câu trả lời chi tiết, rõ ràng để giúp người hỏi giải quyết vấn đề..."
                    style={{ marginBottom: 12, border: '1px solid #babfc4', borderRadius: 4, fontSize: 14 }}
                  />
                  <div style={{ textAlign: 'right' }}>
                    <Button type="primary" size="large" loading={submitting} onClick={handleSubmitAnswer} icon={<CheckOutlined />}>
                      Đăng câu trả lời
                    </Button>
                  </div>
                </>
              ) : (
                <div style={{ padding: 24, backgroundColor: '#fdf7e2', border: '1px solid #f1e5bc', borderRadius: 4, textAlign: 'center' }}>
                  <Text style={{ fontSize: 15, color: '#3b4045' }}>
                    Bạn cần <a onClick={() => history.push('/auth')} style={{ color: '#0074cc', fontWeight: 600 }}>đăng nhập</a> để đăng câu trả lời.
                  </Text>
                </div>
              )}
            </div>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default PostDetailPage;
