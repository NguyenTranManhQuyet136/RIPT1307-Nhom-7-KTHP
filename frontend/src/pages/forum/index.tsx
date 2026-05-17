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
  Dropdown,
  Select,
  Popover
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ordering, setOrdering] = useState('-created_at');
  const [unanswered, setUnanswered] = useState(false);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [editorEmpty, setEditorEmpty] = useState(true);
  const [fullSearchText, setFullSearchText] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const BASE_URL = 'http://localhost:8002';

  const fetchData = async (params: { tag?: string; search?: string; ordering?: string; unanswered?: boolean } = {}) => {
    setLoading(true);
    try {
      const { 
        tag: tagsFromParam, 
        search: searchFromParam, 
        ordering: ord = ordering, 
        unanswered: unans = unanswered 
      } = params;

      // Ưu tiên dùng dữ liệu truyền trực tiếp vào hàm, nếu không có mới dùng state
      const currentTags = tagsFromParam !== undefined ? (tagsFromParam ? tagsFromParam.split(',') : []) : selectedTags;
      const currentSearch = searchFromParam !== undefined ? searchFromParam : searchQuery;

      const queryParams = new URLSearchParams();
      if (currentTags.length > 0) queryParams.append('tag', currentTags.join(','));
      if (currentSearch) queryParams.append('search', currentSearch);
      if (ord) queryParams.append('ordering', ord);
      if (unans) queryParams.append('unanswered', 'true');

      const url = `${BASE_URL}/api/posts/?${queryParams.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      // Đảm bảo tương thích cả khi Backend có phân trang hoặc không
      setPosts(data.results || (Array.isArray(data) ? data : []));
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
      
      // Kiểm tra thông báo mới mỗi 10 giây
      interval = setInterval(fetchNotifications, 10000);
    }
    fetchData();
    fetchTags();
    if (editorRef.current) {
      setEditorTagsAndText(selectedTags, searchQuery);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
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

  const checkIsEditorEmpty = () => {
    if (!editorRef.current) return true;
    const hasTags = editorRef.current.querySelector('.forum-search-tag') !== null;
    const text = editorRef.current.textContent || '';
    return !hasTags && text.trim() === '';
  };

  const setEditorTagsAndText = (tags: string[], text: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.innerHTML = '';
    
    tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'forum-search-tag';
      tagEl.setAttribute('contenteditable', 'false');
      tagEl.textContent = `#${tag}`;
      
      tagEl.oncontextmenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const plainTextNode = document.createTextNode(`#${tag}`);
        tagEl.parentNode?.replaceChild(plainTextNode, tagEl);
        
        const newRange = document.createRange();
        newRange.setStart(plainTextNode, plainTextNode.length);
        newRange.setEnd(plainTextNode, plainTextNode.length);
        const newSel = window.getSelection();
        newSel?.removeAllRanges();
        newSel?.addRange(newRange);
        
        setEditorEmpty(checkIsEditorEmpty());
      };
      
      editorRef.current?.appendChild(tagEl);
      editorRef.current?.appendChild(document.createTextNode(' '));
    });
    
    if (text) {
      editorRef.current.appendChild(document.createTextNode(text));
    }
    
    setEditorEmpty(tags.length === 0 && !text);
  };

  const packageLooseHashtagsInPlace = (container: HTMLDivElement | null) => {
    if (!container) return;
    const hashtagRegex = /(?<=^|\s)#([^\s#]+)(?=$|\s)/g;
    const textNodes: Text[] = [];
    const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    let node: Node | null;
    while (node = walk.nextNode()) {
      if (node.parentNode && (node.parentNode as HTMLElement).classList.contains('forum-search-tag')) {
        continue;
      }
      textNodes.push(node as Text);
    }
    
    textNodes.forEach(textNode => {
      const text = textNode.nodeValue || '';
      const matches = [...text.matchAll(hashtagRegex)];
      if (matches.length === 0) return;
      
      const parent = textNode.parentNode;
      if (!parent) return;
      
      let lastIdx = 0;
      const fragment = document.createDocumentFragment();
      
      matches.forEach(match => {
        const matchIdx = match.index || 0;
        if (matchIdx > lastIdx) {
          fragment.appendChild(document.createTextNode(text.substring(lastIdx, matchIdx)));
        }
        
        const tagText = match[1];
        const tagEl = document.createElement('span');
        tagEl.className = 'forum-search-tag';
        tagEl.setAttribute('contenteditable', 'false');
        tagEl.textContent = `#${tagText}`;
        
        tagEl.oncontextmenu = (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          const plainTextNode = document.createTextNode(`#${tagText}`);
          tagEl.parentNode?.replaceChild(plainTextNode, tagEl);
          
          const newRange = document.createRange();
          newRange.setStart(plainTextNode, plainTextNode.length);
          newRange.setEnd(plainTextNode, plainTextNode.length);
          const newSel = window.getSelection();
          newSel?.removeAllRanges();
          newSel?.addRange(newRange);
          
          setEditorEmpty(checkIsEditorEmpty());
        };
        
        fragment.appendChild(tagEl);
        lastIdx = matchIdx + match[0].length;
      });
      
      if (lastIdx < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIdx)));
      }
      
      parent.replaceChild(fragment, textNode);
    });
  };

  const parseContentEditableDOM = (container: HTMLDivElement | null) => {
    if (!container) return { tags: [], keywords: '' };
    
    const tags: string[] = [];
    let textParts: string[] = [];
    
    container.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        textParts.push(node.nodeValue || '');
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.classList.contains('forum-search-tag')) {
          const tagText = el.textContent || '';
          tags.push(tagText.replace('#', '').toLowerCase());
        } else {
          textParts.push(el.textContent || '');
        }
      }
    });
    
    const keywords = textParts.join('').replace(/\s+/g, ' ').trim();
    return { 
      tags: Array.from(new Set(tags)), 
      keywords 
    };
  };

  const getFullSearchText = (container: HTMLDivElement | null) => {
    if (!container) return '';
    let parts: string[] = [];
    container.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        parts.push(node.nodeValue || '');
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.classList.contains('forum-search-tag')) {
          parts.push((el.textContent || '').toLowerCase());
        } else {
          parts.push(el.textContent || '');
        }
      }
    });
    return parts.join('').replace(/\s+/g, ' ').trim();
  };

  const filterByTag = (tagName: string | null) => {
    if (tagName) {
      const lowerTagName = tagName.toLowerCase();
      setSelectedTags([lowerTagName]);
      setSearchQuery('');
      setFullSearchText(`#${lowerTagName}`);
      setEditorTagsAndText([lowerTagName], '');
      fetchData({ tag: lowerTagName, search: '' });
    } else {
      setSelectedTags([]);
      setSearchQuery('');
      setFullSearchText('');
      setEditorTagsAndText([], '');
      fetchData({ tag: undefined, search: '' });
    }
  };

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || !selection.focusNode) {
      setEditorEmpty(checkIsEditorEmpty());
      return;
    }
    
    const node = selection.focusNode;
    if (node.nodeType !== Node.TEXT_NODE) {
      setEditorEmpty(checkIsEditorEmpty());
      return;
    }
    
    const text = node.nodeValue || '';
    const offset = selection.focusOffset;
    
    const textBeforeCaret = text.substring(0, offset);
    const hashtagMatch = textBeforeCaret.match(/(?:^|\s)#([^\s#]+)\s$/);
    
    if (hashtagMatch) {
      const fullMatch = hashtagMatch[0];
      const tagText = hashtagMatch[1];
      
      const hasLeadingSpace = fullMatch.startsWith(' ');
      const keepText = textBeforeCaret.substring(0, textBeforeCaret.length - fullMatch.length) + (hasLeadingSpace ? ' ' : '');
      
      const afterText = text.substring(offset);
      node.nodeValue = keepText;
      
      const tagEl = document.createElement('span');
      tagEl.className = 'forum-search-tag';
      tagEl.setAttribute('contenteditable', 'false');
      tagEl.textContent = `#${tagText}`;
      
      tagEl.oncontextmenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const plainTextNode = document.createTextNode(`#${tagText}`);
        tagEl.parentNode?.replaceChild(plainTextNode, tagEl);
        
        const newRange = document.createRange();
        newRange.setStart(plainTextNode, plainTextNode.length);
        newRange.setEnd(plainTextNode, plainTextNode.length);
        const newSel = window.getSelection();
        newSel?.removeAllRanges();
        newSel?.addRange(newRange);
        
        setEditorEmpty(checkIsEditorEmpty());
      };
      
      const trailingSpaceNode = document.createTextNode(' ' + afterText);
      const parent = node.parentNode;
      
      if (parent) {
        if (node.nextSibling) {
          parent.insertBefore(tagEl, node.nextSibling);
          parent.insertBefore(trailingSpaceNode, tagEl.nextSibling);
        } else {
          parent.appendChild(tagEl);
          parent.appendChild(trailingSpaceNode);
        }
        
        const range = document.createRange();
        range.setStart(trailingSpaceNode, 1);
        range.setEnd(trailingSpaceNode, 1);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    setEditorEmpty(checkIsEditorEmpty());
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
      return;
    }
    
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (selection && selection.focusNode) {
        const node = selection.focusNode;
        const offset = selection.focusOffset;
        
        if (node.nodeType === Node.TEXT_NODE && offset === 0) {
          const prevSibling = node.previousSibling as HTMLElement;
          if (prevSibling && prevSibling.classList && prevSibling.classList.contains('forum-search-tag')) {
            e.preventDefault();
            prevSibling.parentNode?.removeChild(prevSibling);
            
            setTimeout(() => {
              setEditorEmpty(checkIsEditorEmpty());
            }, 0);
            return;
          }
        }
      }
    }
    
    setTimeout(() => {
      setEditorEmpty(checkIsEditorEmpty());
    }, 0);
  };

  const executeSearch = () => {
    packageLooseHashtagsInPlace(editorRef.current);
    
    const { tags, keywords } = parseContentEditableDOM(editorRef.current);
    
    setSearchQuery(keywords);
    setSelectedTags(tags);
    setFullSearchText(getFullSearchText(editorRef.current));
    
    if (editorRef.current) {
      editorRef.current.blur();
    }
    
    setEditorEmpty(checkIsEditorEmpty());
    fetchData({ tag: tags.join(','), search: keywords });
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
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1264, margin: '0 auto' }}>
            <div 
              style={{ fontSize: 22, fontWeight: 800, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', width: 164 }}
              onClick={() => { filterByTag(null); history.push('/forum'); }}
            >
              <FireOutlined style={{ color: '#f48024', marginRight: 4 }} />
              <span>edu<Text strong style={{ color: '#f48024' }}>forum</Text></span>
            </div>

            <div style={{ flex: 1, padding: '0 24px 0 0', display: 'flex', alignItems: 'center' }}>
              <style>{`
                .forum-search-editor {
                  position: relative;
                  border: 1px solid #d9d9d9;
                  border-radius: 3px 0 0 3px;
                  padding: 4px 11px;
                  height: 32px;
                  box-sizing: border-box;
                  white-space: nowrap;
                  overflow-x: auto;
                  overflow-y: hidden;
                  outline: none;
                  background-color: #fff;
                  flex: 1;
                  min-width: 0;
                  width: 0;
                  cursor: text;
                  font-size: 14px;
                  line-height: 22px;
                  transition: all 0.3s;
                  -ms-overflow-style: none;  /* IE and Edge */
                  scrollbar-width: none;  /* Firefox */
                }
                .forum-search-editor::-webkit-scrollbar {
                  display: none; /* Chrome, Safari and Opera */
                }
                .forum-search-editor:hover {
                  border-color: #f48024;
                }
                .forum-search-editor:focus {
                  border-color: #f48024;
                  box-shadow: 0 0 0 2px rgba(244, 128, 36, 0.2);
                }
                .forum-search-editor.show-placeholder:before {
                  content: attr(placeholder);
                  color: #bfbfbf;
                  cursor: text;
                  pointer-events: none;
                  position: absolute;
                  left: 11px;
                  top: 4px;
                }
                .forum-search-tag {
                  background-color: #e1ecf4;
                  color: #39739d;
                  border-radius: 2px;
                  padding: 0 6px;
                  margin: 0 2px;
                  display: inline-block;
                  font-weight: 500;
                  user-select: none;
                }
                .forum-search-tag:hover {
                  background-color: #d0e3f0;
                }
                .notification-item:hover {
                  background-color: #e6f7ff !important;
                }
              `}</style>
              <div
                ref={editorRef}
                className={`forum-search-editor ${editorEmpty ? 'show-placeholder' : ''}`}
                contentEditable
                onInput={handleEditorInput}
                onKeyDown={handleEditorKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Tìm kiếm... (Sử dụng #tag để lọc theo thẻ)"
                style={{
                  borderColor: isFocused ? '#f48024' : '#d9d9d9',
                  boxShadow: isFocused ? '0 0 0 2px rgba(244, 128, 36, 0.2)' : 'none',
                }}
              />
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={executeSearch}
                style={{ 
                  backgroundColor: '#f48024', 
                  borderColor: '#f48024', 
                  borderTopLeftRadius: 0, 
                  borderBottomLeftRadius: 0,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
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
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
