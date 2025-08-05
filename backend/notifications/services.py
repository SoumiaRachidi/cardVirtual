from .models import Notification, NotificationPreference
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

User = get_user_model()

class NotificationService:
    """Service centralisé pour la gestion des notifications"""
    
    @staticmethod
    def create_notification(user, title, message, notification_type, category, 
                          related_card_id=None, related_request_id=None, 
                          action_url=None, is_important=False):
        """Créer une nouvelle notification"""
        
        # Vérifier les préférences utilisateur
        preferences, created = NotificationPreference.objects.get_or_create(user=user)
        
        # Vérifier si cette catégorie est activée
        category_enabled = getattr(preferences, f"{category}_enabled", True)
        if not category_enabled:
            return None
        
        with transaction.atomic():
            notification = Notification.objects.create(
                user=user,
                title=title,
                message=message,
                notification_type=notification_type,
                category=category,
                related_card_id=related_card_id,
                related_request_id=related_request_id,
                action_url=action_url,
                is_important=is_important
            )
        
        return notification
    
    @staticmethod
    def notify_card_creation(user, card):
        """Notification lors de la création d'une carte"""
        return NotificationService.create_notification(
            user=user,
            title="🎉 Nouvelle carte virtuelle créée",
            message=f"Votre carte virtuelle '{card.card_name}' a été créée avec succès.",
            notification_type="success",
            category="card_creation",
            related_card_id=card.id,
            action_url="/user-dashboard"
        )
    
    @staticmethod
    def notify_card_approval(user, card):
        """Notification lors de l'approbation d'une carte"""
        return NotificationService.create_notification(
            user=user,
            title="✅ Demande de carte approuvée",
            message=f"Félicitations ! Votre demande pour la carte '{card.card_name}' a été approuvée. Votre carte virtuelle est maintenant active.",
            notification_type="success",
            category="card_approval",
            related_card_id=card.id,
            action_url="/user-dashboard",
            is_important=True
        )
    
    @staticmethod
    def notify_card_rejection(user, request, reason=""):
        """Notification lors du rejet d'une carte"""
        message = f"Votre demande pour la carte '{request.card_name}' a été rejetée."
        if reason:
            message += f" Raison: {reason}"
        
        return NotificationService.create_notification(
            user=user,
            title="❌ Demande de carte rejetée",
            message=message,
            notification_type="error",
            category="card_rejection",
            related_request_id=request.id,
            action_url="/user-dashboard",
            is_important=True
        )
    
    @staticmethod
    def notify_card_activation(user, card):
        """Notification lors de l'activation d'une carte"""
        return NotificationService.create_notification(
            user=user,
            title="🟢 Carte activée",
            message=f"Votre carte '{card.card_name}' a été activée avec succès.",
            notification_type="success",
            category="card_activation",
            related_card_id=card.id,
            action_url="/user-dashboard"
        )
    
    @staticmethod
    def notify_card_deactivation(user, card):
        """Notification lors de la désactivation d'une carte"""
        return NotificationService.create_notification(
            user=user,
            title="🔴 Carte désactivée",
            message=f"Votre carte '{card.card_name}' a été désactivée.",
            notification_type="warning",
            category="card_deactivation",
            related_card_id=card.id,
            action_url="/user-dashboard"
        )
    
    @staticmethod
    def notify_document_upload(user, document_type):
        """Notification lors du téléchargement de documents"""
        return NotificationService.create_notification(
            user=user,
            title="📄 Document téléchargé",
            message=f"Votre {document_type} a été téléchargé avec succès.",
            notification_type="info",
            category="document_upload",
            action_url="/user-dashboard"
        )
    
    # Notifications pour les administrateurs
    
    @staticmethod
    def notify_admin_new_request(request):
        """Notifier les admins d'une nouvelle demande"""
        admins = User.objects.filter(user_type='admin')
        
        notifications = []
        for admin in admins:
            notification = NotificationService.create_notification(
                user=admin,
                title="🆕 Nouvelle demande de carte",
                message=f"Une nouvelle demande de carte '{request.card_name}' a été soumise par {request.user.get_full_name() or request.user.username}.",
                notification_type="info",
                category="new_request",
                related_request_id=request.id,
                action_url="/card-management",
                is_important=True
            )
            if notification:
                notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def notify_admin_card_action(admin_user, action, card, user):
        """Notifier les admins d'une action sur une carte"""
        action_messages = {
            'approved': f"La demande de carte '{card.card_name}' de {user.get_full_name() or user.username} a été approuvée.",
            'rejected': f"La demande de carte '{card.card_name}' de {user.get_full_name() or user.username} a été rejetée.",
            'activated': f"La carte '{card.card_name}' de {user.get_full_name() or user.username} a été activée.",
            'deactivated': f"La carte '{card.card_name}' de {user.get_full_name() or user.username} a été désactivée."
        }
        
        return NotificationService.create_notification(
            user=admin_user,
            title=f"🔧 Action administrative: {action}",
            message=action_messages.get(action, f"Action {action} effectuée sur la carte."),
            notification_type="info",
            category="system",
            related_card_id=card.id,
            action_url="/card-management"
        )
    
    @staticmethod
    def notify_admin_document_received(admin_user, user, document_type):
        """Notifier les admins de la réception de documents"""
        return NotificationService.create_notification(
            user=admin_user,
            title="📋 Nouveau document reçu",
            message=f"{user.get_full_name() or user.username} a téléchargé un {document_type}.",
            notification_type="info",
            category="document_upload",
            action_url="/card-management"
        )
    
    @staticmethod
    def get_unread_count(user):
        """Obtenir le nombre de notifications non lues"""
        return Notification.objects.filter(user=user, is_read=False).count()
    
    @staticmethod
    def mark_all_as_read(user):
        """Marquer toutes les notifications comme lues"""
        return Notification.objects.filter(user=user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
