from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    icon = serializers.CharField(source='get_icon', read_only=True)
    color_class = serializers.CharField(source='get_color_class', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'category',
            'is_read', 'is_important', 'related_card_id', 'related_request_id',
            'action_url', 'created_at', 'read_at', 'icon', 'color_class', 'time_ago'
        ]
        read_only_fields = ['created_at', 'read_at']
    
    def get_time_ago(self, obj):
        """Calculer le temps écoulé depuis la création"""
        from django.utils import timezone
        from datetime import datetime, timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"Il y a {diff.days} jour{'s' if diff.days > 1 else ''}"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"Il y a {hours} heure{'s' if hours > 1 else ''}"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"Il y a {minutes} minute{'s' if minutes > 1 else ''}"
        else:
            return "À l'instant"


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'card_creation_enabled', 'card_approval_enabled', 'card_rejection_enabled',
            'card_activation_enabled', 'card_deactivation_enabled', 'document_upload_enabled',
            'new_request_enabled', 'system_enabled', 'security_enabled',
            'email_notifications', 'browser_notifications', 'sound_enabled'
        ]


class NotificationMarkReadSerializer(serializers.Serializer):
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="IDs des notifications à marquer comme lues. Si vide, toutes les notifications seront marquées."
    )
