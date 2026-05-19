from django.urls import path
from .views import RegisterView, CustomTokenObtainPairView, ForgotPasswordView, ResetPasswordView, UserProfileUpdateView, UnverifiedLecturersListView, VerifyLecturerView, VerifiedLecturersListView, PublicStatsView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileUpdateView.as_view(), name='user_profile_update'),
    path('lecturers/unverified/', UnverifiedLecturersListView.as_view(), name='unverified_lecturers'),
    path('lecturers/verified/', VerifiedLecturersListView.as_view(), name='verified_lecturers'),
    path('lecturers/<uuid:pk>/verify/', VerifyLecturerView.as_view(), name='verify_lecturer'),
    path('public-stats/', PublicStatsView.as_view(), name='public_stats'),
]
