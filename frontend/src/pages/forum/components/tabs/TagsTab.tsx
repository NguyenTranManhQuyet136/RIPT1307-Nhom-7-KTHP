import React from 'react';
import { Typography, Input, Row, Col, Card, Tag, Empty, Pagination } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { TagType } from '../../types';

const { Title, Paragraph, Text } = Typography;

interface TagsTabProps {
  tags: TagType[];
  tagSearch: string;
  setTagSearch: (val: string) => void;
  tagsCurrentPage: number;
  setTagsCurrentPage: (page: number) => void;
  filterByTag: (tag: string | null) => void;
  setActiveTab: (tab: string) => void;
}

const TagsTab: React.FC<TagsTabProps> = ({
  tags,
  tagSearch,
  setTagSearch,
  tagsCurrentPage,
  setTagsCurrentPage,
  filterByTag,
  setActiveTab
}) => {
  const filtered = tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()));
  const paginated = filtered.slice((tagsCurrentPage - 1) * 20, tagsCurrentPage * 20);

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0, fontWeight: 400 }}>Thẻ phổ biến</Title>
        <Input
          placeholder="Tìm kiếm thẻ..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          style={{ width: 250 }}
          onChange={e => { setTagSearch(e.target.value); setTagsCurrentPage(1); }}
        />
      </div>
      <Paragraph style={{ color: '#525960', fontSize: 15, marginBottom: 24 }}>
        Thẻ là một danh mục giúp nhóm các câu hỏi có cùng chủ đề lại với nhau. Hãy click vào một thẻ để xem các câu hỏi liên quan.
      </Paragraph>

      <Row gutter={[16, 16]}>
        {paginated.map(t => (
          <Col span={8} key={t.id}>
            <Card
              style={{ borderColor: '#e3e6e8', borderRadius: 6, cursor: 'pointer' }}
              bodyStyle={{ padding: '16px' }}
              onClick={() => {
                filterByTag(t.slug);
                setActiveTab('home');
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color="#e1ecf4" style={{ border: 'none', color: '#39739d', fontWeight: 600, fontSize: 14, padding: '2px 8px', margin: 0 }}>
                  {t.name}
                </Tag>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {t.post_count} bài viết
                </Text>
              </div>
            </Card>
          </Col>
        ))}
        {filtered.length === 0 && (
          <Col span={24}>
            <Empty description="Không tìm thấy thẻ nào khớp với từ khóa tìm kiếm" />
          </Col>
        )}
      </Row>
      {filtered.length > 0 && (
        <Pagination
          current={tagsCurrentPage}
          onChange={setTagsCurrentPage}
          pageSize={20}
          total={filtered.length}
          showSizeChanger={false}
          style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}
        />
      )}
    </div>
  );
};

export default TagsTab;
