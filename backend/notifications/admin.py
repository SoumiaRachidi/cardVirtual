from django.contrib import admin
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'title', 'notification_type', 'category', 
        'is_read', 'is_important', 'created_at'
    ]
    list_filter = [
        'notification_type', 'category', 'is_read', 'is_important', 'created_at'
    ]
    search_fields = ['user__username', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']
    
    fieldsets = (
        ('Information principale', {
            'fields': ('user', 'title', 'message')
        }),
        ('Classification', {
            'fields': ('notification_type', 'category', 'is_important')
        }),
        ('État', {
            'fields': ('is_read', 'read_at')
        }),
        ('Références', {
            'fields': ('related_card_id', 'related_request_id', 'action_url')
        }),
        ('Dates', {
            'fields': ('created_at',)
        }),
    )
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} notification(s) marquée(s) comme lue(s).')
    
    mark_as_read.short_description = "Marquer comme lues"
    
    actions = ['mark_as_read']


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'email_notifications', 'browser_notifications', 
        'sound_enabled', 'updated_at'
    ]
    list_filter = ['email_notifications', 'browser_notifications', 'sound_enabled']
    search_fields = ['user__username']
