# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
import uuid

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

class Memory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    uploaded_by = models.CharField(max_length=100)  # Display name, not username
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='memories')
    tags = models.JSONField(default=list, blank=True)  # Store tags as JSON array
    lat = models.DecimalField(max_digits=10, decimal_places=8)
    lng = models.DecimalField(max_digits=11, decimal_places=8)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    file_name = models.CharField(max_length=255, blank=True, null=True)
    file_content = models.TextField(blank=True, null=True)  # For demo purposes, in production use FileField
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['lat', 'lng']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f"{self.title} by {self.uploaded_by}"

    def get_tags_list(self):
        """Return tags as a list for easier processing"""
        if isinstance(self.tags, list):
            return self.tags
        return []

    def add_tag(self, tag):
        """Add a single tag to the memory"""
        if not isinstance(self.tags, list):
            self.tags = []
        if tag not in self.tags:
            self.tags.append(tag)

    def remove_tag(self, tag):
        """Remove a single tag from the memory"""
        if isinstance(self.tags, list) and tag in self.tags:
            self.tags.remove(tag)