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
  Form, 
  ConfigProvider, 
  theme,
  Popover,
  Badge,
  Dropdown,
  Tabs,
  Upload,
  List,
  Empty
} from 'antd';
import type { MenuProps } from 'antd';
import { 
  GlobalOutlined, 
  QuestionCircleOutlined, 
  TagsOutlined, 
  UserOutlined, 
  LogoutOutlined, 
  BellOutlined, 
  SettingOutlined, 
  CheckCircleFilled, 
  CheckOutlined, 
  CameraOutlined,
  MailOutlined,
  BankOutlined,
  ReadOutlined,
  LockOutlined,
  FireOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { history } from 'umi';
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

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<any>(null);

  // States cho hệ thống thông báo
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notificationLimit, setNotificationLimit] = useState<number>(10);
  const notifiedIdsRef = React.useRef<Set<number>>(new Set());
  const isFirstLoadRef = React.useRef(true);
  const [activeToast, setActiveToast] = useState<{ id: any; type: string; message: string; target_post_id?: any } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [editorEmpty, setEditorEmpty] = useState(true);

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
    return { tags: Array.from(new Set(tags)), keywords };
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
    
    // Save to localStorage
    localStorage.setItem('search_query', keywords);
    localStorage.setItem('search_tags', JSON.stringify(tags));

    history.push({
      pathname: '/forum',
      search: `?search=${encodeURIComponent(keywords)}&tags=${encodeURIComponent(tags.join(','))}`
    });
  };

  // Forms
  const [infoForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const BASE_URL = 'http://localhost:8002';

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

  // Tải dữ liệu ban đầu
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      history.push('/auth');
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    
    // Gán dữ liệu form
    infoForm.setFieldsValue({
      full_name: parsedUser.full_name,
      university: parsedUser.university,
      major: parsedUser.major
    });

    emailForm.setFieldsValue({
      email: parsedUser.email,
      email_confirm: parsedUser.email
    });

    if (parsedUser.avatar) {
      // Đảm bảo đường dẫn ảnh tuyệt đối
      const avatarUrl = parsedUser.avatar.startsWith('http') 
        ? parsedUser.avatar 
        : `${BASE_URL}${parsedUser.avatar}`;
      setAvatarPreview(avatarUrl);
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);

    // Đồng bộ ô tìm kiếm từ localStorage
    const savedSearch = localStorage.getItem('search_query') || '';
    const savedTags = JSON.parse(localStorage.getItem('search_tags') || '[]');
    setSearchQuery(savedSearch);
    setSelectedTags(savedTags);
    if (editorRef.current) {
      setEditorTagsAndText(savedTags, savedSearch);
    }

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

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

        // Phát hiện và hiển thị Toast cho thông báo mới thời gian thực
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

  const handleReadNotification = async (notificationItem: any) => {
    if (!notificationItem.is_read) {
      const token = localStorage.getItem('access_token');
      try {
        await fetch(`${BASE_URL}/api/notifications/${notificationItem.id}/read/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchNotifications();
      } catch (e) {
        console.error('Lỗi đọc thông báo', e);
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    history.push('/auth');
  };

  const userMenuItems: MenuProps['items'] = [
    ...(user?.role === 'ADMIN' ? [{ key: 'admin', icon: <SettingOutlined />, label: 'Trang quản trị', onClick: () => history.push('/admin') }] : []),
    { key: 'profile', icon: <UserOutlined />, label: 'Tài khoản', onClick: () => history.push('/forum/profile') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout },
  ];

  // 1. Thay đổi preview avatar khi chọn ảnh mới, không upload ngay
  const handleAvatarChange = (file: File) => {
    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    showSuccess('Đã chọn ảnh đại diện mới. Bấm "Lưu thay đổi" để cập nhật!');
  };

  // 2. Cập nhật Họ và tên, trường, chuyên ngành + upload avatar nếu có thay đổi
  const onUpdateInfo = async (values: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('full_name', values.full_name || '');
    formData.append('university', values.university || '');
    formData.append('major', values.major || '');
    
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        
        // Cập nhật avatar preview từ server trả về để đồng bộ hóa
        if (data.user.avatar) {
          const avatarUrl = data.user.avatar.startsWith('http') 
            ? data.user.avatar 
            : `${BASE_URL}${data.user.avatar}`;
          setAvatarPreview(avatarUrl);
        }
        
        setAvatarFile(null); // Reset file đã lưu tạm
        showSuccess('Cập nhật thông tin hồ sơ thành công!');
      } else {
        showError(data.message || 'Lỗi cập nhật thông tin.');
      }
    } catch (err) {
      showError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Sửa email
  const onUpdateEmail = async (values: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('email', values.email);
    formData.append('email_confirm', values.email_confirm);

    try {
      const res = await fetch(`${BASE_URL}/api/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        showSuccess('Cập nhật địa chỉ Email thành công!');
      } else {
        // Trích xuất lỗi chi tiết
        if (data.errors && data.errors.email) {
          showError(Array.isArray(data.errors.email) ? data.errors.email[0] : data.errors.email);
        } else {
          showError(data.message || 'Lỗi cập nhật email.');
        }
      }
    } catch (err) {
      showError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Đổi mật khẩu
  const onUpdatePassword = async (values: any) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('password', values.password);
    formData.append('new_password', values.new_password);

    try {
      const res = await fetch(`${BASE_URL}/api/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        passwordForm.resetFields();
        showSuccess('Đổi mật khẩu thành công!');
      } else {
        if (data.errors) {
          if (data.errors.password) {
            showError(Array.isArray(data.errors.password) ? data.errors.password[0] : data.errors.password);
          } else if (data.errors.new_password) {
            showError(Array.isArray(data.errors.new_password) ? data.errors.new_password[0] : data.errors.new_password);
          } else {
            showError('Lỗi cập nhật mật khẩu.');
          }
        } else {
          showError(data.message || 'Lỗi mật khẩu hiện tại không chính xác.');
        }
      }
    } catch (err) {
      showError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const notificationContent = (
    <div style={{ width: 320 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 16 }}>Thông báo</Text>
        <Badge count={unreadCount} size="small" style={{ backgroundColor: '#f48024' }} />
      </div>
      <div style={{ maxHeight: 350, overflowY: 'auto' }}>
        {notifications.length > 0 ? (
          <>
            <List
              dataSource={notifications.slice(0, notificationLimit)}
              renderItem={(item: any) => (
                <List.Item 
                  onClick={() => {
                    handleReadNotification(item);
                    if (item.target_post_id) {
                      history.push(`/forum/post/${item.target_post_id}`);
                    }
                  }}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer',
                    backgroundColor: item.is_read ? '#fff' : '#fdf7e2',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                  className="notification-item"
                >
                  {item.actor_avatar ? (
                    <Avatar 
                      size={36}
                      src={item.actor_avatar.startsWith('http') ? item.actor_avatar : `${BASE_URL}${item.actor_avatar}`} 
                      style={{ flexShrink: 0 }} 
                    />
                  ) : (
                    <Avatar size={36} icon={<UserOutlined />} style={{ backgroundColor: '#f48024', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#232629', lineHeight: 1.3, marginBottom: 4 }}>
                      {item.message}
                    </div>
                    <div style={{ fontSize: 11, color: '#6a737c' }}>
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
        <style>{`
          .ant-popover, .ant-popover-content, .ant-dropdown, .ant-dropdown-menu {
            transition: none !important;
            animation: none !important;
          }
        `}</style>
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
              onClick={() => {
                localStorage.removeItem('search_query');
                localStorage.removeItem('search_tags');
                history.push('/forum');
              }}
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
              {user && (
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
                      {avatarPreview ? (
                        <Avatar 
                          src={avatarPreview} 
                          style={{ border: '1px solid #e3e6e8' }} 
                        />
                      ) : (
                        <Avatar 
                          style={{ backgroundColor: '#f48024' }} 
                          icon={<UserOutlined />} 
                        />
                      )}
                      <span style={{ fontWeight: 500, color: '#3c4146', fontSize: 14 }}>{user?.full_name || user?.username}</span>
                    </div>
                  </Dropdown>
                </>
              )}
            </Space>
          </div>
        </Header>

        <Layout style={{ marginTop: 56, maxWidth: 1264, margin: '56px auto 0', width: '100%', background: '#fff' }}>
          <Sider width={210} style={{ background: '#fff', borderRight: '1px solid #e3e6e8', position: 'fixed', height: 'calc(100vh - 56px)', left: 'auto' }}>
            <Menu
              mode="inline"
              selectedKeys={[]}
              style={{ height: '100%', borderRight: 0, paddingTop: 24 }}
              onClick={({ key }) => {
                history.push('/forum');
              }}
              items={[
                { key: 'home', icon: <GlobalOutlined />, label: 'Trang chủ' },
                { key: 'tags', icon: <TagsOutlined />, label: 'Thẻ phổ biến' },
                { key: 'lecturers', icon: <UserOutlined />, label: 'Đội ngũ giảng viên' },
                { key: 'my-questions', icon: <QuestionCircleOutlined />, label: 'Câu hỏi của tôi' },
              ]}
            />
          </Sider>

          <Content style={{ padding: '24px', marginLeft: 210, minHeight: 280, background: '#fff' }}>
            <Row gutter={24}>
              {/* Cột trái: Quản lý ảnh đại diện & Thông tin nhanh */}
              <Col xs={24} md={8}>
                <Card bordered style={{ textAlign: 'center', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 24 }}>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                    {avatarPreview ? (
                      <Avatar size={120} src={avatarPreview} style={{ border: '3px solid #e3e6e8' }} />
                    ) : (
                      <Avatar size={120} style={{ backgroundColor: '#f48024', border: '3px solid #e3e6e8' }} icon={<UserOutlined style={{ fontSize: 60 }} />} />
                    )}
                    
                    {/* Nút Upload tròn đè lên Avatar */}
                    <Upload
                      beforeUpload={(file) => {
                        handleAvatarChange(file);
                        return false;
                      }}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <Button 
                        type="primary" 
                        shape="circle" 
                        icon={<CameraOutlined />} 
                        style={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          right: 0, 
                          backgroundColor: '#f48024', 
                          borderColor: '#f48024',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }} 
                      />
                    </Upload>
                  </div>

                  <Title level={4} style={{ margin: '0 0 4px 0' }}>
                    {user?.full_name || user?.username}
                  </Title>
                  <Paragraph type="secondary" style={{ marginBottom: 12 }}>
                    @{user?.username}
                  </Paragraph>

                  <Space size={8} style={{ marginBottom: 8 }}>
                    {user?.role === 'LECTURER' ? (
                      user?.is_verified ? (
                        <Tag color="processing" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 12 }}>
                          <CheckCircleFilled style={{ color: '#52c41a' }} /> Giảng viên
                        </Tag>
                      ) : (
                        <Tag color="warning" style={{ padding: '4px 8px', fontSize: 12 }}>
                          Giảng viên (Chưa xác thực)
                        </Tag>
                      )
                    ) : user?.role === 'ADMIN' ? (
                      <Tag color="red" style={{ padding: '4px 8px', fontSize: 12 }}>
                        Admin
                      </Tag>
                    ) : (
                      <Tag color="cyan" style={{ padding: '4px 8px', fontSize: 12 }}>
                        Sinh viên
                      </Tag>
                    )}
                  </Space>

                  <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 16, paddingTop: 16, textAlign: 'left' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Trường đại học</Text>
                      <div><Text strong>{user?.university || 'Chưa cập nhật'}</Text></div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Ngành học / Ngành giảng dạy</Text>
                      <div><Text strong>{user?.major || 'Chưa cập nhật'}</Text></div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Cột phải: Các tabs cập nhật thông tin chi tiết */}
              <Col xs={24} md={16}>
                <Card bordered style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minHeight: 450 }}>
                  <Tabs 
                    defaultActiveKey="info"
                    size="large"
                    items={[
                      {
                        key: 'info',
                        label: 'Thông tin cá nhân',
                        children: (
                          <Form
                            form={infoForm}
                            layout="vertical"
                            onFinish={onUpdateInfo}
                            requiredMark={false}
                            style={{ marginTop: 16 }}
                          >
                            <Form.Item 
                              label={<Text strong>Họ và Tên</Text>} 
                              name="full_name" 
                              rules={[{ required: true, message: 'Họ tên không được để trống!' }]}
                            >
                              <Input prefix={<UserOutlined style={{ color: '#838c95' }} />} placeholder="Nguyễn Văn A" style={{ height: 38 }} />
                            </Form.Item>

                            <Form.Item 
                              label={<Text strong>Trường đại học</Text>} 
                              name="university"
                              rules={[{ required: true, message: 'Tên trường học không được để trống!' }]}
                            >
                              <Input prefix={<BankOutlined style={{ color: '#838c95' }} />} placeholder="Đại học Bách Khoa" style={{ height: 38 }} />
                            </Form.Item>

                            <Form.Item 
                              label={<Text strong>Ngành học / Bộ môn giảng dạy</Text>} 
                              name="major"
                              rules={[{ required: true, message: 'Ngành học không được để trống!' }]}
                            >
                              <Input prefix={<ReadOutlined style={{ color: '#838c95' }} />} placeholder="Khoa học Máy tính" style={{ height: 38 }} />
                            </Form.Item>

                            <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
                              <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={loading}
                                style={{ 
                                  backgroundColor: '#f48024', 
                                  borderColor: '#f48024', 
                                  height: 38,
                                  fontWeight: 500
                                }}
                              >
                                Lưu thay đổi
                              </Button>
                            </Form.Item>
                          </Form>
                        )
                      },
                      {
                        key: 'email',
                        label: 'Thay đổi Email',
                        children: (
                          <Form
                            form={emailForm}
                            layout="vertical"
                            onFinish={onUpdateEmail}
                            requiredMark={false}
                            style={{ marginTop: 16 }}
                          >
                            <Form.Item 
                              label={<Text strong>Email mới</Text>} 
                              name="email"
                              rules={[
                                { required: true, message: 'Nhập địa chỉ email!' },
                                { type: 'email', message: 'Vui lòng nhập email hợp lệ!' }
                              ]}
                              extra="Nhập email bạn muốn đổi sang."
                            >
                              <Input prefix={<MailOutlined style={{ color: '#838c95' }} />} placeholder="new-email@example.com" style={{ height: 38 }} />
                            </Form.Item>

                            <Form.Item 
                              label={<Text strong>Xác nhận Email mới</Text>} 
                              name="email_confirm"
                              rules={[
                                { required: true, message: 'Vui lòng xác nhận email!' },
                                ({ getFieldValue }) => ({
                                  validator(_, value) {
                                    if (!value || getFieldValue('email') === value) {
                                      return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Email xác nhận không khớp!'));
                                  },
                                }),
                              ]}
                            >
                              <Input prefix={<MailOutlined style={{ color: '#838c95' }} />} placeholder="new-email@example.com" style={{ height: 38 }} />
                            </Form.Item>

                            <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
                              <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={loading}
                                style={{ 
                                  backgroundColor: '#f48024', 
                                  borderColor: '#f48024', 
                                  height: 38,
                                  fontWeight: 500
                                }}
                              >
                                Thay đổi Email
                              </Button>
                            </Form.Item>
                          </Form>
                        )
                      },
                      {
                        key: 'password',
                        label: 'Đổi mật khẩu',
                        children: (
                          <Form
                            form={passwordForm}
                            layout="vertical"
                            onFinish={onUpdatePassword}
                            requiredMark={false}
                            style={{ marginTop: 16 }}
                          >
                            <Form.Item 
                              label={<Text strong>Mật khẩu hiện tại</Text>} 
                              name="password"
                              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
                            >
                              <Input.Password prefix={<LockOutlined style={{ color: '#838c95' }} />} placeholder="••••••••" style={{ height: 38 }} />
                            </Form.Item>

                            <Form.Item 
                              label={<Text strong>Mật khẩu mới</Text>} 
                              name="new_password"
                              rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                { min: 6, message: 'Mật khẩu phải tối thiểu 6 ký tự!' }
                              ]}
                            >
                              <Input.Password prefix={<LockOutlined style={{ color: '#838c95' }} />} placeholder="••••••••" style={{ height: 38 }} />
                            </Form.Item>

                            <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
                              <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={loading}
                                style={{ 
                                  backgroundColor: '#f48024', 
                                  borderColor: '#f48024', 
                                  height: 38,
                                  fontWeight: 500
                                }}
                              >
                                Đổi mật khẩu
                              </Button>
                            </Form.Item>
                          </Form>
                        )
                      }
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          </Content>
        </Layout>

        {/* Unified Bottom-Left Toast Popup */}
        {activeToast && (
          <div 
            onClick={() => {
              if (activeToast.type === 'SUCCESS' || activeToast.type === 'ERROR' || activeToast.type === 'WARNING') {
                setActiveToast(null);
              } else {
                if (activeToast.target_post_id) {
                  history.push(`/forum/post/${activeToast.target_post_id}`);
                }
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
}
