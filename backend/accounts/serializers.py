from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(error_messages={
        "unique": "Tên đăng nhập này đã được sử dụng.",
        "required": "Vui lòng nhập tên đăng nhập."
    })
    password = serializers.CharField(write_only=True, min_length=6, error_messages={
        "min_length": "Mật khẩu phải chứa ít nhất 6 ký tự."
    })
    email = serializers.EmailField(required=True)
    profile_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role', 'university', 'major', 'profile_url', 'full_name')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Tên đăng nhập này đã được sử dụng.")

        if len(value) < 6:
            raise serializers.ValidationError("Tên đăng nhập phải có tối thiểu 6 ký tự.")
        
        import re
        if not re.search(r'[a-zA-Z]', value) or not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Tên đăng nhập phải chứa ít nhất một chữ cái và một chữ số.")
        
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email này đã được sử dụng bởi một tài khoản khác.")
        return value

    def validate(self, attrs):
        role = attrs.get('role', 'STUDENT')
        profile_url = attrs.get('profile_url')
        
        if role == 'LECTURER':
            if not profile_url:
                raise serializers.ValidationError({
                    "profile_url": "Tài khoản Giảng viên bắt buộc phải cung cấp đường dẫn hồ sơ công khai của trường Đại học."
                })
            # Kiểm tra định dạng URL thủ công
            validator = URLValidator()
            try:
                validator(profile_url)
            except DjangoValidationError:
                raise serializers.ValidationError({
                    "profile_url": "Vui lòng nhập một địa chỉ URL hợp lệ."
                })
        else:
            # Nếu là STUDENT thì xóa profile_url nếu có
            attrs['profile_url'] = None
            
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'STUDENT'),
            full_name=validated_data.get('full_name', ''),
            university=validated_data.get('university', ''),
            major=validated_data.get('major', ''),
            profile_url=validated_data.get('profile_url', None)
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        'no_active_account': 'Tên đăng nhập hoặc mật khẩu không chính xác.'
    }
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'full_name': self.user.full_name,
            'role': self.user.role,
            'university': self.user.university,
            'major': self.user.major,
            'is_verified_lecturer': self.user.is_verified_lecturer
        }
        return data
