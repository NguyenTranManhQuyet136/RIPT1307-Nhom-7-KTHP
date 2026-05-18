import string
import secrets

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

from posts.models import Post
from posts.serializers import PostSerializer
from comments.models import Comment
from notifications.signals import send_email_background

from .permissions import IsAdminRole
from .serializers import (
    AdminUserListSerializer,
    AdminUserCreateSerializer,
    AdminUserUpdateSerializer,
    AdminPostListSerializer,
)

User = get_user_model()


# ──────────────────────────────────────────────
# 1. QUẢN LÝ NGƯỜI DÙNG
# ──────────────────────────────────────────────
class AdminUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet quản lý User dành riêng cho Admin.
    Hỗ trợ: Xem / Thêm / Sửa / Soft-Delete / Khóa-Mở / Reset MK / Duyệt GV.
    """
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'full_name']
    ordering_fields = ['date_joined', 'username']
    filterset_fields = ['role', 'is_active', 'is_verified']

    def get_serializer_class(self):
        if self.action == 'create':
            return AdminUserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return AdminUserUpdateSerializer
        return AdminUserListSerializer

    # ── Override DELETE → Soft delete (is_active = False) ──
    @extend_schema(summary="Soft-delete người dùng (khóa tài khoản)")
    def perform_destroy(self, instance):
        """Không xóa hẳn user khỏi DB, chỉ gán is_active = False."""
        instance.is_active = False
        instance.save(update_fields=['is_active'])

    # ── ACTION: Khóa / Mở khóa tài khoản ──
    @extend_schema(summary="Khóa hoặc mở khóa tài khoản người dùng")
    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])

        status_text = "mở khóa" if user.is_active else "khóa"
        return Response({
            "success": True,
            "message": f"Đã {status_text} tài khoản {user.username} thành công.",
            "is_active": user.is_active,
        })

    # ── ACTION: Reset mật khẩu → random + gửi email ──
    @extend_schema(summary="Cấp lại mật khẩu ngẫu nhiên và gửi email cho người dùng")
    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        user = self.get_object()

        # Tạo mật khẩu ngẫu nhiên 12 ký tự (chữ + số + ký tự đặc biệt)
        alphabet = string.ascii_letters + string.digits + "!@#$%"
        new_password = 'EduForum@' + ''.join(secrets.choice(alphabet) for _ in range(6))

        user.set_password(new_password)
        user.save()

        # Gửi email thông báo mật khẩu mới
        if user.email:
            send_email_background(
                subject="EduForum - Mật khẩu của bạn đã được cấp lại",
                message=(
                    f"Xin chào {user.full_name or user.username},\n\n"
                    f"Quản trị viên đã cấp lại mật khẩu cho tài khoản của bạn.\n"
                    f"Mật khẩu mới: {new_password}\n\n"
                    f"Vui lòng đăng nhập và đổi mật khẩu ngay sau khi nhận được email này.\n\n"
                    f"Trân trọng,\nĐội ngũ EduForum."
                ),
                recipient_list=[user.email],
            )

        return Response({
            "success": True,
            "message": f"Đã cấp lại mật khẩu cho {user.username}. Email thông báo đã được gửi đến {user.email}.",
            "new_password": new_password,  # Trả về cho Admin xem (nếu email fail)
        })

    # ── ACTION: Duyệt giảng viên ──
    @extend_schema(summary="Duyệt xác thực tài khoản giảng viên")
    @action(detail=True, methods=['post'], url_path='verify-lecturer')
    def verify_lecturer(self, request, pk=None):
        user = self.get_object()

        if user.role != 'LECTURER':
            return Response(
                {"error": f"Tài khoản {user.username} không phải là Giảng viên."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.is_verified and user.is_verified_lecturer:
            return Response(
                {"error": f"Giảng viên {user.username} đã được xác thực trước đó."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_verified = True
        user.is_verified_lecturer = True
        user.save(update_fields=['is_verified', 'is_verified_lecturer'])

        # Gửi email thông báo cho giảng viên
        if user.email:
            send_email_background(
                subject="EduForum - Tài khoản Giảng viên đã được xác thực!",
                message=(
                    f"Chào {user.full_name or user.username},\n\n"
                    f"Tài khoản Giảng viên của bạn trên EduForum đã được Quản trị viên phê duyệt thành công!\n"
                    f"Bây giờ bạn có thể đăng nhập và sử dụng đầy đủ các quyền của Giảng viên.\n\n"
                    f"Trân trọng,\nĐội ngũ EduForum."
                ),
                recipient_list=[user.email],
            )

        return Response({
            "success": True,
            "message": f"Đã phê duyệt thành công giảng viên {user.full_name or user.username}!",
        })


# ──────────────────────────────────────────────
# 2. QUẢN LÝ BÀI ĐĂNG
# ──────────────────────────────────────────────
class AdminPostViewSet(viewsets.ModelViewSet):
    """
    ViewSet quản lý Bài đăng dành cho Admin.
    Chỉ cho phép GET (list/retrieve) và DELETE.
    """
    queryset = Post.objects.select_related('author').prefetch_related('tags', 'comments', 'votes').all()
    permission_classes = [IsAdminRole]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'author__username']
    ordering_fields = ['created_at', 'view_count']
    ordering = ['-created_at']

    # Chặn POST / PUT / PATCH (Admin không được viết bài)
    http_method_names = ['get', 'delete', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PostSerializer  # Xem chi tiết → dùng lại serializer gốc
        return AdminPostListSerializer

    @extend_schema(summary="Admin xóa bài đăng (gửi email thông báo cho tác giả)")
    def perform_destroy(self, instance):
        """Xóa bài và gửi email thông báo cho tác giả."""
        author = instance.author
        title = instance.title

        # Xóa bài
        instance.delete()

        # Gửi email thông báo cho tác giả
        if author and author.email:
            send_email_background(
                subject=f"EduForum - Bài viết của bạn đã bị gỡ",
                message=(
                    f"Xin chào {author.full_name or author.username},\n\n"
                    f"Bài viết \"{title}\" của bạn đã bị Quản trị viên gỡ bỏ "
                    f"do vi phạm tiêu chuẩn cộng đồng của EduForum.\n\n"
                    f"Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ đội ngũ quản trị.\n\n"
                    f"Trân trọng,\nĐội ngũ EduForum."
                ),
                recipient_list=[author.email],
            )


# ──────────────────────────────────────────────
# 3. THỐNG KÊ DASHBOARD
# ──────────────────────────────────────────────
class AdminStatsView(APIView):
    """
    API thống kê tổng quan cho Dashboard Admin.
    GET /api/admin/stats/
    """
    permission_classes = [IsAdminRole]

    @extend_schema(
        summary="Lấy thống kê tổng quan (Dashboard)",
        description="Trả về số lượng user, bài đăng, bình luận, giảng viên chờ duyệt, tài khoản bị khóa."
    )
    def get(self, request):
        return Response({
            "total_users": User.objects.count(),
            "total_students": User.objects.filter(role='STUDENT').count(),
            "total_lecturers": User.objects.filter(role='LECTURER').count(),
            "total_admins": User.objects.filter(role='ADMIN').count(),
            "total_posts": Post.objects.count(),
            "total_comments": Comment.objects.count(),
            "unverified_lecturers": User.objects.filter(
                role='LECTURER', is_verified=False
            ).count(),
            "locked_users": User.objects.filter(is_active=False).count(),
        })
