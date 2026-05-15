from rest_framework import serializers
from .models import Tag

class TagSerializer(serializers.ModelSerializer):
    # Thêm trường đếm số bài viết thuộc tag này (rất hữu ích cho UI)
    post_count = serializers.IntegerField(source='posts.count', read_only=True)

    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'description', 'post_count']