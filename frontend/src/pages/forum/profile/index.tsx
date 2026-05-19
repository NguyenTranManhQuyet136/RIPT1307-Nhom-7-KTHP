import React, { useState, useEffect } from 'react';
import { 
  Layout, 
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
  Tabs,
  Upload,
  message
} from 'antd';
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
import { ForumHeader } from '../components/shared/ForumHeader';
import { ForumSider } from '../components/shared/ForumSider';

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

  const [infoForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const BASE_URL = 'http://localhost:8002';

  const showSuccess = (msg: string) => {
    message.success(msg);
  };

  const showError = (msg: string) => {
    message.error(msg);
  };

  const showWarning = (msg: string) => {
    message.warning(msg);
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
  }, []);

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
            activeTab="profile" 
            onChangeTab={(key) => {
              history.push(`/forum?tab=${key}`);
            }} 
          />

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


      </Layout>
    </ConfigProvider>
  );
}
