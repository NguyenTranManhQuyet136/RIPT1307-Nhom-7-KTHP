import django_filters
from .models import Post

class PostFilter(django_filters.FilterSet):
    # Lọc bài viết theo slug của tag (Ví dụ: ?tag=lap-trinh)
    tag = django_filters.CharFilter(field_name='tags__slug')
    
    # Lọc bài viết chưa có câu trả lời (comment)
    # ?unanswered=true
    unanswered = django_filters.BooleanFilter(field_name='comments', lookup_expr='isnull')

    class Meta:
        model = Post
        fields = ['tag', 'is_closed', 'unanswered']
