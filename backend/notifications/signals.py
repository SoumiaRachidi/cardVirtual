from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from cards.models import CardRequest, CarteVirtuelle
from .services import NotificationService


@receiver(post_save, sender=CardRequest)
def handle_card_request_created(sender, instance, created, **kwargs):
    """Signal lors de la création d'une nouvelle demande de carte"""
    if created:
        # Notifier les administrateurs
        NotificationService.notify_admin_new_request(instance)


@receiver(pre_save, sender=CardRequest)
def handle_card_request_status_change(sender, instance, **kwargs):
    """Signal lors du changement de statut d'une demande"""
    if instance.pk:  # Si l'instance existe déjà
        try:
            old_instance = CardRequest.objects.get(pk=instance.pk)
            
            # Si le statut a changé
            if old_instance.status != instance.status:
                if instance.status == 'approved':
                    NotificationService.notify_card_approval(instance.user, instance)
                elif instance.status == 'rejected':
                    reason = getattr(instance, 'admin_comments', '')
                    NotificationService.notify_card_rejection(instance.user, instance, reason)
        
        except CardRequest.DoesNotExist:
            pass


@receiver(post_save, sender=CarteVirtuelle)
def handle_card_created(sender, instance, created, **kwargs):
    """Signal lors de la création d'une carte virtuelle"""
    if created:
        NotificationService.notify_card_creation(instance.utilisateur, instance)


@receiver(pre_save, sender=CarteVirtuelle)
def handle_card_status_change(sender, instance, **kwargs):
    """Signal lors du changement de statut d'une carte"""
    if instance.pk:  # Si l'instance existe déjà
        try:
            old_instance = CarteVirtuelle.objects.get(pk=instance.pk)
            
            # Si le statut a changé
            if old_instance.status != instance.status:
                if instance.status == 'active' and old_instance.status != 'active':
                    NotificationService.notify_card_activation(instance.utilisateur, instance)
                elif instance.status == 'blocked' and old_instance.status != 'blocked':
                    NotificationService.notify_card_deactivation(instance.utilisateur, instance)
        
        except CarteVirtuelle.DoesNotExist:
            pass
