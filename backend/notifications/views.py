from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.utils import timezone
from .models import Notification, NotificationPreference
from .serializers import (
    NotificationSerializer, 
    NotificationPreferenceSerializer,
    NotificationMarkReadSerializer
)
from .services import NotificationService


class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class UserNotificationsView(generics.ListAPIView):
    """Liste des notifications de l'utilisateur"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NotificationPagination
    
    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.filter(user=user)
        
        # Filtres optionnels
        is_read = self.request.query_params.get('is_read')
        notification_type = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        important_only = self.request.query_params.get('important')
        
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        if category:
            queryset = queryset.filter(category=category)
        
        if important_only:
            queryset = queryset.filter(is_important=True)
        
        return queryset.order_by('-created_at')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_stats(request):
    """Statistiques des notifications de l'utilisateur"""
    user = request.user
    
    total_count = Notification.objects.filter(user=user).count()
    unread_count = Notification.objects.filter(user=user, is_read=False).count()
    important_unread = Notification.objects.filter(
        user=user, is_read=False, is_important=True
    ).count()
    
    # Notifications par type
    type_counts = {}
    for choice in Notification.TYPE_CHOICES:
        type_key = choice[0]
        count = Notification.objects.filter(
            user=user, notification_type=type_key, is_read=False
        ).count()
        type_counts[type_key] = count
    
    return Response({
        'total_count': total_count,
        'unread_count': unread_count,
        'important_unread': important_unread,
        'type_counts': type_counts,
        'has_notifications': unread_count > 0
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notifications_read(request):
    """Marquer des notifications comme lues"""
    serializer = NotificationMarkReadSerializer(data=request.data)
    
    if serializer.is_valid():
        notification_ids = serializer.validated_data.get('notification_ids')
        user = request.user
        
        if notification_ids:
            # Marquer des notifications spécifiques
            updated_count = Notification.objects.filter(
                id__in=notification_ids,
                user=user,
                is_read=False
            ).update(is_read=True, read_at=timezone.now())
        else:
            # Marquer toutes les notifications comme lues
            updated_count = NotificationService.mark_all_as_read(user)
        
        return Response({
            'message': f'{updated_count} notification(s) marquée(s) comme lue(s)',
            'updated_count': updated_count
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_notification(request, notification_id):
    """Supprimer une notification"""
    try:
        notification = Notification.objects.get(
            id=notification_id,
            user=request.user
        )
        notification.delete()
        
        return Response({
            'message': 'Notification supprimée avec succès'
        })
    
    except Notification.DoesNotExist:
        return Response({
            'error': 'Notification non trouvée'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def clear_all_notifications(request):
    """Supprimer toutes les notifications de l'utilisateur"""
    deleted_count = Notification.objects.filter(user=request.user).count()
    Notification.objects.filter(user=request.user).delete()
    
    return Response({
        'message': f'{deleted_count} notification(s) supprimée(s)',
        'deleted_count': deleted_count
    })


class NotificationPreferencesView(generics.RetrieveUpdateAPIView):
    """Gérer les préférences de notification de l'utilisateur"""
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        preferences, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preferences


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recent_notifications(request):
    """Obtenir les notifications récentes (pour le badge/dropdown)"""
    user = request.user
    limit = int(request.query_params.get('limit', 10))
    
    notifications = Notification.objects.filter(
        user=user
    ).order_by('-created_at')[:limit]
    
    serializer = NotificationSerializer(notifications, many=True)
    unread_count = NotificationService.get_unread_count(user)
    
    return Response({
        'notifications': serializer.data,
        'unread_count': unread_count,
        'has_more': Notification.objects.filter(user=user).count() > limit
    })


# Notifications temps réel (polling endpoint)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_polling(request):
    """Endpoint pour le polling des nouvelles notifications"""
    user = request.user
    last_check = request.query_params.get('last_check')
    
    queryset = Notification.objects.filter(user=user)
    
    if last_check:
        try:
            from datetime import datetime
            last_check_time = datetime.fromisoformat(last_check.replace('Z', '+00:00'))
            queryset = queryset.filter(created_at__gt=last_check_time)
        except ValueError:
            pass
    
    new_notifications = queryset.order_by('-created_at')[:10]
    serializer = NotificationSerializer(new_notifications, many=True)
    
    return Response({
        'new_notifications': serializer.data,
        'total_unread': NotificationService.get_unread_count(user),
        'timestamp': timezone.now().isoformat()
    })
