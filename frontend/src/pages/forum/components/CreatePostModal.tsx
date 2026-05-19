import React from 'react';
import { Modal, Form, Input, Button, Space, Typography } from 'antd';
import { TagsOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';

const { Title, Paragraph, Text } = Typography;

interface CreatePostModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  editingPostId: number | null;
  setEditingPostId: (id: number | null) => void;
  form: FormInstance;
  handleCreatePost: (values: any) => Promise<void>;
  loading: boolean;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isModalOpen,
  setIsModalOpen,
  editingPostId,
  setEditingPostId,
  form,
  handleCreatePost,
  loading
}) => {
  return (
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
  );
};

export default CreatePostModal;
