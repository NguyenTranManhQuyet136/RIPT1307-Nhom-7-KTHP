from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Comment
from .serializers import CommentSerializer
from drf_spectacular.utils import extend_schema


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Comment.objects.filter(parent=None)
        post_id = self.request.query_params.get('post')
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @extend_schema(
        summary="Chấp nhận câu trả lời",
        description="Chỉ tác giả bài viết hoặc giảng viên mới được đánh dấu câu trả lời đúng."
    )
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        comment = self.get_object()
        post = comment.post
        if request.user != post.author and request.user.role != 'LECTURER':
            return Response(
                {'detail': 'Chỉ tác giả bài viết hoặc giảng viên mới được chấp nhận câu trả lời.'},
                status=status.HTTP_403_FORBIDDEN
            )
        Comment.objects.filter(post=post, is_accepted=True).update(is_accepted=False)
        comment.is_accepted = True
        comment.save()
        return Response({'detail': 'Đã chấp nhận câu trả lời.', 'comment_id': comment.id})
