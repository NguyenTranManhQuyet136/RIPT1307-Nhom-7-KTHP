from rest_framework import serializers
from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_role = serializers.ReadOnlyField(source='author.role')
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'author_name', 'author_role',
            'content', 'parent', 'is_accepted', 'replies', 'created_at'
        ]
        read_only_fields = ['author', 'is_accepted']

    def get_replies(self, obj):
        if obj.parent is None:
            return CommentSerializer(obj.replies.all(), many=True).data
        return []
