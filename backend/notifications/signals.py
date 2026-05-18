from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
import threading

from django.contrib.auth import get_user_model
from comments.models import Comment
from posts.models import Post
from .models import Notification

User = get_user_model()


# Hàm hỗ trợ chạy gửi mail ngầm
def send_email_background(subject, message, recipient_list):
    # Lọc bỏ các email trống
    valid_recipients = [email for email in recipient_list if email]
    if not valid_recipients:
        return
        
    def run():
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=valid_recipients,
            fail_silently=True,
        )
    threading.Thread(target=run).start()


# 1. BẮT SỰ KIỆN: KHI CÓ USER MỚI ĐĂNG KÝ
@receiver(post_save, sender=User)
def create_welcome_notification(sender, instance, created, **kwargs):
    if created:
        # Tạo thông báo trên quả chuông
        Notification.objects.create(
            recipient=instance,
            notification_type='WELCOME'
        )
        # Gửi Email chào mừng nếu có địa chỉ email
        if instance.email:
            send_email_background(
                subject="Chào mừng đến với EduForum",
                message="Chúc mừng bạn đã tạo tài khoản thành công!",
                recipient_list=[instance.email]
            )


# 2. BẮT SỰ KIỆN: KHI CÓ NGƯỜI BÌNH LUẬN MỚI
@receiver(post_save, sender=Comment)
def create_comment_notification(sender, instance, created, **kwargs):
    if created:
        actor = instance.author
        post = instance.post

        # Phân loại: Đây là reply cho Post hay reply cho Comment khác?
        if instance.parent is None:
            # Nếu trả lời thẳng vào Post -> Báo cho tác giả Post
            recipient = post.author
            notification_type = 'REPLY_POST'
            subject = f"EduForum - {actor.username} đã trả lời câu hỏi của bạn"
        else:
            # Nếu phản hồi 1 comment -> Báo cho tác giả của Comment gốc
            recipient = instance.parent.author
            notification_type = 'REPLY_COMMENT'
            subject = f"EduForum - {actor.username} đã phản hồi bình luận của bạn"

        # Logic chống "Tự kỷ": Nếu tự bình luận vào bài của mình thì không thông báo
        if actor != recipient:
            # Tạo thông báo trên quả chuông
            Notification.objects.create(
                recipient=recipient,
                actor=actor,
                notification_type=notification_type,
                target_post_id=post.id
            )
            # Gửi Email
            if recipient.email:
                send_email_background(
                    subject=subject,
                    message=f"Vào xem ngay: http://localhost:8000/forum/post/{post.id}",
                    recipient_list=[recipient.email]
                )


# 3. BẮT SỰ KIỆN: KHI CÓ BÀI ĐĂNG MỚI → Thông báo cho Admin & Giảng viên
@receiver(post_save, sender=Post)
def notify_new_post_created(sender, instance, created, **kwargs):
    if created:
        author = instance.author

        # Lấy danh sách Admin và Giảng viên đã xác thực (trừ chính tác giả)
        staff_users = User.objects.filter(
            role__in=['ADMIN', 'LECTURER'],
            is_verified=True,
            is_active=True,
        ).exclude(pk=author.pk)

        staff_emails = list(staff_users.values_list('email', flat=True))

        # Tạo thông báo trên quả chuông cho từng Admin/Giảng viên
        notifications = [
            Notification(
                recipient=user,
                actor=author,
                notification_type='NEW_POST',
                target_post_id=instance.id,
            )
            for user in staff_users
        ]
        Notification.objects.bulk_create(notifications)

        # Gửi email thông báo chạy ngầm
        if staff_emails:
            send_email_background(
                subject=f"EduForum - Câu hỏi mới: {instance.title}",
                message=(
                    f"Sinh viên {author.username} vừa đăng một câu hỏi mới.\n"
                    f"Xem ngay tại: http://localhost:8000/forum/post/{instance.id}"
                ),
                recipient_list=staff_emails,
            )
