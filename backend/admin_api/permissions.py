from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """
    Chỉ cho phép User có role == 'ADMIN' truy cập.
    Không dùng is_staff mặc định của Django, mà dùng field 'role' tự tạo.
    """
    message = "Chỉ Quản trị viên (Admin) mới có quyền truy cập chức năng này."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'ADMIN'
        )
