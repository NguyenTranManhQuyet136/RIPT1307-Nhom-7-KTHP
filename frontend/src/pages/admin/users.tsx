import React, { useState, useEffect } from 'react';
import {
  Layout, Button, Card, Space, Typography, Avatar, Table,
  ConfigProvider, theme, Empty, Tag, Input,
  Modal, Form, Drawer, Select, Tooltip, Image, Popconfirm, message
} from 'antd';
import {
  SearchOutlined, CheckCircleFilled, EditOutlined, DeleteOutlined, KeyOutlined,
  LockOutlined, UnlockOutlined, IdcardOutlined, PlusOutlined
} from '@ant-design/icons';
import { history } from 'umi';
import moment from 'moment';
import 'moment/locale/vi';
import { AdminHeader } from './components/AdminHeader';
import { AdminSider } from './components/AdminSider';

moment.locale('vi');

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function AdminUsers() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  
  // Modals / Drawers state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const BASE_URL = 'http://localhost:8002';

  const showSuccess = (msg: string) => message.success(msg);
  const showError = (msg: string) => message.error(msg);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) { history.push('/auth'); return; }
    const parsed = JSON.parse(savedUser);
    if (parsed.role !== 'ADMIN') { history.push('/forum'); return; }
    setUser(parsed);
    
    fetchUsers();
  }, []);

  const fetchUsers = async (search?: string, roleFilter?: string) => {
    const token = localStorage.getItem('access_token');
    setLoading(true);
    try {
      let url = `${BASE_URL}/api/admin/users/`;
      const queryParams = new URLSearchParams();
      
      const searchToUse = search !== undefined ? search : searchQuery;
      if (searchToUse) {
        queryParams.append('search', searchToUse);
      }
      
      const roleToUse = roleFilter !== undefined ? roleFilter : selectedRole;
      if (roleToUse === 'UNVERIFIED_LECTURER') {
        queryParams.append('role', 'LECTURER');
        queryParams.append('is_verified', 'false');
      } else if (roleToUse && roleToUse !== 'ALL') {
        queryParams.append('role', roleToUse);
      }
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.results || (Array.isArray(data) ? data : []));
      } else {
        showError('Không thể tải danh sách người dùng');
      }
    } catch { showError('Lỗi kết nối server'); }
    finally { setLoading(false); }
  };

  // ── ACTIONS ──

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${userId}/toggle-active/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess(data.message);
        fetchUsers(searchQuery);
      } else {
        showError('Có lỗi xảy ra');
      }
    } catch { showError('Lỗi kết nối server'); }
  };

  const handleResetPassword = async (userId: string) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${userId}/reset-password/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Modal.success({
          title: 'Cấp lại mật khẩu thành công',
          content: (
            <div>
              <p>{data.message}</p>
              <p>Mật khẩu mới: <Text copyable strong>{data.new_password}</Text></p>
            </div>
          )
        });
      } else {
        showError('Có lỗi xảy ra');
      }
    } catch { showError('Lỗi kết nối server'); }
  };

  const handleVerifyLecturer = async (userId: string) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${userId}/verify-lecturer/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess(data.message);
        fetchUsers(searchQuery);
      } else {
        showError(data.error || 'Có lỗi xảy ra');
      }
    } catch { showError('Lỗi kết nối server'); }
  };

  const handleCreateUser = async (values: any) => {
    const token = localStorage.getItem('access_token');
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess('Tạo người dùng thành công');
        setIsCreateModalOpen(false);
        createForm.resetFields();
        fetchUsers(searchQuery);
      } else {
        if (data.email) showError(data.email[0]);
        else if (data.username) showError(data.username[0]);
        else showError('Có lỗi xảy ra khi tạo người dùng');
      }
    } catch { showError('Lỗi kết nối server'); }
    finally { setLoading(false); }
  };

  const handleUpdateUser = async (values: any) => {
    if (!editingUser) return;
    const token = localStorage.getItem('access_token');
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users/${editingUser.id}/`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess('Cập nhật người dùng thành công');
        setIsEditDrawerOpen(false);
        fetchUsers(searchQuery);
      } else {
        if (data.email) showError(data.email[0]);
        else showError('Có lỗi xảy ra khi cập nhật');
      }
    } catch { showError('Lỗi kết nối server'); }
    finally { setLoading(false); }
  };

  const openEditDrawer = (record: any) => {
    setEditingUser(record);
    editForm.setFieldsValue({
      full_name: record.full_name,
      email: record.email,
      role: record.role,
      university: record.university,
      major: record.major,
      is_active: record.is_active,
      is_verified: record.is_verified
    });
    setIsEditDrawerOpen(true);
  };

  // ── RENDER HELPERS ──

  const getRoleTag = (role: string, isVerified: boolean) => {
    if (role === 'ADMIN') return <Tag color="red">Admin</Tag>;
    if (role === 'LECTURER') {
      return isVerified 
        ? <Tag color="processing" icon={<CheckCircleFilled />}>Giảng viên</Tag>
        : <Tag color="warning">GV (Chưa duyệt)</Tag>;
    }
    return <Tag color="cyan">Sinh viên</Tag>;
  };

  const columns = [
    {
      title: 'Tài khoản',
      key: 'account',
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {record.avatar ? (
             <Avatar src={record.avatar.startsWith('http') ? record.avatar : `${BASE_URL}${record.avatar}`} />
          ) : (
            <Avatar style={{ backgroundColor: '#f48024' }}>{record.username.charAt(0).toUpperCase()}</Avatar>
          )}
          <div>
            <div style={{ fontWeight: 600, color: '#0074cc' }}>{record.username}</div>
            <div style={{ fontSize: 12, color: '#6a737c' }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Họ tên',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Vai trò',
      key: 'role',
      render: (_: any, record: any) => getRoleTag(record.role, record.is_verified_lecturer),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => (
        record.is_active 
          ? <Tag color="success">Hoạt động</Tag> 
          : <Tag color="error">Bị khóa</Tag>
      ),
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'date_joined',
      key: 'date_joined',
      render: (date: string) => moment(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          {record.role === 'LECTURER' && !record.is_verified_lecturer && (
            <>
              {record.evidence_img && (
                <Tooltip title="Xem minh chứng">
                  <Button 
                    type="text" 
                    icon={<IdcardOutlined />} 
                    onClick={() => setEvidencePreview(record.evidence_img.startsWith('http') ? record.evidence_img : `${BASE_URL}${record.evidence_img}`)} 
                  />
                </Tooltip>
              )}
              <Popconfirm
                title="Duyệt giảng viên này?"
                onConfirm={() => handleVerifyLecturer(record.id)}
                okText="Duyệt"
                cancelText="Hủy"
              >
                <Tooltip title="Phê duyệt Giảng viên">
                  <Button type="text" style={{ color: '#52c41a' }} icon={<CheckCircleFilled />} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
          
          <Tooltip title="Chỉnh sửa">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEditDrawer(record)} />
          </Tooltip>

          <Popconfirm
            title="Cấp lại mật khẩu mới cho user này?"
            description="Mật khẩu mới sẽ được gửi qua email."
            onConfirm={() => handleResetPassword(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Tooltip title="Reset Mật khẩu">
              <Button type="text" icon={<KeyOutlined />} />
            </Tooltip>
          </Popconfirm>

          <Popconfirm
            title={record.is_active ? "Khóa tài khoản này?" : "Mở khóa tài khoản này?"}
            onConfirm={() => handleToggleActive(record.id, record.is_active)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Tooltip title={record.is_active ? "Khóa tài khoản" : "Mở khóa"}>
              <Button type="text" danger={record.is_active} style={{ color: !record.is_active ? '#52c41a' : undefined }} icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#f48024', borderRadius: 4, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' } }}>
      <style>{`
        .ant-popover, .ant-popover-content, .ant-dropdown, .ant-dropdown-menu { transition: none !important; animation: none !important; }
        .admin-sider .ant-menu-item-selected { background-color: #fff7e6 !important; color: #f48024 !important; }
        .admin-sider .ant-menu-item-selected::after { border-right-color: #f48024 !important; }
        .admin-sider .ant-menu-item:hover { color: #f48024 !important; }
      `}</style>
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <AdminHeader user={user} />

        <Layout style={{ marginTop: 56 }}>
          <AdminSider activeKey="users" />

          {/* ── CONTENT ── */}
          <Content style={{ marginLeft: 200, padding: 24, minHeight: 'calc(100vh - 56px)' }}>
            <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0 }}>Danh sách Người dùng</Title>
                <Space>
                  <Select
                    placeholder="Lọc theo vai trò"
                    value={selectedRole}
                    onChange={(val) => {
                      setSelectedRole(val);
                      fetchUsers(searchQuery, val);
                    }}
                    style={{ width: 150 }}
                    options={[
                      { label: 'Tất cả vai trò', value: 'ALL' },
                      { label: 'Sinh viên', value: 'STUDENT' },
                      { label: 'Giảng viên', value: 'LECTURER' },
                      { label: 'Giảng viên chưa duyệt', value: 'UNVERIFIED_LECTURER' },
                      { label: 'Admin', value: 'ADMIN' },
                    ]}
                  />
                  <Input 
                    placeholder="Tìm username, email..." 
                    prefix={<SearchOutlined />}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onPressEnter={() => fetchUsers(searchQuery)}
                    style={{ width: 220 }}
                    allowClear
                  />
                  <Button type="primary" onClick={() => fetchUsers(searchQuery)}>Tìm kiếm</Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)} style={{ background: '#52c41a', borderColor: '#52c41a' }}>Thêm mới</Button>
                </Space>
              </div>

              <Table 
                columns={columns} 
                dataSource={users} 
                rowKey="id" 
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            </Card>
          </Content>
        </Layout>

        {/* ── CREATE MODAL ── */}
        <Modal
          title="Thêm Người dùng mới"
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          footer={null}
        >
          <Form form={createForm} layout="vertical" onFinish={handleCreateUser}>
            <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item name="full_name" label="Họ và tên">
              <Input />
            </Form.Item>
            <Form.Item name="role" label="Vai trò" initialValue="STUDENT">
              <Select>
                <Select.Option value="STUDENT">Sinh viên</Select.Option>
                <Select.Option value="LECTURER">Giảng viên</Select.Option>
                <Select.Option value="ADMIN">Admin</Select.Option>
              </Select>
            </Form.Item>
            <div style={{ textAlign: 'right', marginTop: 24 }}>
              <Space>
                <Button onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={loading}>Tạo tài khoản</Button>
              </Space>
            </div>
          </Form>
        </Modal>

        {/* ── EDIT DRAWER ── */}
        <Drawer
          title="Chỉnh sửa Người dùng"
          placement="right"
          onClose={() => setIsEditDrawerOpen(false)}
          open={isEditDrawerOpen}
          width={400}
        >
          <Form form={editForm} layout="vertical" onFinish={handleUpdateUser}>
            <Form.Item name="full_name" label="Họ và tên"><Input /></Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}><Input /></Form.Item>
            <Form.Item name="role" label="Vai trò">
              <Select>
                <Select.Option value="STUDENT">Sinh viên</Select.Option>
                <Select.Option value="LECTURER">Giảng viên</Select.Option>
                <Select.Option value="ADMIN">Admin</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="university" label="Trường đại học"><Input /></Form.Item>
            <Form.Item name="major" label="Chuyên ngành"><Input /></Form.Item>
            <Form.Item name="is_active" label="Trạng thái hoạt động" valuePropName="checked">
              <Select>
                <Select.Option value={true}>Hoạt động</Select.Option>
                <Select.Option value={false}>Khóa</Select.Option>
              </Select>
            </Form.Item>
            <div style={{ textAlign: 'right', marginTop: 24 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>Lưu thay đổi</Button>
            </div>
          </Form>
        </Drawer>

        {/* ── EVIDENCE PREVIEW ── */}
        {evidencePreview && (
          <Image
            wrapperStyle={{ display: 'none' }}
            preview={{
              visible: !!evidencePreview,
              src: evidencePreview,
              onVisibleChange: (value) => { if (!value) setEvidencePreview(null); }
            }}
          />
        )}
      </Layout>
    </ConfigProvider>
  );
}
