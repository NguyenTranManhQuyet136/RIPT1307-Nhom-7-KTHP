from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Post
from .serializers import PostSerializer
from .filters import PostFilter
from drf_spectacular.utils import extend_schema

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    
    # Phân quyền: Ai cũng được xem, nhưng phải đăng nhập mới được đăng/sửa/xóa
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    # Khai báo các bộ lọc sử dụng
    filter_backends = [
        DjangoFilterBackend,    # Lọc chính xác (theo Tag, trạng thái, chưa trả lời)
        filters.SearchFilter,   # Tìm kiếm từ khóa (Khớp một phần)
        filters.OrderingFilter  # Sắp xếp (Mới nhất, xem nhiều nhất)
    ]

    # Kết nối với Class Filter tùy chỉnh
    filterset_class = PostFilter

    # Các trường cho phép TÌM KIẾM TỪ KHÓA
    search_fields = ['title', 'content']

    # Các trường cho phép SẮP XẾP
    ordering_fields = ['created_at', 'view_count']
    
    # Mặc định bài mới nhất lên đầu
    ordering = ['-created_at']

    def perform_create(self, serializer):
        # Tự động gán người đang đăng nhập làm tác giả của bài viết
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Chỉ tăng lượt xem nếu người xem KHÔNG PHẢI là tác giả
        if request.user != instance.author:
            instance.view_count += 1
            instance.save(update_fields=['view_count'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def vote(self, request, pk=None):
        post = self.get_object()
        user = request.user
        value = int(request.data.get('value', 0)) # 1 hoặc -1

        if value not in [-1, 1]:
            return Response({'detail': 'Giá trị vote không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

        from .models import PostVote
        vote_obj = PostVote.objects.filter(user=user, post=post).first()

        if vote_obj:
            if vote_obj.value == value:
                vote_obj.delete()
                status_str = 'unvoted'
            else:
                vote_obj.value = value
                vote_obj.save()
                status_str = 'voted'
        else:
            PostVote.objects.create(user=user, post=post, value=value)
            status_str = 'voted'

        return Response({
            'status': status_str,
            'score': self.get_score(post),
            'user_vote': value if status_str == 'voted' else 0
        })

    def get_score(self, post):
        from django.db.models import Sum
        return post.votes.aggregate(Sum('value'))['value__sum'] or 0

    @extend_schema(
        summary="Tạo bài viết mới",
        description="Gửi title, content và danh sách tag_names (mảng string). Hệ thống tự tạo tag nếu chưa có."
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)