from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class CustomUser(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    """
    USER_TYPE_CHOICES = [
        ('user', 'Regular User'),
        ('admin', 'Administrator'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('pending', 'Pending'),
    ]
    
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='user')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    date_created = models.DateTimeField(default=timezone.now)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    
    # Additional fields for card management
    total_cards = models.IntegerField(default=0)
    total_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'custom_users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_admin(self):
        return self.user_type == 'admin' or self.is_superuser
    
    def update_card_stats(self):
        """Update user's card statistics"""
        # This will be implemented when we create the Cards model
        pass

class UserActivity(models.Model):
    """
    Model to track user activities and login history
    """
    ACTIVITY_TYPES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('card_created', 'Card Created'),
        ('card_deleted', 'Card Deleted'),
        ('profile_updated', 'Profile Updated'),
        ('password_changed', 'Password Changed'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'user_activities'
        ordering = ['-timestamp']
        verbose_name = 'User Activity'
        verbose_name_plural = 'User Activities'
    
    def __str__(self):
        return f"{self.user.email} - {self.activity_type} at {self.timestamp}"
