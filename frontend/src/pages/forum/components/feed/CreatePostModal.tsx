import React from 'react';
import { Modal, Form, Typography, Input, Space, Button } from 'antd';
import { TagsOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface CreatePostModalProps {
  open: boolean;
  onCancel: () => void;
  onFinish: (values: any) => void;
  editingPostId: number | null;
  form: any;
  loading: boolean;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  open,
  onCancel,
  onFinish,
  editingPostId,
  form,
  loading
}) => {
  return (
    <Modal
      title={
        <Title level={3} style={{ margin: 0 }}>
          {editingPostId ? 'Chỉnh sửa câu hỏi' : 'Đặt câu hỏi cho cộng đồng'}
        </Title>
      }
      open={open}
      onCancel={onCancel}
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
        onFinish={onFinish}
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
            <Button onClick={onCancel}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" size="large" loading={loading}>
              {editingPostId ? 'Cập nhật' : 'Đăng câu hỏi'}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};
