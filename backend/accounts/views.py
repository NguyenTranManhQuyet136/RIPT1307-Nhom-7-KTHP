from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=RegisterSerializer,
        summary="Đăng ký tài khoản mới",
        description="API dùng để đăng ký tài khoản cho cả Sinh viên và Giảng viên."
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Đăng ký tài khoản EduForum thành công! Bạn có thể đăng nhập ngay bây giờ."
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Yêu cầu khôi phục mật khẩu",
        description="Gửi email chứa liên kết đặt lại mật khẩu cho người dùng."
    )
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Vui lòng cung cấp email."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Vẫn trả về thông báo đã gửi để tránh lộ thông tin email nào có trong DB (Bảo mật)
            return Response({"message": "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được một liên kết đặt lại mật khẩu."}, status=status.HTTP_200_OK)

        # Tạo token và mã hóa ID người dùng
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Tạo link reset (Chỉnh port 8000 theo frontend của bạn)
        reset_link = f"http://localhost:8000/reset-password?uid={uid}&token={token}"
        
        # Gửi email
        subject = "Khôi phục mật khẩu - EduForum"
        message = f"Chào {user.full_name or user.username},\n\nBạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào liên kết bên dưới để thực hiện:\n{reset_link}\n\nLiên kết này sẽ hết hạn sớm vì lý do bảo mật.\n\nTrân trọng,\nĐội ngũ EduForum."
        
        send_mail(subject, message, None, [email])

        return Response({"message": "Yêu cầu đã được gửi. Vui lòng kiểm tra hộp thư của bạn."}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Đặt lại mật khẩu mới",
        description="Xác thực token và cập nhật mật khẩu mới cho người dùng."
    )
    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('password')

        if not all([uidb64, token, new_password]):
            return Response({"error": "Thiếu thông tin cần thiết."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Liên kết không hợp lệ hoặc đã hết hạn."}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({"message": "Mật khẩu đã được cập nhật thành công!"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Mã xác thực không hợp lệ hoặc đã hết hạn."}, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.permissions import IsAuthenticated
from .serializers import UserProfileUpdateSerializer

class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=UserProfileUpdateSerializer,
        summary="Cập nhật hồ sơ cá nhân",
        description="API cập nhật thông tin cá nhân bao gồm họ tên, email, trường học, chuyên ngành, avatar và đổi mật khẩu."
    )
    def patch(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Trả về thông tin user mới cập nhật
            user = request.user
            avatar_url = request.build_absolute_uri(user.avatar.url) if user.avatar else None
            return Response({
                "success": True,
                "message": "Cập nhật hồ sơ cá nhân thành công!",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role,
                    "university": user.university,
                    "major": user.major,
                    "is_verified": user.is_verified,
                    "is_verified_lecturer": user.is_verified_lecturer,
                    "avatar": avatar_url
                }
            }, status=status.HTTP_200_OK)
        
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class UnverifiedLecturersListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Danh sách giảng viên chờ duyệt (Admin)",
        description="Lấy danh sách các giảng viên đăng ký nhưng chưa được xác thực."
    )
    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Chỉ Admin mới có quyền truy cập chức năng này."}, status=status.HTTP_403_FORBIDDEN)
        
        unverified_lecturers = User.objects.filter(role='LECTURER', is_verified=False)
        data = []
        for lecturer in unverified_lecturers:
            evidence_url = request.build_absolute_uri(lecturer.evidence_img.url) if lecturer.evidence_img else None
            avatar_url = request.build_absolute_uri(lecturer.avatar.url) if lecturer.avatar else None
            data.append({
                "id": lecturer.id,
                "username": lecturer.username,
                "email": lecturer.email,
                "full_name": lecturer.full_name,
                "university": lecturer.university,
                "major": lecturer.major,
                "profile_url": lecturer.profile_url,
                "evidence_img": evidence_url,
                "avatar": avatar_url,
                "date_joined": lecturer.date_joined
            })
        return Response(data, status=status.HTTP_200_OK)

class VerifyLecturerView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Duyệt giảng viên (Admin)",
        description="Phê duyệt một tài khoản giảng viên thành công."
    )
    def post(self, request, pk):
        if request.user.role != 'ADMIN':
            return Response({"error": "Chỉ Admin mới có quyền truy cập chức năng này."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            lecturer = User.objects.get(pk=pk, role='LECTURER')
        except User.DoesNotExist:
            return Response({"error": "Không tìm thấy giảng viên yêu cầu."}, status=status.HTTP_404_NOT_FOUND)
        
        lecturer.is_verified = True
        lecturer.is_verified_lecturer = True
        lecturer.save()
        
        return Response({
            "success": True,
            "message": f"Đã phê duyệt thành công giảng viên {lecturer.full_name or lecturer.username}!"
        }, status=status.HTTP_200_OK)
