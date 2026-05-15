from rest_framework import serializers
from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    author_role = serializers.ReadOnlyField(source='author.role')
    replies = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'author_name', 'author_role',
            'content', 'parent', 'is_accepted', 'score', 'user_vote', 
            'replies', 'created_at'
        ]
        read_only_fields = ['author', 'is_accepted']

    def get_replies(self, obj):
        if obj.parent is None:
            context = self.context
            return CommentSerializer(obj.replies.all(), many=True, context=context).data
        return []

    def get_score(self, obj):
        from django.db.models import Sum
        return obj.votes.aggregate(Sum('value'))['value__sum'] or 0

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            return vote.value if vote else 0
        return 0
