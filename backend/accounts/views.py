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
