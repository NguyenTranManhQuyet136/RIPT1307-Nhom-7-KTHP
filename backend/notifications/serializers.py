from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'actor_name', 'notification_type', 'message', 'target_post_id', 'is_read', 'created_at']

    def get_actor_name(self, obj):
        return obj.actor.username if obj.actor else "Hệ thống"

    def get_message(self, obj):
        actor_name = self.get_actor_name(obj)
        if obj.notification_type == 'WELCOME':
            return "Chào mừng bạn đã gia nhập diễn đàn EduForum!"
        elif obj.notification_type == 'REPLY_POST':
            return f"{actor_name} đã trả lời câu hỏi của bạn."
        elif obj.notification_type == 'REPLY_COMMENT':
            return f"{actor_name} đã phản hồi bình luận của bạn."
        return ""
