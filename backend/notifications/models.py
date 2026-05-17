from django.db import models
from django.conf import settings

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('WELCOME', 'Welcome'),
        ('REPLY_POST', 'Reply Post'),
        ('REPLY_COMMENT', 'Reply Comment'),
    )

    # Người nhận thông báo (chủ bài viết, chủ bình luận hoặc người mới đăng ký)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    
    # Người thực hiện hành động (Ai đã bình luận?). null nếu là hệ thống (Welcome)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='actor_notifications')
    
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    
    # Lưu ID của bài viết để Frontend biết đường chuyển hướng khi click vào
    target_post_id = models.IntegerField(null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient} - {self.notification_type}"
