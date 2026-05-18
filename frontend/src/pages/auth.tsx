import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Segmented, 
  ConfigProvider, 
  Typography, 
  Layout, 
  theme,
  message,
  Card,
  Space,
  Alert,
  Avatar,
  Upload
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  BankOutlined, 
  ReadOutlined, 
  LinkOutlined,
  ArrowLeftOutlined,
  CameraOutlined
} from '@ant-design/icons';
import { history } from 'umi';

const { Title, Text } = Typography;
const { Content } = Layout;

// Hàm dịch lỗi tổng lực
const translateError = (errorKey: string, errorMessage: any): string => {
  const msg = Array.isArray(errorMessage) ? errorMessage[0] : errorMessage;
  if (typeof msg === 'string') {
    const lowMsg = msg.toLowerCase();
    if (lowMsg.includes('valid url')) return 'Vui lòng nhập một địa chỉ URL hợp lệ.';
    if (lowMsg.includes('at least 6 characters')) return 'Mật khẩu phải chứa ít nhất 6 ký tự.';
    if (lowMsg.includes('already exists')) {
      if (errorKey === 'email') return 'Email này đã được sử dụng.';
      if (errorKey === 'username') return 'Tên đăng nhập này đã được sử dụng.';
      return 'Thông tin này đã tồn tại trong hệ thống.';
    }
    if (lowMsg.includes('no active account') || lowMsg.includes('given credentials')) {
      return 'Tên đăng nhập hoặc mật khẩu không chính xác.';
    }
    if (lowMsg.includes('valid email address')) return 'Vui lòng nhập địa chỉ email hợp lệ.';
    if (lowMsg.includes('required')) return 'Trường này không được để trống.';
  }
  return msg;
};

const AuthForm: React.FC = () => {
  const [form] = Form.useForm();
  const [formType, setFormType] = useState<'login' | 'register' | 'forgot'>('login');
  const [role, setRole] = useState<string>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const [activeToast, setActiveToast] = useState<{ type: 'SUCCESS' | 'ERROR' | 'WARNING'; message: string } | null>(null);

  const showSuccess = (msg: string) => {
    setActiveToast({ type: 'SUCCESS', message: msg });
  };
  const showError = (msg: string) => {
    setActiveToast({ type: 'ERROR', message: msg });
  };
  const showWarning = (msg: string) => {
    setActiveToast({ type: 'WARNING', message: msg });
  };

  React.useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const onFinish = async (values: any) => {
    setLoading(true);
    let endpoint = '';
    if (formType === 'login') endpoint = '/api/auth/login/';
    else if (formType === 'register') endpoint = '/api/auth/register/';
    else endpoint = '/api/auth/forgot-password/';

    const baseUrl = 'http://localhost:8002';

    try {
      let response;
      if (formType === 'register') {
        const formData = new FormData();
        Object.keys(values).forEach(key => {
          if (values[key] !== undefined && values[key] !== null) {
            formData.append(key, values[key]);
          }
        });
        formData.set('role', role);

        response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
      }

      const data = await response.json();

      if (response.ok) {
        if (formType === 'login') {
          localStorage.setItem('trigger_toast_success', 'Đăng nhập thành công! Chào mừng bạn quay trở lại diễn đàn.');
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh);
          localStorage.setItem('user', JSON.stringify(data.user));
          history.push('/forum');
        } else if (formType === 'register') {
          showSuccess('Đăng ký thành công! Hãy đăng nhập để tiếp tục.');
          setFormType('login');
        } else {
          setRequestSent(true);
          showSuccess('Yêu cầu đã được gửi!');
        }
      } else {
        // Áp dụng dịch lỗi cho mọi trường hợp
        if (data.errors) {
          Object.keys(data.errors).forEach(key => {
            showError(translateError(key, data.errors[key]));
          });
        } else {
          const rawError = data.error || data.detail || 'Có lỗi xảy ra, vui lòng thử lại.';
          showError(translateError('general', rawError));
        }
      }
    } catch (error) {
      showError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = (type: 'login' | 'register' | 'forgot') => {
    form.resetFields();
    setRequestSent(false);
    setFormType(type);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Content style={{ width: '100%', maxWidth: 450, padding: '20px' }}>
        <Card bordered={false} style={{ width: '100%', borderRadius: 12 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ color: '#f48024', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>EduForum</div>
            <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
              {formType === 'login' ? 'Đăng nhập' : formType === 'register' ? 'Tạo tài khoản' : 'Khôi phục mật khẩu'}
            </Title>
            <Text type="secondary">
              {formType === 'login' ? 'Chào mừng bạn quay trở lại' : 
               formType === 'register' ? 'Tham gia cộng đồng học thuật' : 'Nhập email để lấy lại mật khẩu'}
            </Text>
          </div>

          {formType === 'forgot' && requestSent ? (
            <div style={{ textAlign: 'center' }}>
              <Alert
                message="Kiểm tra Email của bạn"
                description="Chúng tôi đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn."
                type="success"
                showIcon
                style={{ marginBottom: 24, textAlign: 'left' }}
              />
              <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => toggleForm('login')}>Quay lại đăng nhập</Button>
            </div>
          ) : (
            <Form 
              key={formType}
              form={form}
              layout="vertical" 
              onFinish={onFinish} 
              requiredMark={false}
              autoComplete="off"
            >
              {formType === 'login' && (
                <>
                  <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true, message: 'Nhập tên đăng nhập!' }]}>
                    <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Username" />
                  </Form.Item>
                  <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Nhập mật khẩu!' }]}>
                    <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="••••••••" />
                  </Form.Item>
                  <div style={{ textAlign: 'right', marginBottom: 24 }}>
                    <Button type="link" style={{ padding: 0, color: '#f48024' }} onClick={() => toggleForm('forgot')}>Quên mật khẩu?</Button>
                  </div>
                  <Button type="primary" htmlType="submit" block size="large" loading={loading}>Đăng nhập</Button>
                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Text>Chưa có tài khoản? </Text>
                    <Button type="link" onClick={() => toggleForm('register')} style={{ padding: 0, fontWeight: 700 }}>Đăng ký ngay</Button>
                  </div>
                </>
              )}

              {formType === 'forgot' && (
                <>
                  <Form.Item label="Email khôi phục" name="email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ!' }]}>
                    <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="email@example.com" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ marginBottom: 16 }}>Gửi yêu cầu</Button>
                  <div style={{ textAlign: 'center' }}><Button type="link" icon={<ArrowLeftOutlined />} onClick={() => toggleForm('login')}>Quay lại</Button></div>
                </>
              )}

              {formType === 'register' && (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Form.Item name="role" style={{ marginBottom: 12, textAlign: 'center' }}>
                    <Segmented block size="large" options={[{ label: 'Sinh viên', value: 'STUDENT' }, { label: 'Giảng viên', value: 'LECTURER' }]} value={role} onChange={(val) => { setRole(val as string); form.setFieldsValue({ role: val }); }} />
                  </Form.Item>
                  <Form.Item label="Họ và tên" name="full_name" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]} style={{ marginBottom: 8 }}>
                    <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nguyễn Văn A" />
                  </Form.Item>
                  <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true, message: 'Nhập tên đăng nhập!' }, { min: 6, message: 'Tối thiểu 6 ký tự!' }, { pattern: /^(?=.*[a-zA-Z])(?=.*[0-9])/, message: 'Phải gồm cả chữ và số!' }]} style={{ marginBottom: 8 }}>
                    <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="user123" />
                  </Form.Item>
                  <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ!' }]} style={{ marginBottom: 8 }}>
                    <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="email@example.com" />
                  </Form.Item>
                  <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Nhập mật khẩu!' }, { min: 6, message: 'Tối thiểu 6 ký tự!' }]} style={{ marginBottom: 8 }}>
                    <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="••••••••" />
                  </Form.Item>
                  <Form.Item label="Trường đại học" name="university" rules={[{ required: true, message: 'Vui lòng nhập tên trường!' }]} style={{ marginBottom: 8 }}>
                    <Input prefix={<BankOutlined style={{ color: '#bfbfbf' }} />} placeholder="Đại học Bách Khoa" />
                  </Form.Item>
                  <Form.Item 
                    label={role === 'LECTURER' ? 'Bộ môn giảng dạy' : 'Ngành học'} 
                    name="major" 
                    rules={[{ required: true, message: 'Vui lòng nhập ngành học/bộ môn!' }]} 
                    style={{ marginBottom: 8 }}
                  >
                    <Input prefix={<ReadOutlined style={{ color: '#bfbfbf' }} />} placeholder={role === 'LECTURER' ? 'Khoa học máy tính' : 'Kỹ thuật Phần mềm'} />
                  </Form.Item>
                  {role === 'LECTURER' && (
                    <>
                      <Form.Item label="Link hồ sơ giảng dạy" name="profile_url" rules={[{ required: true, message: 'Nhập link hồ sơ!' }]} style={{ marginBottom: 8 }}>
                        <Input prefix={<LinkOutlined style={{ color: '#f48024' }} />} placeholder="https://..." />
                      </Form.Item>
                      <Form.Item
                        label="Ảnh minh chứng (thẻ GV, bằng cấp...)"
                        name="evidence_img"
                        rules={[{ required: true, message: 'Vui lòng tải lên ảnh minh chứng!' }]}
                        style={{ marginBottom: 8 }}
                        valuePropName="file"
                        getValueFromEvent={(e: any) => {
                          if (Array.isArray(e)) {
                            return e;
                          }
                          return e && e.fileList && e.fileList[0] ? e.fileList[0].originFileObj : null;
                        }}
                      >
                        <Upload
                          beforeUpload={() => false}
                          maxCount={1}
                          listType="picture"
                          accept="image/*"
                        >
                          <Button icon={<CameraOutlined />} block style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            Chọn ảnh minh chứng
                          </Button>
                        </Upload>
                      </Form.Item>
                    </>
                  )}
                  <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ marginTop: 12 }}>Đăng ký tài khoản</Button>
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <Button type="link" onClick={() => toggleForm('login')} style={{ padding: 0, fontWeight: 700 }}>Đã có tài khoản? Đăng nhập</Button>
                  </div>
                </Space>
              )}
            </Form>
          )}
        </Card>
      </Content>
      {activeToast && (
        <div 
          onClick={() => setActiveToast(null)}
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
          <Avatar size={42} style={{ backgroundColor: activeToast.type === 'SUCCESS' ? '#f48024' : '#d12d2d', flexShrink: 0 }} icon={<UserOutlined />} />
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
               activeToast.type === 'ERROR' ? 'Thất bại' : 'Cảnh báo'}
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
  );
};

const AuthPage: React.FC = () => (
  <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#f48024', borderRadius: 8 } }}>
    <AuthForm />
  </ConfigProvider>
);

export default AuthPage;
