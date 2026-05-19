import React, { useState, useEffect, useRef } from 'react';
import { Layout, Button, Popover, Badge, Dropdown, Menu, Avatar, Space, Typography, List, Empty, notification } from 'antd';
import { BellOutlined, SearchOutlined, UserOutlined, SettingOutlined, LogoutOutlined, CheckCircleFilled } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { history, useLocation } from 'umi';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const { Header } = Layout;
const { Text } = Typography;

const BASE_URL = 'http://localhost:8002';

interface ForumHeaderProps {
  user?: any;
}

export const ForumHeader: React.FC<ForumHeaderProps> = ({ user }) => {
  const location = useLocation();
  const [localUser, setLocalUser] = useState<any>(null);
  const activeUser = user || localUser;

  const [isFocused, setIsFocused] = useState(false);
  const [editorEmpty, setEditorEmpty] = useState(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationLimit, setNotificationLimit] = useState<number>(10);
  const [activeToast, setActiveToast] = useState<{ id: any; type: string; message: string; target_post_id?: any; actor_avatar?: string; actor_name?: string } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const notifiedIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Sync user state
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setLocalUser(JSON.parse(savedUser));
    }
  }, [user]);

  // Load and listen to notifications
  useEffect(() => {
    let interval: any;
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchNotifications();
      interval = setInterval(fetchNotifications, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Handle URL change to sync search input
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search') || '';
    const tagsParam = params.get('tags') ? (params.get('tags') || '').split(',') : [];

    if (editorRef.current) {
      setEditorTagsAndText(tagsParam, searchParam);
    }
  }, [location.search]);

  // Clear active toast automatically
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const showSuccess = (msg: string) => {
    notification.success({
      message: 'Thành công',
      description: msg,
      placement: 'bottomLeft',
      duration: 3
    });
  };

  const showError = (msg: string) => {
    notification.error({
      message: 'Lỗi',
      description: msg,
      placement: 'bottomLeft',
      duration: 3
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
              setActiveToast({
                id: item.id,
                type: item.notification_type,
                message: item.message,
                target_post_id: item.target_post_id,
                actor_name: item.actor_name,
                actor_avatar: item.actor_avatar
              });
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
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        showSuccess('Đã đánh dấu tất cả thông báo là đã đọc');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    history.push('/auth');
  };

  // contenteditable search methods
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

  const executeSearch = () => {
    packageLooseHashtagsInPlace(editorRef.current);
    const { tags, keywords } = parseContentEditableDOM(editorRef.current);
    if (editorRef.current) {
      editorRef.current.blur();
    }
    setEditorEmpty(checkIsEditorEmpty());

    // Save to localStorage for sync
    localStorage.setItem('search_query', keywords);
    localStorage.setItem('search_tags', JSON.stringify(tags));

    history.push({
      pathname: '/forum',
      search: `?search=${encodeURIComponent(keywords)}&tags=${encodeURIComponent(tags.join(','))}`
    });
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

  const userMenuItems: MenuProps['items'] = [
    ...(activeUser?.role === 'ADMIN' ? [{ key: 'admin', icon: <SettingOutlined />, label: 'Trang quản trị', onClick: () => history.push('/admin') }] : []),
    { key: 'profile', icon: <UserOutlined />, label: 'Tài khoản', onClick: () => history.push('/forum/profile') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout },
  ];

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
    <>
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
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .forum-search-editor::-webkit-scrollbar {
          display: none;
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
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1264, margin: '0 auto', padding: '0 24px' }}>
          <div
            style={{ fontSize: 22, fontWeight: 800, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', width: 164 }}
            onClick={() => history.push('/forum')}
          >
            <img src="/favicon.png" alt="EduForum Logo" style={{ height: 28, marginRight: 8, objectFit: 'contain' }} />
            <span>edu<Text strong style={{ color: '#f48024' }}>forum</Text></span>
          </div>

          <div style={{ flex: 1, padding: '0 24px 0 0', margin: '0 0 0 46px', display: 'flex', alignItems: 'center', maxWidth: 800 }}>
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
            {activeUser ? (
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
                    {activeUser.avatar ? (
                      <Avatar
                        src={activeUser.avatar.startsWith('http') ? activeUser.avatar : `${BASE_URL}${activeUser.avatar}`}
                        style={{ border: '1px solid #e3e6e8' }}
                      />
                    ) : (
                      <Avatar
                        style={{ backgroundColor: '#f48024', fontWeight: 700, fontSize: 18 }}
                      >
                        {activeUser.username?.charAt(0).toUpperCase()}
                      </Avatar>
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
                      title={activeUser.full_name || activeUser.username}
                    >
                      {activeUser.full_name || activeUser.username}
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

      {/* Renders Facebook style floating toast notifications */}
      {activeToast && (
        <div
          onClick={() => {
            if (activeToast.target_post_id) {
              history.push(`/forum/post/${activeToast.target_post_id}`);
            }
            setActiveToast(null);
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
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            cursor: 'pointer',
            zIndex: 9999,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          {activeToast.actor_avatar ? (
            <Avatar
              size={42}
              src={activeToast.actor_avatar.startsWith('http') ? activeToast.actor_avatar : `${BASE_URL}${activeToast.actor_avatar}`}
              style={{ flexShrink: 0, border: '1px solid #e3e6e8' }}
            />
          ) : (
            <Avatar
              size={42}
              style={{ backgroundColor: activeToast.type === 'SUCCESS' ? '#52c41a' : activeToast.type === 'ERROR' ? '#ff4d4f' : '#f48024', flexShrink: 0 }}
              icon={<UserOutlined />}
            />
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, color: '#232629', lineHeight: 1.4 }}>
              <strong>{activeToast.actor_name || 'Thông báo mới'}</strong>
            </div>
            <div style={{ fontSize: 12.5, color: '#6a737c', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeToast.message}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
