import React from 'react';
import { Typography, Input, Row, Col, Card, Avatar, Tag, Divider, Button, Empty, Pagination, Spin } from 'antd';
import { SearchOutlined, UserOutlined, CheckCircleFilled } from '@ant-design/icons';
import type { FormInstance } from 'antd';

const { Title, Paragraph, Text } = Typography;

interface LecturersTabProps {
  lecturers: any[];
  lecturerSearch: string;
  setLecturerSearch: (val: string) => void;
  lecturersCurrentPage: number;
  setLecturersCurrentPage: (page: number) => void;
  lecturersLoading: boolean;
  setIsModalOpen: (open: boolean) => void;
  form: FormInstance;
}

const LecturersTab: React.FC<LecturersTabProps> = ({
  lecturers,
  lecturerSearch,
  setLecturerSearch,
  lecturersCurrentPage,
  setLecturersCurrentPage,
  lecturersLoading,
  setIsModalOpen,
  form
}) => {
  const filtered = lecturers.filter(l => 
    (l.full_name || l.username).toLowerCase().includes(lecturerSearch.toLowerCase()) ||
    (l.major || '').toLowerCase().includes(lecturerSearch.toLowerCase()) ||
    (l.university || '').toLowerCase().includes(lecturerSearch.toLowerCase())
  );
  const paginated = filtered.slice((lecturersCurrentPage - 1) * 9, lecturersCurrentPage * 9);

  return (
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
      )}
    </div>
  );
};

export default LecturersTab;
