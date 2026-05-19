from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    actor_avatar = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'actor_name', 'actor_avatar', 'notification_type', 'message', 'target_post_id', 'is_read', 'created_at']

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.full_name if obj.actor.full_name else obj.actor.username
        return "Hệ thống"

    def get_actor_avatar(self, obj):
        if obj.actor and obj.actor.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.actor.avatar.url)
            return obj.actor.avatar.url
        return None

    def get_message(self, obj):
        actor_name = self.get_actor_name(obj)
        if obj.notification_type == 'WELCOME':
            return "Chào mừng bạn đã gia nhập diễn đàn EduForum!"
        elif obj.notification_type == 'REPLY_POST':
            return f"{actor_name} đã trả lời câu hỏi của bạn."
        elif obj.notification_type == 'REPLY_COMMENT':
            return f"{actor_name} đã phản hồi bình luận của bạn."
        elif obj.notification_type == 'NEW_POST':
            return f"{actor_name} đã đăng một câu hỏi mới."
        return ""
