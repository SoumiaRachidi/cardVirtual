from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Notification(models.Model):
    TYPE_CHOICES = [
        ('success', 'Success'),
        ('error', 'Error'),
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('alert', 'Alert'),
    ]
    
    CATEGORY_CHOICES = [
        ('card_creation', 'Card Creation'),
        ('card_approval', 'Card Approval'),
        ('card_rejection', 'Card Rejection'),
        ('card_activation', 'Card Activation'),
        ('card_deactivation', 'Card Deactivation'),
        ('document_upload', 'Document Upload'),
        ('new_request', 'New Request'),
        ('request_approved', 'Request Approved'),
        ('request_rejected', 'Request Rejected'),
        ('system', 'System'),
        ('security', 'Security'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    is_read = models.BooleanField(default=False)
    is_important = models.BooleanField(default=False)
    
    # Données contextuelles optionnelles
    related_card_id = models.IntegerField(null=True, blank=True)
    related_request_id = models.IntegerField(null=True, blank=True)
    action_url = models.URLField(null=True, blank=True, help_text="URL d'action pour la notification")
    
    created_at = models.DateTimeField(default=timezone.now)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def mark_as_read(self):
        """Marquer la notification comme lue"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
    
    def get_icon(self):
        """Retourne l'icône appropriée selon le type"""
        icon_map = {
            'success': '✅',
            'error': '❌',
            'info': 'ℹ️',
            'warning': '⚠️',
            'alert': '🚨',
        }
        return icon_map.get(self.notification_type, 'ℹ️')
    
    def get_color_class(self):
        """Retourne la classe CSS pour la couleur"""
        color_map = {
            'success': 'notification-success',
            'error': 'notification-error',
            'info': 'notification-info',
            'warning': 'notification-warning',
            'alert': 'notification-alert',
        }
        return color_map.get(self.notification_type, 'notification-info')


class NotificationPreference(models.Model):
    """Préférences de notification par utilisateur"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Préférences par catégorie
    card_creation_enabled = models.BooleanField(default=True)
    card_approval_enabled = models.BooleanField(default=True)
    card_rejection_enabled = models.BooleanField(default=True)
    card_activation_enabled = models.BooleanField(default=True)
    card_deactivation_enabled = models.BooleanField(default=True)
    document_upload_enabled = models.BooleanField(default=True)
    new_request_enabled = models.BooleanField(default=True)
    system_enabled = models.BooleanField(default=True)
    security_enabled = models.BooleanField(default=True)
    
    # Préférences générales
    email_notifications = models.BooleanField(default=False)
    browser_notifications = models.BooleanField(default=True)
    sound_enabled = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Preferences for {self.user.username}"
