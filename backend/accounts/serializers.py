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
    evidence_img = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role', 'university', 'major', 'profile_url', 'full_name', 'evidence_img')

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
        evidence_img = attrs.get('evidence_img')
        
        if role == 'LECTURER':
            if not profile_url:
                raise serializers.ValidationError({
                    "profile_url": "Tài khoản Giảng viên bắt buộc phải cung cấp đường dẫn hồ sơ công khai của trường Đại học."
                })
            if not evidence_img:
                raise serializers.ValidationError({
                    "evidence_img": "Tài khoản Giảng viên bắt buộc phải tải lên ảnh minh chứng (thẻ giảng viên, bằng cấp...)."
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
            # Nếu là STUDENT thì xóa profile_url và evidence_img nếu có
            attrs['profile_url'] = None
            attrs['evidence_img'] = None
            
        return attrs

    def create(self, validated_data):
        role = validated_data.get('role', 'STUDENT')
        is_verified = True
        is_verified_lecturer = True
        
        if role == 'LECTURER':
            is_verified = False
            is_verified_lecturer = False
            
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=role,
            full_name=validated_data.get('full_name', ''),
            university=validated_data.get('university', ''),
            major=validated_data.get('major', ''),
            profile_url=validated_data.get('profile_url', None),
            evidence_img=validated_data.get('evidence_img', None),
            is_verified=is_verified,
            is_verified_lecturer=is_verified_lecturer
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
            'is_verified_lecturer': self.user.is_verified_lecturer,
            'is_verified': self.user.is_verified
        }
        return data

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    email_confirm = serializers.EmailField(required=False, write_only=True, allow_blank=True)
    password = serializers.CharField(required=False, write_only=True, min_length=6, allow_blank=True)
    new_password = serializers.CharField(required=False, write_only=True, min_length=6, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('full_name', 'email', 'email_confirm', 'university', 'major', 'avatar', 'password', 'new_password')

    def validate(self, attrs):
        email = attrs.get('email')
        email_confirm = attrs.get('email_confirm')
        
        # Sửa Email (Có 2 ô nhập để chống gõ sai, không bắt xác minh qua mail)
        if email or email_confirm:
            if email != email_confirm:
                raise serializers.ValidationError({
                    "email": "Email và email xác nhận không trùng khớp."
                })
            # Kiểm tra trùng email
            if User.objects.exclude(pk=self.instance.pk).filter(email=email).exists():
                raise serializers.ValidationError({
                    "email": "Email này đã được sử dụng bởi một tài khoản khác."
                })
                
        # Kiểm tra mật khẩu mới
        new_password = attrs.get('new_password')
        if new_password:
            current_password = attrs.get('password')
            if not current_password:
                raise serializers.ValidationError({
                    "password": "Vui lòng nhập mật khẩu hiện tại để thay đổi mật khẩu."
                })
            if not self.instance.check_password(current_password):
                raise serializers.ValidationError({
                    "password": "Mật khẩu hiện tại không chính xác."
                })
            if len(new_password) < 6:
                raise serializers.ValidationError({
                    "new_password": "Mật khẩu mới phải có tối thiểu 6 ký tự."
                })
                
        return attrs

    def update(self, instance, validated_data):
        instance.full_name = validated_data.get('full_name', instance.full_name)
        
        email = validated_data.get('email')
        if email:
            instance.email = email
            
        instance.university = validated_data.get('university', instance.university)
        instance.major = validated_data.get('major', instance.major)
        
        avatar = validated_data.get('avatar')
        if avatar is not None:
            instance.avatar = avatar
            
        new_password = validated_data.get('new_password')
        if new_password:
            instance.set_password(new_password)
            
        instance.save()
        return instance
