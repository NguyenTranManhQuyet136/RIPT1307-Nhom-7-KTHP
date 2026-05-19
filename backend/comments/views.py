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
        
        # Kiểm tra quyền: Chỉ tác giả bài viết, giảng viên đã xác thực hoặc admin
        is_lecturer = request.user.role == 'LECTURER'
        is_verified_lecturer = is_lecturer and getattr(request.user, 'is_verified', False)
        is_admin = request.user.role == 'ADMIN'
        
        if request.user != post.author and not is_verified_lecturer and not is_admin:
            if is_lecturer and not getattr(request.user, 'is_verified', False):
                return Response(
                    {'detail': 'Giảng viên chưa xác thực không có quyền chọn câu trả lời chuẩn.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return Response(
                {'detail': 'Chỉ tác giả bài viết, giảng viên đã xác thực hoặc admin mới có quyền này.'},
                status=status.HTTP_403_FORBIDDEN
            )

        is_user_author = (request.user == post.author)
        is_user_lecturer = (is_verified_lecturer or is_admin)

        if is_user_author:
            Comment.objects.filter(post=post).exclude(id=comment.id).update(accepted_by_author=False)
            comment.accepted_by_author = not comment.accepted_by_author

        if is_user_lecturer:
            Comment.objects.filter(post=post).exclude(id=comment.id).update(accepted_by_lecturer=False)
            comment.accepted_by_lecturer = not comment.accepted_by_lecturer

        comment.is_accepted = (comment.accepted_by_author or comment.accepted_by_lecturer)
        comment.save()

        # Cập nhật is_accepted cho toàn bộ các comment khác của bài viết
        for other_comment in Comment.objects.filter(post=post).exclude(id=comment.id):
            is_acc = (other_comment.accepted_by_author or other_comment.accepted_by_lecturer)
            if other_comment.is_accepted != is_acc:
                other_comment.is_accepted = is_acc
                other_comment.save(update_fields=['is_accepted'])

        msg = 'Đã cập nhật trạng thái chấp nhận câu trả lời.'
        return Response({
            'detail': msg, 
            'is_accepted': comment.is_accepted,
            'accepted_by_author': comment.accepted_by_author,
            'accepted_by_lecturer': comment.accepted_by_lecturer
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def vote(self, request, pk=None):
        comment = self.get_object()
        user = request.user
        value = int(request.data.get('value', 0))

        if value not in [-1, 1]:
            return Response({'detail': 'Giá trị vote không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

        from .models import CommentVote
        vote_obj = CommentVote.objects.filter(user=user, comment=comment).first()

        if vote_obj:
            if vote_obj.value == value:
                vote_obj.delete()
                status_str = 'unvoted'
            else:
                vote_obj.value = value
                vote_obj.save()
                status_str = 'voted'
        else:
            CommentVote.objects.create(user=user, comment=comment, value=value)
            status_str = 'voted'

        return Response({
            'status': status_str,
            'score': self.get_score(comment),
            'user_vote': value if status_str == 'voted' else 0
        })

    def get_score(self, comment):
        from django.db.models import Sum
        return comment.votes.aggregate(Sum('value'))['value__sum'] or 0

