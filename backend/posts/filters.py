import django_filters
from .models import Post

class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass

class PostFilter(django_filters.FilterSet):
    # Lọc bài viết theo danh sách slug của tag (Ví dụ: ?tag=python,django)
    tag = CharInFilter(field_name='tags__slug', lookup_expr='in')
    
    # Lọc bài viết chưa có câu trả lời (comment)
    # ?unanswered=true
    unanswered = django_filters.BooleanFilter(field_name='comments', lookup_expr='isnull')

    class Meta:
        model = Post
        fields = ['tag', 'is_closed', 'unanswered']
