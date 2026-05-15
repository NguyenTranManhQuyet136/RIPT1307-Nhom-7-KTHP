from rest_framework import viewsets, permissions
from .models import Post
from .serializers import PostSerializer
from drf_spectacular.utils import extend_schema

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    
    # Phân quyền: Ai cũng được xem, nhưng phải đăng nhập mới được đăng/sửa/xóa
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # Tự động gán người đang đăng nhập làm tác giả của bài viết
        serializer.save(author=self.request.user)

    def get_queryset(self):
        # Hỗ trợ lọc bài viết theo tag nếu có query param ?tag=python
        queryset = Post.objects.all()
        tag_name = self.request.query_params.get('tag')
        if tag_name:
            queryset = queryset.filter(tags__name=tag_name.lower())
        return queryset
    
    @extend_schema(
        summary="Tạo bài viết mới",
        description="Gửi title, content và danh sách tag_names (mảng string). Hệ thống tự tạo tag nếu chưa có."
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)