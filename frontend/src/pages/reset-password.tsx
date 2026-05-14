import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  ConfigProvider, 
  Typography, 
  Layout, 
  theme,
  message,
  Card,
  Result
} from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { history } from 'umi';

const { Title, Text } = Typography;
const { Content } = Layout;

const ResetPasswordPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const getParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      uid: params.get('uid'),
      token: params.get('token')
    };
  };

  const { uid, token } = getParams();

  useEffect(() => {
    if (!uid || !token) {
      message.error('Liên kết không hợp lệ. Bạn đang được chuyển hướng về trang chủ.');
      const timer = setTimeout(() => {
        history.push('/auth');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [uid, token]);

  const onFinish = async (values: any) => {
    if (!uid || !token) {
      message.error('Thông tin xác thực bị thiếu.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8002/api/auth/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          token,
          password: values.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        message.success('Đổi mật khẩu thành công!');
      } else {
        message.error(data.error || 'Mã xác thực đã hết hạn, vui lòng yêu cầu lại.');
      }
    } catch (error) {
      message.error('Lỗi kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: { colorPrimary: '#f48024', borderRadius: 8 },
        components: {
          Button: { controlHeight: 44, fontWeight: 600 },
          Input: { controlHeight: 42 }
        }
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Content style={{ width: '100%', maxWidth: 450, padding: '20px' }}>
          <Card bordered={false} style={{ width: '100%', borderRadius: 12 }}>
            {success ? (
              <Result
                status="success"
                title="Đặt lại mật khẩu thành công"
                subTitle="Bây giờ bạn có thể sử dụng mật khẩu mới để đăng nhập vào EduForum."
                extra={[
                  <Button type="primary" key="login" block onClick={() => history.push('/auth')}>
                    Đăng nhập ngay
                  </Button>
                ]}
              />
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div style={{ color: '#f48024', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>EduForum</div>
                  <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>Đặt lại mật khẩu</Title>
                  <Text type="secondary">Nhập mật khẩu mới cho tài khoản của bạn</Text>
                </div>

                <Form 
                  form={form}
                  layout="vertical" 
                  onFinish={onFinish} 
                  requiredMark={false}
                  autoComplete="off"
                >
                  <Form.Item 
                    label="Mật khẩu mới" 
                    name="password" 
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                      { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="••••••••" />
                  </Form.Item>

                  <Form.Item 
                    label="Xác nhận mật khẩu mới" 
                    name="confirm" 
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Vui lòng xác nhận lại mật khẩu!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nhập lại mật khẩu mới" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                      Xác nhận đổi mật khẩu
                    </Button>
                  </Form.Item>
                </Form>
              </>
            )}
          </Card>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default ResetPasswordPage;
