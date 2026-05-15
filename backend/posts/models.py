from django.db import models
from django.conf import settings

class Post(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='posts'
    )
    
    # Kết nối sang App tags bằng String Reference: 'app_label.ModelName'
    tags = models.ManyToManyField('tags.Tag', related_name='posts', blank=True)
    
    view_count = models.PositiveIntegerField(default=0)
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class PostVote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='post_votes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='votes')
    value = models.SmallIntegerField() # 1: Up, -1: Down
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')