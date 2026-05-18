from django.db import models
from django.conf import settings


class Comment(models.Model):
    post = models.ForeignKey(
        'posts.Post',
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    content = models.TextField()
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='replies'
    )
    is_accepted = models.BooleanField(default=False)
    accepted_by_author = models.BooleanField(default=False)
    accepted_by_lecturer = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_accepted', '-created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.title}"

class CommentVote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comment_votes')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='votes')
    value = models.SmallIntegerField() # 1: Up, -1: Down
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'comment')
