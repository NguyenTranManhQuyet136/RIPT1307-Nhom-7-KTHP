import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Loại bỏ first_name và last_name mặc định của Django
    first_name = None
    last_name = None

    ROLE_CHOICES = [
        ('STUDENT', 'Student'),
        ('LECTURER', 'Lecturer'),
        ('ADMIN', 'Admin'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    full_name = models.CharField(max_length=255, blank=True, verbose_name="Họ và tên")
    
    university = models.CharField(max_length=255, blank=True, verbose_name="Trường đại học")
    major = models.CharField(max_length=255, blank=True, verbose_name="Chuyên ngành")
    
    profile_url = models.URLField(max_length=500, blank=True, null=True, verbose_name="Link hồ sơ giảng dạy")
    is_verified_lecturer = models.BooleanField(default=False, verbose_name="Giảng viên đã xác thực")
    is_verified = models.BooleanField(default=False, verbose_name="Đã duyệt/xác thực tài khoản")
    evidence_img = models.ImageField(upload_to='evidence/', null=True, blank=True, verbose_name="Ảnh minh chứng")
    
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
