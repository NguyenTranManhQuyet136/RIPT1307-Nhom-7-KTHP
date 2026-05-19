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
  notification,
  ConfigProvider,
  theme,
  Badge,
  Tooltip,
  Dropdown,
  Spin,
  Empty,
  Popover,
  List,
  Pagination
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
  CheckOutlined,
  CloseCircleFilled,
  ExclamationCircleFilled
} from '@ant-design/icons';
import { history, useParams } from 'umi';
import moment from 'moment';
import 'moment/locale/vi';
import { ForumHeader } from '../components/shared/ForumHeader';

moment.locale('vi');
moment.updateLocale('vi', {
  relativeTime: {
    future: '%s tới',
    past: '%s trước',
    s: 'vài giây',
    ss: '%d giây',
    m: '1 phút',
    mm: '%d phút',
    h: '1 giờ',
    hh: '%d giờ',
    d: '1 ngày',
    dd: '%d ngày',
    M: '1 tháng',
    MM: '%d tháng',
    y: '1 năm',
    yy: '%d năm'
  }
});

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
  author_username?: string;
  author_avatar?: string;
  author_role?: string;
  author_is_verified?: boolean;
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
  author_avatar?: string;
  author_is_verified?: boolean;
  content: string;
  parent: number;
  is_accepted: boolean;
  accepted_by_author?: boolean;
  accepted_by_lecturer?: boolean;
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
  author_avatar?: string;
  author_is_verified?: boolean;
  content: string;
  parent: number | null;
  is_accepted: boolean;
  accepted_by_author?: boolean;
  accepted_by_lecturer?: boolean;
  score: number;
  user_vote: number;
  replies: CommentReply[];
  created_at: string;
}

const getRoleBadge = (role: string, isVerified?: boolean) => {
  if (role === 'LECTURER') {
    if (isVerified) {
      return (
        <Tag color="processing" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, marginLeft: 6, borderRadius: 3 }}>
          <CheckCircleFilled style={{ color: '#52c41a' }} /> Giảng viên
        </Tag>
      );
    } else {
      return (
        <Tag color="warning" style={{ fontSize: 11, marginLeft: 6, borderRadius: 3 }}>
          Giảng viên (Chưa xác thực)
        </Tag>
      );
    }
  }
  if (role === 'ADMIN') {
    return <Tag color="red" style={{ fontSize: 11, marginLeft: 6, borderRadius: 3 }}>Admin</Tag>;
  }
  if (role === 'STUDENT') {
    return <Tag color="cyan" style={{ fontSize: 11, marginLeft: 6, borderRadius: 3 }}>Sinh viên</Tag>;
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
          <Text 
            strong 
            style={{ 
              color: '#0074cc', 
              fontSize: 13, 
              maxWidth: 120, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              display: 'inline-block',
              verticalAlign: 'middle'
            }}
            title={reply.author_name}
          >
            {reply.author_name}
          </Text>
          {getRoleBadge(reply.author_role, reply.author_is_verified)}
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
  isPostAuthor?: boolean;
  isLecturer?: boolean;
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
  isPostAuthor,
  isLecturer,
  replyingTo,
  replyContent,
  submitting,
  onToggleReply,
  onReplyContentChange,
  onSubmitReply,
  onCancelReply,
  onAccept,
  onVote
}) => {
  const isAcceptedByMe = isPostAuthor 
    ? comment.accepted_by_author 
    : isLecturer 
    ? comment.accepted_by_lecturer 
    : comment.is_accepted;

  return (
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
            <Tooltip title={isAcceptedByMe ? "Bỏ chấp nhận câu trả lời" : "Chấp nhận câu trả lời"}>
              <Button
                type="text"
                icon={isAcceptedByMe ? 
                  <CheckCircleFilled style={{ fontSize: 28, color: '#5eba7d' }} /> : 
                  <CheckCircleOutlined style={{ fontSize: 28, color: '#babfc4' }} />
                }
                onClick={() => onAccept(comment.id)}
                style={{ padding: 0, height: 'auto', marginTop: 8 }}
              />
            </Tooltip>
          ) : comment.is_accepted ? (
            <Tooltip title={
              comment.accepted_by_author && comment.accepted_by_lecturer
                ? "Câu trả lời đã được chấp nhận bởi Tác giả và Giảng viên"
                : comment.accepted_by_lecturer
                ? "Câu trả lời đã được chấp nhận bởi Giảng viên"
                : "Câu trả lời đã được chấp nhận bởi Tác giả"
            }>
              <CheckCircleFilled style={{ fontSize: 28, color: '#5eba7d', marginTop: 8 }} />
            </Tooltip>
          ) : null}
        </div>

      <div style={{ flex: 1 }}>
        {comment.is_accepted && (
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', color: '#5eba7d' }}>
            <CheckOutlined style={{ marginRight: 8, fontSize: 16, fontWeight: 'bold' }} />
            <Text strong style={{ color: '#5eba7d', fontSize: 13, letterSpacing: '0.5px' }}>
              {comment.accepted_by_author && comment.accepted_by_lecturer
                ? 'ĐƯỢC CHẤP NHẬN BỞI TÁC GIẢ, GIẢNG VIÊN'
                : comment.accepted_by_lecturer
                ? 'ĐƯỢC CHẤP NHẬN BỞI GIẢNG VIÊN'
                : 'ĐƯỢC CHẤP NHẬN BỞI TÁC GIẢ'}
            </Text>
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
            {comment.author_avatar ? (
              <Avatar 
                size="small" 
                src={comment.author_avatar.startsWith('http') ? comment.author_avatar : `http://localhost:8002${comment.author_avatar}`} 
                style={{ marginRight: 6 }}
              />
            ) : comment.author_name ? (
              <Avatar 
                size="small" 
                style={{ 
                  backgroundColor: comment.author_role === 'LECTURER' ? '#0074cc' : '#f48024', 
                  fontWeight: 700, 
                  fontSize: 10,
                  marginRight: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {comment.author_name.charAt(0).toUpperCase()}
              </Avatar>
            ) : (
              <Avatar 
                size="small" 
                icon={<UserOutlined />} 
                style={{ marginRight: 6 }}
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
              title={comment.author_name}
            >
              {comment.author_name}
            </Text>
            {getRoleBadge(comment.author_role, comment.author_is_verified)}
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
};

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
  const [commentCurrentPage, setCommentCurrentPage] = useState(1);

  const showSuccess = (msg: string) => {
    message.success(msg);
  };

  const showError = (msg: string) => {
    message.error(msg);
  };

  const showWarning = (msg: string) => {
    message.warning(msg);
  };

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
        showError('Không tìm thấy bài viết');
        history.push('/forum');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
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

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const loadData = async () => {
      setLoading(true);
      setCommentCurrentPage(1);
      await fetchPost();
      await fetchComments();
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handlePostVote = async (value: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      showWarning('Vui lòng đăng nhập để vote');
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
        if (data.status === 'voted') {
          showSuccess(value === 1 ? 'Đã bình chọn thích bài viết này thành công!' : 'Đã bình chọn không thích bài viết này.');
        } else {
          showSuccess('Đã hủy bỏ lượt bình chọn cho bài viết.');
        }
      }
    } catch (error) {
      showError('Lỗi khi vote bài viết');
    }
  };

  const handleCommentVote = async (commentId: number, value: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      showWarning('Vui lòng đăng nhập để vote');
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
        const data = await res.json();
        await fetchComments(); // Reload để cập nhật điểm và trạng thái vote cho cả reply
        if (data.status === 'voted') {
          showSuccess(value === 1 ? 'Đã bình chọn câu trả lời này là hữu ích!' : 'Đã bình chọn câu trả lời này không hữu ích.');
        } else {
          showSuccess('Đã hủy bỏ lượt bình chọn cho câu trả lời.');
        }
      }
    } catch (error) {
      showError('Lỗi khi vote bình luận');
    }
  };

  const handleSubmitAnswer = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      showWarning('Vui lòng đăng nhập để trả lời');
      history.push('/auth');
      return;
    }
    if (!answerContent.trim()) {
      showWarning('Vui lòng nhập nội dung câu trả lời');
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
        showSuccess('Đăng câu trả lời thành công! Nội dung phản hồi của bạn đã được hiển thị bên dưới câu hỏi.');
        setAnswerContent('');
        await fetchComments();
      } else {
        const err = await res.json();
        showError(err.detail || 'Có lỗi xảy ra');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      showWarning('Vui lòng đăng nhập để phản hồi');
      history.push('/auth');
      return;
    }
    if (!replyContent.trim()) {
      showWarning('Vui lòng nhập nội dung phản hồi');
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
        showSuccess('Đăng phản hồi thành công! Ý kiến của bạn đã được cập nhật thành công.');
        setReplyContent('');
        setReplyingTo(null);
        await fetchComments();
      } else {
        const err = await res.json();
        showError(err.detail || 'Có lỗi xảy ra');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
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
        showSuccess('Đã cập nhật trạng thái chấp nhận!');
        await fetchComments();
      } else {
        const err = await res.json();
        showError(err.detail || 'Không thể cập nhật');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
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

  const isPostAuthor = user && user.username === post.author_username;
  const isLecturer = user && (user.role === 'LECTURER' && (user.is_verified_lecturer || user.is_verified) || user.role === 'ADMIN');
  const canAccept = isPostAuthor || isLecturer;

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
        <ForumHeader user={user} />

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
                    {post.author_avatar ? (
                      <Avatar 
                        size="small" 
                        src={post.author_avatar.startsWith('http') ? post.author_avatar : `http://localhost:8002${post.author_avatar}`} 
                        style={{ marginRight: 6 }}
                      />
                    ) : post.author_name ? (
                      <Avatar 
                        size="small" 
                        style={{ 
                          backgroundColor: post.author_role === 'LECTURER' ? '#0074cc' : '#f48024', 
                          fontWeight: 700, 
                          fontSize: 10,
                          marginRight: 6,
                          display: 'inline-flex',
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
                        style={{ marginRight: 6 }}
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
                    <br />
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>đã hỏi {moment(post.created_at).fromNow()}</Text>
                    </div>
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
                <>
                  {comments.slice((commentCurrentPage - 1) * 5, commentCurrentPage * 5).map(comment => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      canAccept={!!canAccept}
                      isPostAuthor={isPostAuthor}
                      isLecturer={isLecturer}
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
                  ))}
                  <Pagination 
                    current={commentCurrentPage} 
                    onChange={setCommentCurrentPage} 
                    pageSize={5} 
                    total={comments.length} 
                    showSizeChanger={false} 
                    style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }} 
                  />
                </>
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
