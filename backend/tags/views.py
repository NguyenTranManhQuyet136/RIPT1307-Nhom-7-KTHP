from rest_framework import viewsets, filters
from .models import Tag
from .serializers import TagSerializer

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API này chỉ cho phép XEM danh sách tag.
    Việc tạo tag mới sẽ được xử lý ngầm bên API Đăng bài (Post).
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    
    # Thêm bộ lọc tìm kiếm: ?search=python
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        # Ưu tiên hiện các tag có nhiều bài viết nhất lên trước
        from django.db.models import Count
        return Tag.objects.annotate(num_posts=Count('posts')).order_by('-num_posts')
    