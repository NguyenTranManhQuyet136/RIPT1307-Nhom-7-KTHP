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
  MessageOutlined
} from '@ant-design/icons';
import { history, useLocation } from 'umi';
import moment from 'moment';
import 'moment/locale/vi';

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
  created_at: string;
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

  const triggerRealtimeToast = (item: any) => {
    setActiveToast({
      id: item.id,
      type: item.notification_type,
      message: item.message,
      target_post_id: item.target_post_id,
      actor_name: item.actor_name,
      actor_avatar: item.actor_avatar
    });
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

        // Phát hiện và hiển thị Toast kiểu Facebook cho thông báo mới
        data.forEach((item: any) => {
          if (!item.is_read && !notifiedIdsRef.current.has(item.id)) {
            notifiedIdsRef.current.add(item.id);
            if (!isFirstLoadRef.current) {
              triggerRealtimeToast(item);
            }
          }
        });

        if (isFirstLoadRef.current) {
          data.forEach((item: any) => {
            if (!item.is_read) {
              notifiedIdsRef.current.add(item.id);
            }
          });
          isFirstLoadRef.current = false;
        }
      }
    } catch (e) {
      console.error('Lỗi tải thông báo', e);
    }
  };

  const handleReadNotification = async (notificationItem: any) => {
    if (!notificationItem.is_read) {
      const token = localStorage.getItem('access_token');
      try {
        await fetch(`${BASE_URL}/api/notifications/${notificationItem.id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ is_read: true })
        });
        setNotifications(prev => 
          prev.map(n => n.id === notificationItem.id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(c => Math.max(0, c - 1));
      } catch (e) {
        console.error(e);
      }
    }
    
    // Tự động đóng toast nếu có
    notification.destroy(notificationItem.id);

    if (notificationItem.target_post_id) {
      history.push(`/forum/post/${notificationItem.target_post_id}`);
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
        // Tắt tất cả các toasts đang hiển thị
        notifications.forEach(n => {
          notification.destroy(n.id);
        });
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        showSuccess('Đã đánh dấu tất cả thông báo là đã đọc');
      }
    } catch (e) {
      console.error(e);
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
    let interval: any;
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      fetchNotifications();
      
      // Kiểm tra thông báo mới mỗi 10 giây
      interval = setInterval(fetchNotifications, 10000);
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
      if (interval) clearInterval(interval);
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
    
    const fullText = tagsParam.map(t => `#${t}`).join(' ') + (tagsParam.length > 0 && searchParam ? ' ' : '') + searchParam;
    setFullSearchText(fullText);
    
    // Lưu vào localStorage để các trang khác đồng bộ
    localStorage.setItem('search_query', searchParam);
    localStorage.setItem('search_tags', JSON.stringify(tagsParam));
    
    fetchData({ tag: tagsParam.join(','), search: searchParam });
    
    if (editorRef.current) {
      setEditorTagsAndText(tagsParam, searchParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  useEffect(() => {
    if (activeTab === 'lecturers') {
      fetchLecturers();
    }
  }, [activeTab]);

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

  const PostItem = ({ post, isMyQuestionsTab }: { post: Post; isMyQuestionsTab?: boolean }) => (
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

  const notificationContent = (
    <div style={{ width: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
        <Text strong style={{ fontSize: 16 }}>Thông báo</Text>
        {unreadCount > 0 && (
          <a onClick={handleMarkAllAsRead} className="notification-action-link">
            Đánh dấu tất cả đã đọc
          </a>
        )}
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifications.length > 0 ? (
          <>
            <List
              itemLayout="horizontal"
              dataSource={notifications.slice(0, notificationLimit)}
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
                  {item.actor_avatar ? (
                    <Avatar 
                      src={item.actor_avatar.startsWith('http') ? item.actor_avatar : `${BASE_URL}${item.actor_avatar}`} 
                      style={{ flexShrink: 0 }} 
                    />
                  ) : (
                    <Avatar 
                      style={{ backgroundColor: item.notification_type === 'WELCOME' ? '#f48024' : '#0074cc', flexShrink: 0 }}
                      icon={<UserOutlined />}
                    />
                  )}
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
            {notifications.length > notificationLimit && (
              <div style={{ textAlign: 'center', padding: '4px 0', borderTop: '1px solid #f0f0f0', marginTop: 4 }}>
                <Button 
                  type="text" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotificationLimit(prev => prev + 10);
                  }}
                  className="notification-more-btn"
                >
                  Xem thêm
                </Button>
              </div>
            )}
          </>
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
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1264, margin: '0 auto' }}>
            <div 
              style={{ fontSize: 22, fontWeight: 800, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', width: 164 }}
              onClick={() => { filterByTag(null); history.push('/forum'); }}
            >
              <img src="/favicon.png" alt="EduForum Logo" style={{ height: 28, marginRight: 8, objectFit: 'contain' }} />
              <span>edu<Text strong style={{ color: '#f48024' }}>forum</Text></span>
            </div>

            <div style={{ flex: 1, padding: '0 24px 0 0', margin: '0 0 0 46px', display: 'flex', alignItems: 'center', maxWidth: 800 }}>
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
              .notification-action-link {
                color: #f48024 !important;
                font-size: 13px;
                transition: color 0.2s;
              }
              .notification-action-link:hover {
                color: #e06d0f !important;
              }
              .notification-more-btn {
                color: #f48024 !important;
                font-weight: 500;
                font-size: 13px;
                width: 100%;
                padding: 4px 0;
                transition: all 0.2s;
              }
              .notification-more-btn:hover {
                color: #e06d0f !important;
                background-color: #fdf6f0 !important;
              }
              .ant-popover, .ant-popover-content, .ant-dropdown, .ant-dropdown-menu {
                transition: none !important;
                animation: none !important;
              }
              .online-dot-pulse {
                display: inline-block;
                width: 6px;
                height: 6px;
                background-color: #52c41a;
                border-radius: 50%;
                margin-right: 6px;
                box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7);
                animation: pulse 1.6s infinite;
                vertical-align: middle;
              }
              @keyframes pulse {
                0% {
                  transform: scale(0.95);
                  box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7);
                }
                70% {
                  transform: scale(1);
                  box-shadow: 0 0 0 5px rgba(82, 196, 26, 0);
                }
                100% {
                  transform: scale(0.95);
                  box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
                }
              }
              .post-item-card:hover {
                background-color: #fafbfc;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.02);
              }
              .post-title-link:hover {
                text-decoration: underline !important;
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
                  placement="bottom"
                  overlayClassName="notification-popover"
                  transitionName=""
                  motion={{ motionName: '' }}
                  getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                >
                  <Badge count={unreadCount} size="small" overflowCount={99}>
                    <Button type="text" icon={<BellOutlined style={{ fontSize: 20, color: '#525960' }} />} />
                  </Badge>
                </Popover>
                  <Dropdown 
                    menu={{ items: userMenuItems }} 
                    placement="bottom" 
                    arrow 
                    trigger={['click']}
                    transitionName=""
                    motion={{ motionName: '' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                      {user && user.avatar ? (
                        <Avatar 
                          src={user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`} 
                          style={{ border: '1px solid #e3e6e8' }} 
                        />
                      ) : user && user.username ? (
                        <Avatar 
                          style={{ backgroundColor: '#f48024', fontWeight: 700, fontSize: 18 }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                      ) : (
                        <Avatar 
                          style={{ backgroundColor: '#f48024' }} 
                          icon={<UserOutlined />} 
                        />
                      )}
                      <span 
                        style={{ 
                          fontWeight: 500, 
                          color: '#3c4146', 
                          fontSize: 14,
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                          verticalAlign: 'middle'
                        }}
                        title={user?.full_name || user?.username}
                      >
                        {user?.full_name || user?.username}
                      </span>
                    </div>
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
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                      <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#2c3e50' }}>
                        Chủ đề đang thảo luận sôi nổi
                      </Title>
                    </div>
                    <Row gutter={[16, 16]}>
                      {posts
                        .slice()
                        .sort((a, b) => b.score - a.score || b.view_count - a.view_count)
                        .slice(0, 3)
                        .map((hotPost, index) => (
                          <Col xs={24} sm={8} key={hotPost.id}>
                            <Card
                              hoverable
                              onClick={() => history.push(`/forum/post/${hotPost.id}`)}
                              bodyStyle={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
                              style={{ 
                                height: '160px', 
                                borderRadius: '8px', 
                                border: '1px solid #e3e6e8',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <Tag color={index === 0 ? "volcano" : index === 1 ? "orange" : "gold"} style={{ fontWeight: 600, borderRadius: '4px' }}>
                                    Top {index + 1} Hot
                                  </Tag>
                                  <Space size={12} style={{ color: '#8c8c8c', fontSize: '12px' }}>
                                    <span><MessageOutlined /> {hotPost.comment_count || 0}</span>
                                    <span><FireOutlined /> {hotPost.score || 0}</span>
                                  </Space>
                                </div>
                                <Title level={5} ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#2d3748', lineHeight: '1.4' }}>
                                  {hotPost.title}
                                </Title>
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
                    </Row>
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
                  <Button type="link" style={{ padding: 0 }} onClick={() => setActiveTab('tags')}>Xem tất cả thẻ</Button>
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
                        {studentStats.online} online
                      </Text>
                    </span>
                  </List.Item>
                  <List.Item style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', border: 'none' }}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>Giảng viên:</Text> 
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Text strong style={{ color: '#2c3e50', fontSize: '14px' }}>{lecturerStats.total}</Text> 
                      <Text type="success" style={{ fontSize: '12px', marginLeft: 8, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }}>
                        <span className="online-dot-pulse"></span>
                        {lecturerStats.online} online
                      </Text>
                    </span>
                  </List.Item>
                </List>
              </Card>
            </Sider>
          )}
        </Layout>

        <Modal
          title={<Title level={3} style={{ margin: 0 }}>{editingPostId ? 'Chỉnh sửa câu hỏi' : 'Đặt câu hỏi cho cộng đồng'}</Title>}
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingPostId(null);
            form.resetFields();
          }}
          footer={null}
          width={800}
          centered
        >
          <Paragraph type="secondary">
            {editingPostId 
              ? 'Cập nhật lại các thông tin cần thiết cho câu hỏi của bạn.' 
              : 'Hãy mô tả chi tiết vấn đề của bạn. Một câu hỏi tốt sẽ nhận được câu trả lời nhanh và chính xác hơn.'}
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
                <Button onClick={() => {
                  setIsModalOpen(false);
                  setEditingPostId(null);
                  form.resetFields();
                }}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" size="large" loading={loading}>
                  {editingPostId ? 'Cập nhật' : 'Đăng câu hỏi'}
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>
        {activeToast && (
          <div 
            onClick={() => {
              if (activeToast.type === 'SUCCESS' || activeToast.type === 'ERROR' || activeToast.type === 'WARNING') {
                setActiveToast(null);
              } else {
                handleReadNotification(activeToast);
                setActiveToast(null);
              }
            }}
            style={{
              position: 'fixed',
              bottom: 16,
              left: 16,
              width: 300,
              background: '#fff',
              borderRadius: 0,
              border: '1px solid #e3e6e8',
              padding: '14px 18px',
              cursor: 'pointer',
              zIndex: 9999,
              display: 'flex',
              gap: 12,
              alignItems: 'center'
            }}
          >
            {activeToast.actor_avatar ? (
              <Avatar 
                size={42} 
                src={activeToast.actor_avatar.startsWith('http') ? activeToast.actor_avatar : `${BASE_URL}${activeToast.actor_avatar}`} 
                style={{ flexShrink: 0 }} 
              />
            ) : activeToast.type === 'WELCOME' ? (
              <Avatar size={42} style={{ backgroundColor: '#f48024', flexShrink: 0 }} icon={<UserOutlined />} />
            ) : (activeToast.type === 'REPLY_POST' || activeToast.type === 'REPLY_COMMENT' || activeToast.type === 'NEW_POST') ? (
              activeToast.actor_name ? (
                <Avatar size={42} style={{ backgroundColor: '#0074cc', flexShrink: 0, fontWeight: 700, fontSize: 18 }}>
                  {activeToast.actor_name.charAt(0).toUpperCase()}
                </Avatar>
              ) : (
                <Avatar size={42} style={{ backgroundColor: '#0074cc', flexShrink: 0 }} icon={<UserOutlined />} />
              )
            ) : user && user.avatar ? (
              <Avatar size={42} src={user.avatar.startsWith('http') ? user.avatar : `${BASE_URL}${user.avatar}`} style={{ flexShrink: 0 }} />
            ) : user && user.username ? (
              <Avatar size={42} style={{ backgroundColor: '#f48024', flexShrink: 0, fontWeight: 700, fontSize: 18 }}>
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
            ) : (
              <Avatar size={42} style={{ backgroundColor: '#f48024', flexShrink: 0 }} icon={<UserOutlined />} />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 700, 
                color: activeToast.type === 'SUCCESS' ? '#5eba7d' : 
                       activeToast.type === 'ERROR' ? '#d12d2d' : '#f48024',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: 2
              }}>
                {activeToast.type === 'SUCCESS' ? 'Thành công' :
                 activeToast.type === 'ERROR' ? 'Thất bại' :
                 activeToast.type === 'WARNING' ? 'Cảnh báo' : 'Thông báo'}
              </div>
              <div style={{ 
                fontSize: 12.5, 
                color: '#232629', 
                lineHeight: 1.4, 
                display: '-webkit-box', 
                WebkitLineClamp: 3, 
                WebkitBoxOrient: 'vertical', 
                overflow: 'hidden' 
              }}>
                {activeToast.message}
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ConfigProvider>
  );
};

export default ForumPage;
