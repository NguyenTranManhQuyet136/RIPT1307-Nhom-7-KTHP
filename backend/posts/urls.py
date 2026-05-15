from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet

router = DefaultRouter()
router.register(r'', PostViewSet) # r'' vì nó sẽ nối tiếp từ url tổng

urlpatterns = [
    path('', include(router.urls)),
]