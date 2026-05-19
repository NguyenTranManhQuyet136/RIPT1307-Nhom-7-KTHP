import React, { useState, useEffect, useRef } from 'react';
import { Layout, Form, notification, ConfigProvider, theme } from 'antd';
import { history, useLocation } from 'umi';
import moment from 'moment';
import 'moment/locale/vi';
import { ForumHeader } from './components/shared/ForumHeader';
import { ForumSider } from './components/shared/ForumSider';
import { PostItem } from './components/feed/PostItem';
import { CreatePostModal } from './components/feed/CreatePostModal';
import { SidebarWidgets } from './components/feed/SidebarWidgets';

// Import Types
import { TagType, Post } from './types';

// Import Components
import ForumHeader from './components/ForumHeader';
import ForumSidebar from './components/ForumSidebar';
import RightSidebar from './components/RightSidebar';
import CreatePostModal from './components/CreatePostModal';
import CustomToast from './components/CustomToast';

// Import Tabs
import HomeTab from './components/tabs/HomeTab';
import TagsTab from './components/tabs/TagsTab';
import LecturersTab from './components/tabs/LecturersTab';
import MyQuestionsTab from './components/tabs/MyQuestionsTab';

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

const { Content } = Layout;

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
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [editorEmpty, setEditorEmpty] = useState(true);
  const [fullSearchText, setFullSearchText] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notificationLimit, setNotificationLimit] = useState<number>(10);
  const notifiedIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoadRef = useRef(true);
  const [activeTab, setActiveTab] = useState('home');
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [lecturersLoading, setLecturersLoading] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [activeToast, setActiveToast] = useState<{ id: any; type: string; message: string; target_post_id?: any; actor_name?: string; actor_avatar?: string } | null>(null);

  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [studentStats, setStudentStats] = useState({ total: 120, online: 0 });
  const [lecturerStats, setLecturerStats] = useState({ total: 8, online: 0 });

  const [homeCurrentPage, setHomeCurrentPage] = useState(1);
  const [hotTopicsPage, setHotTopicsPage] = useState(0);
  const [tagsCurrentPage, setTagsCurrentPage] = useState(1);
  const [lecturersCurrentPage, setLecturersCurrentPage] = useState(1);
  const [myQuestionsCurrentPage, setMyQuestionsCurrentPage] = useState(1);

  const BASE_URL = 'http://localhost:8002';

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
    setActiveToast({ id: Date.now(), type: 'SUCCESS', message: msg });
  };

  const showError = (msg: string) => {
    setActiveToast({ id: Date.now(), type: 'ERROR', message: msg });
  };

  const showWarning = (msg: string) => {
    setActiveToast({ id: Date.now(), type: 'WARNING', message: msg });
  };

  const fetchData = async (params: { tag?: string; search?: string; ordering?: string; unanswered?: boolean } = {}) => {
    setLoading(true);
    try {
      const { 
        tag: tagsFromParam, 
        search: searchFromParam, 
        ordering: ord = ordering, 
        unanswered: unans = unanswered 
      } = params;

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
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      fetchNotifications();
      interval = setInterval(fetchNotifications, 10000);
    }
    fetchTags();
    fetchTotalPostsCount();

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



    return () => {
      if (interval) clearInterval(interval);
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
      tags: post.tags.map((t: any) => t.name).join(', ')
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
        <ForumHeader
          user={user}
          unreadCount={unreadCount}
          notifications={notifications}
          notificationLimit={notificationLimit}
          setNotificationLimit={setNotificationLimit}
          handleReadNotification={handleReadNotification}
          handleMarkAllAsRead={handleMarkAllAsRead}
          handleLogout={handleLogout}
          filterByTag={filterByTag}
          executeSearch={executeSearch}
          editorRef={editorRef}
          editorEmpty={editorEmpty}
          setEditorEmpty={setEditorEmpty}
          isFocused={isFocused}
          setIsFocused={setIsFocused}
          handleEditorInput={handleEditorInput}
          handleEditorKeyDown={handleEditorKeyDown}
          BASE_URL={BASE_URL}
        />

        <Layout style={{ marginTop: 56, maxWidth: 1264, margin: '56px auto 0', width: '100%', background: '#fff' }}>
          <ForumSidebar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filterByTag={filterByTag}
            fetchData={fetchData}
          />

          <Content style={{ padding: '24px', marginLeft: 210, minHeight: 280, background: '#fff' }}>
            {activeTab === 'home' && (
              <HomeTab
                posts={posts}
                loading={loading}
                fullSearchText={fullSearchText}
                selectedTags={selectedTags}
                ordering={ordering}
                unanswered={unanswered}
                handleOrderingChange={handleOrderingChange}
                toggleUnanswered={toggleUnanswered}
                homeCurrentPage={homeCurrentPage}
                setHomeCurrentPage={setHomeCurrentPage}
                setIsModalOpen={setIsModalOpen}
                filterByTag={filterByTag}
              />
            )}
            {activeTab === 'tags' && (
              <TagsTab
                tags={tags}
                tagSearch={tagSearch}
                setTagSearch={setTagSearch}
                tagsCurrentPage={tagsCurrentPage}
                setTagsCurrentPage={setTagsCurrentPage}
                filterByTag={filterByTag}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === 'lecturers' && (
              <LecturersTab
                lecturers={lecturers}
                lecturerSearch={lecturerSearch}
                setLecturerSearch={setLecturerSearch}
                lecturersCurrentPage={lecturersCurrentPage}
                setLecturersCurrentPage={setLecturersCurrentPage}
                lecturersLoading={lecturersLoading}
                setIsModalOpen={setIsModalOpen}
                form={form}
              />
            )}
            {activeTab === 'my-questions' && (
              <MyQuestionsTab
                user={user}
                posts={posts}
                loading={loading}
                myQuestionsCurrentPage={myQuestionsCurrentPage}
                setMyQuestionsCurrentPage={setMyQuestionsCurrentPage}
                setIsModalOpen={setIsModalOpen}
                filterByTag={filterByTag}
                handleStartEditPost={handleStartEditPost}
                handleDeletePost={handleDeletePost}
              />
            )}
          </Content>

          {(activeTab === 'home' || activeTab === 'my-questions') && (
            <RightSidebar
              tags={tags}
              filterByTag={filterByTag}
              setActiveTab={setActiveTab}
              totalPostsCount={totalPostsCount}
              studentStats={studentStats}
              lecturerStats={lecturerStats}
            />
          )}
        </Layout>

        <CreatePostModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          editingPostId={editingPostId}
          setEditingPostId={setEditingPostId}
          form={form}
          handleCreatePost={handleCreatePost}
          loading={loading}
        />

        <CustomToast
          activeToast={activeToast}
          setActiveToast={setActiveToast}
          handleReadNotification={handleReadNotification}
          user={user}
          BASE_URL={BASE_URL}
        />
      </Layout>
    </ConfigProvider>
  );
};

export default ForumPage;
