// Senior FE Carousel Implementation
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
  notification,
  ConfigProvider, 
  theme,
  List,
  Divider,
  Empty,
  Badge,
  Tooltip,
  Dropdown,
  Select,
  Popover,
  Spin,
  Pagination
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
  SettingOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  ClockCircleOutlined,
  MessageOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import { history, useLocation } from 'umi';
import moment from 'moment';
import 'moment/locale/vi';
import { ForumHeader } from './components/shared/ForumHeader';
import { ForumSider } from './components/shared/ForumSider';
import { PostItem } from './components/feed/PostItem';
import { CreatePostModal } from './components/feed/CreatePostModal';
import { SidebarWidgets } from './components/feed/SidebarWidgets';

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
  author_username?: string;
  author_avatar?: string;
  author_role?: string;
  author_is_verified?: boolean;
  tags: TagType[];
  comment_count: number;
  view_count: number;
  score: number;
  is_edited?: boolean;
}

const getSnippet = (text: string) => {
  if (!text) return '';
  const cleanText = text.replace(/<[^>]*>/g, '').replace(/[#*`_]/g, '');
  return cleanText.length > 80 ? cleanText.substring(0, 80) + '...' : cleanText;
};

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

const ForumPage: React.FC = () => {
  const location = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
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
  const [notificationLimit, setNotificationLimit] = useState<number>(10);
  const notifiedIdsRef = React.useRef<Set<number>>(new Set());
  const isFirstLoadRef = React.useRef(true);
  const [activeTab, setActiveTab] = useState('home');
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [lecturersLoading, setLecturersLoading] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [activeToast, setActiveToast] = useState<{ id: any; type: string; message: string; target_post_id?: any } | null>(null);

  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [studentStats, setStudentStats] = useState({ total: 120, online: 5 });
  const [lecturerStats, setLecturerStats] = useState({ total: 8, online: 2 });

  const [homeCurrentPage, setHomeCurrentPage] = useState(1);
  const [hotTopicsPage, setHotTopicsPage] = useState(0);
  const [tagsCurrentPage, setTagsCurrentPage] = useState(1);
  const [lecturersCurrentPage, setLecturersCurrentPage] = useState(1);
  const [myQuestionsCurrentPage, setMyQuestionsCurrentPage] = useState(1);

  const fetchTotalPostsCount = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/posts/`);
      const data = await res.json();
      const count = data.count !== undefined ? data.count : (data.results ? data.results.length : (Array.isArray(data) ? data.length : 0));
      setTotalPostsCount(count);
    } catch (e) {
      console.error('Lỗi tải tổng số câu hỏi', e);
    }
  };

  const showSuccess = (msg: string) => {
    setActiveToast({
      id: Date.now(),
      type: 'SUCCESS',
      message: msg
    });
  };

  const showError = (msg: string) => {
    setActiveToast({
      id: Date.now(),
      type: 'ERROR',
      message: msg
    });
  };

  const showWarning = (msg: string) => {
    setActiveToast({
      id: Date.now(),
      type: 'WARNING',
      message: msg
    });
  };

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
      showError('Không thể tải bài viết');
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

  const fetchLecturers = async () => {
    setLecturersLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/lecturers/verified/`);
      const data = await res.json();
      setLecturers(data);
    } catch (e) {
      console.error(e);
      showError('Không thể tải danh sách giảng viên');
    } finally {
      setLecturersLoading(false);
    }
  };

  useEffect(() => {
    const pendingToastSuccess = localStorage.getItem('trigger_toast_success');
    if (pendingToastSuccess) {
      showSuccess(pendingToastSuccess);
      localStorage.removeItem('trigger_toast_success');
    }
    const pendingToastError = localStorage.getItem('trigger_toast_error');
    if (pendingToastError) {
      showError(pendingToastError);
      localStorage.removeItem('trigger_toast_error');
    }

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchTags();
    fetchTotalPostsCount();

    // Tải thông tin thống kê thực tế về học sinh + giảng viên từ cơ sở dữ liệu
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/public-stats/`);
        if (res.ok) {
          const data = await res.json();
          setStudentStats(prev => ({ ...prev, total: data.total_students }));
          setLecturerStats(prev => ({ ...prev, total: data.total_lecturers }));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();

    const statsInterval = setInterval(() => {
      setStudentStats(prev => {
        const diff = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const newOnline = Math.max(2, Math.min(12, prev.online + diff));
        return { ...prev, online: newOnline };
      });
      setLecturerStats(prev => {
        const diff = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const newOnline = Math.max(1, Math.min(4, prev.online + diff));
        return { ...prev, online: newOnline };
      });
    }, 8000);

    return () => {
      clearInterval(statsInterval);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search') || '';
    const tagsParam = params.get('tags') ? (params.get('tags') || '').split(',') : [];
    
    setSearchQuery(searchParam);
    setSelectedTags(tagsParam);
    setHomeCurrentPage(1);
    
    // Lưu vào localStorage để các trang khác đồng bộ
    localStorage.setItem('search_query', searchParam);
    localStorage.setItem('search_tags', JSON.stringify(tagsParam));
    
    fetchData({ tag: tagsParam.join(','), search: searchParam });
  }, [location.search]);

  useEffect(() => {
    if (activeTab === 'lecturers') {
      fetchLecturers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!posts || posts.length === 0) return;
    
    const interval = setInterval(() => {
      setHotTopicsPage(prev => {
        const nextPage = prev + 1;
        return nextPage > 3 ? 0 : nextPage;
      });
    }, 3000);
    
    return () => {
      clearInterval(interval);
    };
  }, [posts]);

  const handleCreatePost = async (values: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      showWarning('Vui lòng đăng nhập để tiếp tục');
      history.push('/auth');
      return;
    }

    setLoading(true);
    try {
      const tag_names = values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [];
      const url = editingPostId ? `${BASE_URL}/api/posts/${editingPostId}/` : `${BASE_URL}/api/posts/`;
      const method = editingPostId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
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
        showSuccess(editingPostId ? 'Cập nhật bài viết thành công!' : 'Đăng bài thành công! Câu hỏi của bạn đã được đăng công khai trên diễn đàn.');
        setIsModalOpen(false);
        setEditingPostId(null);
        form.resetFields();
        fetchData();
        fetchTags();
        fetchTotalPostsCount();
      } else {
        showError(editingPostId ? 'Có lỗi xảy ra khi cập nhật bài viết' : 'Có lỗi xảy ra khi đăng bài');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditPost = (post: Post) => {
    setEditingPostId(post.id);
    form.setFieldsValue({
      title: post.title,
      content: post.content,
      tags: post.tags.map(t => t.name).join(', ')
    });
    setIsModalOpen(true);
  };

  const handleDeletePost = (postId: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa bài viết',
      content: 'Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          showError('Phiên đăng nhập đã hết hạn');
          return;
        }
        try {
          const res = await fetch(`${BASE_URL}/api/posts/${postId}/`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            showSuccess('Xóa bài viết thành công!');
            fetchData();
            fetchTags();
            fetchTotalPostsCount();
          } else {
            showError('Không thể xóa bài viết này');
          }
        } catch (e) {
          console.error(e);
          showError('Lỗi kết nối server');
        }
      }
    });
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
      history.push({
        pathname: '/forum',
        search: `?search=&tags=${encodeURIComponent(lowerTagName)}`
      });
    } else {
      history.push({
        pathname: '/forum',
        search: ''
      });
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
    
    if (editorRef.current) {
      editorRef.current.blur();
    }
    
    setEditorEmpty(checkIsEditorEmpty());
    
    history.push({
      pathname: '/forum',
      search: `?search=${encodeURIComponent(keywords)}&tags=${encodeURIComponent(tags.join(','))}`
    });
  };



  const handleOrderingChange = (newOrdering: string) => {
    setOrdering(newOrdering);
    setHomeCurrentPage(1);
    fetchData({ ordering: newOrdering });
  };

  const toggleUnanswered = () => {
    const newVal = !unanswered;
    setUnanswered(newVal);
    setHomeCurrentPage(1);
    fetchData({ unanswered: newVal });
  };

  const userMenuItems: MenuProps['items'] = [
    ...(user?.role === 'ADMIN' ? [{ key: 'admin', icon: <SettingOutlined />, label: 'Trang quản trị', onClick: () => history.push('/admin') }] : []),
    { key: 'profile', icon: <UserOutlined />, label: 'Tài khoản', onClick: () => history.push('/forum/profile') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout },
  ];



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

        <Layout style={{ marginTop: 56, maxWidth: 1264, margin: '56px auto 0', width: '100%', background: '#fff' }}>
          <ForumSider 
            activeTab={activeTab} 
            onChangeTab={(key) => {
              if (key === 'home') {
                filterByTag(null);
                fetchData({ tag: undefined, search: '' });
              }
              setActiveTab(key);
            }} 
          />

          <Content style={{ padding: '24px', marginLeft: 210, minHeight: 280, background: '#fff' }}>
            {activeTab === 'home' && (
              <>
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

                {!fullSearchText && !selectedTags.length && posts.length > 0 && (
                  (() => {
                    const sortedHotPosts = posts
                      .filter(Boolean)
                      .slice()
                      .sort((a: any, b: any) => ((b.score || 0) - (a.score || 0)) || ((b.view_count || 0) - (a.view_count || 0)));
                    return (
                      <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#2c3e50' }}>
                            Chủ đề đang thảo luận sôi nổi
                          </Title>
                          <Space>
                            <Button 
                              icon={<LeftOutlined />} 
                              shape="circle" 
                              size="small" 
                              onClick={() => setHotTopicsPage(p => p === 0 ? 3 : p - 1)} 
                              style={{ borderColor: '#e3e6e8' }}
                            />
                            <Button 
                              icon={<RightOutlined />} 
                              shape="circle" 
                              size="small" 
                              onClick={() => setHotTopicsPage(p => p === 3 ? 0 : p + 1)} 
                              style={{ borderColor: '#e3e6e8' }}
                            />
                          </Space>
                        </div>
                        
                        <div style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            display: 'flex',
                            width: '400%',
                            transform: `translateX(-${hotTopicsPage * 25}%)`,
                            transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                          }}>
                            {[0, 1, 2, 3].map(pageIdx => {
                              const pagePosts = sortedHotPosts.slice(pageIdx * 3, (pageIdx + 1) * 3);
                              return (
                                <div key={pageIdx} style={{ width: '25%', padding: '0 4px' }}>
                                  <Row gutter={[16, 16]}>
                                    {pagePosts.map((hotPost: any) => (
                                      <Col xs={24} sm={8} key={hotPost.id}>
                                        <Card
                                          onClick={() => history.push(`/forum/post/${hotPost.id}`)}
                                          bodyStyle={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
                                          style={{ 
                                            height: '170px', 
                                            borderRadius: '8px', 
                                            border: '1px solid #e3e6e8',
                                            cursor: 'pointer',
                                            backgroundColor: '#fff',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                          }}
                                        >
                                          <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                              <div style={{ display: 'flex', gap: '4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1, marginRight: '12px' }}>
                                                {(hotPost.tags || []).slice(0, 2).map((t: any) => (
                                                  <Tag 
                                                    key={t.id} 
                                                    style={{ 
                                                      backgroundColor: '#e1ecf4', 
                                                      color: '#39739d', 
                                                      border: 'none', 
                                                      margin: 0,
                                                      fontSize: '10px',
                                                      padding: '0 4px',
                                                      borderRadius: '3px'
                                                    }}
                                                  >
                                                    {t.name}
                                                  </Tag>
                                                ))}
                                              </div>
                                              <Space size={12} style={{ color: '#8c8c8c', fontSize: '12px', flexShrink: 0, marginLeft: 'auto' }}>
                                                <span><MessageOutlined /> {hotPost.comment_count || 0}</span>
                                                <span><FireOutlined /> {hotPost.score || 0}</span>
                                              </Space>
                                            </div>
                                            <Title level={5} ellipsis={{ rows: 1 }} style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0074cc', lineHeight: '1.4' }}>
                                              {hotPost.title}
                                            </Title>
                                            <Paragraph style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#718096', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                              {getSnippet(hotPost.content)}
                                            </Paragraph>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px', justifyContent: 'space-between' }}>
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
                                                title={hotPost.author_name || hotPost.author}
                                              >
                                                {hotPost.author_name || hotPost.author}
                                              </Text>
                                            </Text>
                                            <span style={{ fontSize: '11px', color: '#a0aec0' }}>{moment(hotPost.created_at).fromNow()}</span>
                                          </div>
                                        </Card>
                                      </Col>
                                    ))}
                                    {pagePosts.length < 3 && Array.from({ length: 3 - pagePosts.length }).map((_, i) => (
                                      <Col xs={24} sm={8} key={`empty-${i}`}>
                                        <div style={{ height: '170px' }} />
                                      </Col>
                                    ))}
                                  </Row>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()
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
                    {posts.slice((homeCurrentPage - 1) * 15, homeCurrentPage * 15).map(post => <PostItem key={post.id} post={post} />)}
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
            )}

            {activeTab === 'tags' && (
              <div>
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={2} style={{ margin: 0, fontWeight: 400 }}>Thẻ phổ biến</Title>
                  <Input
                    placeholder="Tìm kiếm thẻ..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    style={{ width: 250 }}
                    onChange={e => { setTagSearch(e.target.value); setTagsCurrentPage(1); }}
                  />
                </div>
                <Paragraph style={{ color: '#525960', fontSize: 15, marginBottom: 24 }}>
                  Thẻ là một danh mục giúp nhóm các câu hỏi có cùng chủ đề lại với nhau. Hãy click vào một thẻ để xem các câu hỏi liên quan.
                </Paragraph>
                {(() => {
                  const filtered = tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()));
                  const paginated = filtered.slice((tagsCurrentPage - 1) * 20, tagsCurrentPage * 20);
                  return (
                    <>
                      <Row gutter={[16, 16]}>
                        {paginated.map(t => (
                          <Col span={8} key={t.id}>
                            <Card
                              style={{ borderColor: '#e3e6e8', borderRadius: 6, cursor: 'pointer' }}
                              bodyStyle={{ padding: '16px' }}
                              onClick={() => {
                                filterByTag(t.slug);
                                setActiveTab('home');
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Tag color="#e1ecf4" style={{ border: 'none', color: '#39739d', fontWeight: 600, fontSize: 14, padding: '2px 8px', margin: 0 }}>
                                  {t.name}
                                </Tag>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                  {t.post_count} bài viết
                                </Text>
                              </div>
                            </Card>
                          </Col>
                        ))}
                        {filtered.length === 0 && (
                          <Col span={24}>
                            <Empty description="Không tìm thấy thẻ nào khớp với từ khóa tìm kiếm" />
                          </Col>
                        )}
                      </Row>
                      {filtered.length > 0 && (
                        <Pagination
                          current={tagsCurrentPage}
                          onChange={setTagsCurrentPage}
                          pageSize={20}
                          total={filtered.length}
                          showSizeChanger={false}
                          style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}
                        />
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {activeTab === 'lecturers' && (
              <div>
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={2} style={{ margin: 0, fontWeight: 400 }}>Đội ngũ Giảng viên</Title>
                  <Input
                    placeholder="Tìm kiếm giảng viên, chuyên ngành..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    style={{ width: 280 }}
                    onChange={e => { setLecturerSearch(e.target.value); setLecturersCurrentPage(1); }}
                  />
                </div>
                <Paragraph style={{ color: '#525960', fontSize: 15, marginBottom: 24 }}>
                  Danh sách các Thầy/Cô cố vấn chuyên môn đã được EduForum xác thực tài khoản. Giảng viên luôn sẵn sàng giải đáp các câu hỏi học thuật từ sinh viên.
                </Paragraph>
                {lecturersLoading ? (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <Spin size="large" tip="Đang tải danh sách giảng viên..." />
                  </div>
                ) : (
                  (() => {
                    const filtered = lecturers.filter(l => 
                      (l.full_name || l.username).toLowerCase().includes(lecturerSearch.toLowerCase()) ||
                      (l.major || '').toLowerCase().includes(lecturerSearch.toLowerCase()) ||
                      (l.university || '').toLowerCase().includes(lecturerSearch.toLowerCase())
                    );
                    const paginated = filtered.slice((lecturersCurrentPage - 1) * 9, lecturersCurrentPage * 9);
                    return (
                      <>
                        <Row gutter={[20, 20]}>
                          {paginated.map(l => (
                            <Col span={8} key={l.id}>
                              <Card
                                hoverable
                                style={{ 
                                  borderColor: '#e3e6e8', 
                                  borderRadius: 8, 
                                  height: '100%', 
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                  textAlign: 'center'
                                }}
                                bodyStyle={{ padding: '24px 16px' }}
                              >
                                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                                  <Avatar 
                                    size={80} 
                                    src={l.avatar} 
                                    icon={<UserOutlined />} 
                                    style={{ border: '3px solid #f48024', boxShadow: '0 2px 8px rgba(244,128,36,0.2)' }}
                                  />
                                  <CheckCircleFilled 
                                    style={{ 
                                      color: '#52c41a', 
                                      fontSize: 20, 
                                      position: 'absolute', 
                                      bottom: 2, 
                                      right: 2, 
                                      backgroundColor: '#fff', 
                                      borderRadius: '50%',
                                      padding: 1
                                    }} 
                                  />
                                </div>
                                <Title level={4} style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600 }}>
                                  {l.full_name || l.username}
                                </Title>
                                <Tag color="processing" style={{ marginBottom: 12, borderRadius: 4 }}>
                                  Giảng viên xác thực
                                </Tag>
                                <Divider style={{ margin: '12px 0' }} />
                                <div style={{ textAlign: 'left', marginBottom: 16 }}>
                                  <Paragraph style={{ margin: '0 0 6px 0', fontSize: 13 }}>
                                    🏫 <Text strong>Trường:</Text> <span style={{ textTransform: 'capitalize' }}>{l.university || 'N/A'}</span>
                                  </Paragraph>
                                  <Paragraph style={{ margin: '0 0 6px 0', fontSize: 13 }}>
                                    📖 <Text strong>Chuyên ngành:</Text> <span style={{ textTransform: 'capitalize' }}>{l.major || 'Chung'}</span>
                                  </Paragraph>
                                  <Paragraph style={{ margin: '0 0 6px 0', fontSize: 13 }}>
                                    💬 <Text strong>Lượt hỗ trợ:</Text> <Text type="warning" strong>{l.total_answers || 0} câu trả lời</Text>
                                  </Paragraph>
                                </div>
                                <Button 
                                  type="primary" 
                                  ghost 
                                  style={{ width: '100%', borderRadius: 4, borderColor: '#f48024', color: '#f48024' }}
                                  onClick={() => {
                                    setIsModalOpen(true);
                                    form.setFieldsValue({
                                      title: `[Hỏi Thầy/Cô ${l.full_name || l.username}] `,
                                    });
                                  }}
                                >
                                  Đặt câu hỏi trực tiếp
                                </Button>
                              </Card>
                            </Col>
                          ))}
                          {filtered.length === 0 && (
                            <Col span={24}>
                              <Empty description="Không tìm thấy giảng viên nào phù hợp" />
                            </Col>
                          )}
                        </Row>
                        {filtered.length > 0 && (
                          <Pagination
                            current={lecturersCurrentPage}
                            onChange={setLecturersCurrentPage}
                            pageSize={9}
                            total={filtered.length}
                            showSizeChanger={false}
                            style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}
                          />
                        )}
                      </>
                    );
                  })()
                )}
              </div>
            )}

            {activeTab === 'my-questions' && (
              <div>
                {!user ? (
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
                ) : (
                  <>
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
                      (() => {
                        const filtered = posts.filter(post => post.author_username === user.username);
                        const paginated = filtered.slice((myQuestionsCurrentPage - 1) * 15, myQuestionsCurrentPage * 15);
                        return (
                          <>
                            {paginated.map(post => <PostItem key={post.id} post={post} isMyQuestionsTab={true} />)}
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
                        );
                      })()
                    )}
                  </>
                )}
              </div>
            )}
          </Content>

          {(activeTab === 'home' || activeTab === 'my-questions') && (
            <SidebarWidgets
              tags={tags}
              totalPostsCount={totalPostsCount}
              studentStats={studentStats}
              lecturerStats={lecturerStats}
              filterByTag={filterByTag}
              setActiveTab={setActiveTab}
            />
          )}
        </Layout>

        <CreatePostModal
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingPostId(null);
            form.resetFields();
          }}
          onFinish={handleCreatePost}
          editingPostId={editingPostId}
          form={form}
          loading={loading}
        />
      </Layout>
    </ConfigProvider>
  );
};

export default ForumPage;
