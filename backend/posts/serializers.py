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
    
    # Hiển thị tên tác giả thay vì chỉ hiện ID
    author_name = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'author', 'author_name', 
            'tags', 'tag_names', 'view_count', 'is_closed', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'view_count', 'created_at', 'updated_at']

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