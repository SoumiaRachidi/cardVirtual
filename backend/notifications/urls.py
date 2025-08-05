from django.urls import path
from . import views

urlpatterns = [
    # Liste et gestion des notifications
    path('', views.UserNotificationsView.as_view(), name='user-notifications'),
    path('stats/', views.notification_stats, name='notification-stats'),
    path('recent/', views.recent_notifications, name='recent-notifications'),
    path('polling/', views.notification_polling, name='notification-polling'),
    
    # Actions sur les notifications
    path('mark-read/', views.mark_notifications_read, name='mark-notifications-read'),
    path('<int:notification_id>/delete/', views.delete_notification, name='delete-notification'),
    path('clear-all/', views.clear_all_notifications, name='clear-all-notifications'),
    
    # Préférences
    path('preferences/', views.NotificationPreferencesView.as_view(), name='notification-preferences'),
]
