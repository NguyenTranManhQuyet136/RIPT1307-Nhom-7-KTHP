from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Sum

User = get_user_model()


class AdminUserListSerializer(serializers.ModelSerializer):
    """Serializer hiển thị danh sách User trên bảng quản lý (Ant Design <Table>)."""
    avatar = serializers.SerializerMethodField()
    evidence_img = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'role',
            'is_active', 'is_verified', 'is_verified_lecturer',
            'university', 'major', 'profile_url',
            'evidence_img', 'avatar', 'bio', 'date_joined',
        ]

    def get_avatar(self, obj):
        request = self.context.get('request')
        if obj.avatar:
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

    def get_evidence_img(self, obj):
        request = self.context.get('request')
        if obj.evidence_img:
            if request:
                return request.build_absolute_uri(obj.evidence_img.url)
            return obj.evidence_img.url
        return None


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Admin tạo tài khoản User mới."""
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'full_name', 'role', 'university', 'major']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email này đã được sử dụng.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)

        # Admin tạo tài khoản thì mặc định active và verified
        user.is_active = True
        if user.role != 'LECTURER':
            user.is_verified = True
            user.is_verified_lecturer = True

        user.save()
        return user


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Admin cập nhật thông tin User."""

    class Meta:
        model = User
        fields = ['email', 'full_name', 'role', 'university', 'major', 'is_active', 'is_verified', 'is_verified_lecturer']

    def validate_email(self, value):
        # Loại trừ chính user đang sửa
        if User.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
            raise serializers.ValidationError("Email này đã được sử dụng bởi tài khoản khác.")
        return value


class AdminPostListSerializer(serializers.Serializer):
    """Serializer hiển thị danh sách bài đăng trên bảng quản lý."""
    id = serializers.IntegerField()
    title = serializers.CharField()
    author_name = serializers.SerializerMethodField()
    author_id = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()
    view_count = serializers.IntegerField()
    comment_count = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    is_closed = serializers.BooleanField()
    tags = serializers.SerializerMethodField()

    def get_author_name(self, obj):
        return obj.author.username if obj.author else "Đã xóa"

    def get_author_id(self, obj):
        return str(obj.author.id) if obj.author else None

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_score(self, obj):
        return obj.votes.aggregate(total=Sum('value'))['total'] or 0

    def get_tags(self, obj):
        return [{'id': tag.id, 'name': tag.name} for tag in obj.tags.all()]
