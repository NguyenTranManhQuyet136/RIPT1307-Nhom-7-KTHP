from rest_framework import serializers
from .models import Post
from tags.models import Tag
from tags.serializers import TagSerializer # Giả sử ông đã tạo Serializer này ở app tags

class PostSerializer(serializers.ModelSerializer):
    # Dùng để hiển thị thông tin tag khi GET
    tags = TagSerializer(many=True, read_only=True)
    
    # Dùng để nhận danh sách tên tag (dạng text) khi POST/PUT
    tag_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    
    author_name = serializers.ReadOnlyField(source='author.username')
    comment_count = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'author', 'author_name', 
            'tags', 'tag_names', 'view_count', 'comment_count', 
            'score', 'user_vote', 'is_closed', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'view_count', 'created_at', 'updated_at']

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_score(self, obj):
        from django.db.models import Sum
        return obj.votes.aggregate(Sum('value'))['value__sum'] or 0

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            return vote.value if vote else 0
        return 0

    def create(self, validated_data):
        # Lấy danh sách tên tag ra trước khi tạo Post
        tag_names = validated_data.pop('tag_names', [])
        
        # Tạo bài đăng (author sẽ được gán ở View)
        post = Post.objects.create(**validated_data)
        
        # Xử lý gắn tag (Tạo mới nếu chưa có - logic bừa bãi có kiểm soát)
        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=name.lower().strip())
            post.tags.add(tag)
            
        return post