from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from .models import CustomUser, UserActivity

@receiver(post_save, sender=CustomUser)
def user_created_handler(sender, instance, created, **kwargs):
    """
    Handle user creation activities
    """
    if created:
        UserActivity.objects.create(
            user=instance,
            activity_type='login',
            description='User account created'
        )

@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    """
    Handle user login signal
    """
    # This is handled in the login view, but we can add additional logic here
    pass

@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    """
    Handle user logout signal
    """
    # This is handled in the logout view, but we can add additional logic here
    pass
