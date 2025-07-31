from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from datetime import datetime, timedelta
import string
import random

class CarteVirtuelle(models.Model):
    CARD_STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('active', 'Active'),
        ('blocked', 'Blocked'),
        ('expired', 'Expired'),
        ('rejected', 'Rejected'),
    ]
    
    CARD_TYPE_CHOICES = [
        ('shopping', 'Shopping Card'),
        ('travel', 'Travel Card'),
        ('business', 'Business Card'),
        ('personal', 'Personal Card'),
    ]

    # Basic Information
    id = models.AutoField(primary_key=True)
    numeroCart = models.CharField(max_length=16, unique=True, blank=True)
    cvv2 = models.CharField(max_length=3, blank=True)
    dateExpiration = models.DateField()
    dateCreation = models.DateTimeField(auto_now_add=True)
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cartes_virtuelles')
    
    # Card Details
    card_type = models.CharField(max_length=20, choices=CARD_TYPE_CHOICES, default='personal')
    card_name = models.CharField(max_length=100, help_text="Custom name for the card")
    status = models.CharField(max_length=20, choices=CARD_STATUS_CHOICES, default='pending')
    
    # Financial Information
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00)
    
    # Methods from UML
    def activerCarte(self):
        """Activate the card"""
        if self.status == 'pending':
            self.status = 'active'
            self.save()
            return True
        return False
    
    def desactiverCarte(self):
        """Deactivate/Block the card"""
        self.status = 'blocked'
        self.save()
        return True
    
    def supprimerCarte(self):
        """Soft delete - mark as expired"""
        self.status = 'expired'
        self.save()
        return True
    
    def rechercherCarte(self, criteria):
        """Search functionality - placeholder"""
        pass
    
    def validerCarte(self):
        """Validate card details"""
        return len(self.numeroCart) == 16 and len(self.cvv2) == 3
    
    def genererNumeroCart(self):
        """Generate random card number"""
        return ''.join(random.choices(string.digits, k=16))
    
    def calculerDateExpiration(self):
        """Calculate expiration date (3 years from creation)"""
        return datetime.now().date() + timedelta(days=365*3)
    
    def genererCVV(self):
        """Generate random CVV"""
        return ''.join(random.choices(string.digits, k=3))
    
    def validerTransaction(self, montant):
        """Validate if transaction is possible"""
        return self.status == 'active' and self.balance >= montant
    
    def save(self, *args, **kwargs):
        # Generate card details if not provided
        if not self.numeroCart:
            self.numeroCart = self.genererNumeroCart()
        if not self.cvv2:
            self.cvv2 = self.genererCVV()
        if not self.dateExpiration:
            self.dateExpiration = self.calculerDateExpiration()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.card_name} - {self.numeroCart[-4:]}"
    
    class Meta:
        verbose_name = "Carte Virtuelle"
        verbose_name_plural = "Cartes Virtuelles"
        ordering = ['-dateCreation']


class CardRequest(models.Model):
    """Model to handle card creation requests that need admin approval"""
    
    REQUEST_STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    card_type = models.CharField(max_length=20, choices=CarteVirtuelle.CARD_TYPE_CHOICES)
    card_name = models.CharField(max_length=100)
    requested_limit = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00)
    
    # User validation information
    age_verified = models.BooleanField(default=False)
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    emergency_contact = models.CharField(max_length=20, blank=True)
    profession = models.CharField(max_length=100, blank=True)
    monthly_income = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    identity_document = models.FileField(upload_to='documents/', null=True, blank=True)
    income_proof = models.FileField(upload_to='documents/', null=True, blank=True)
    
    # Request details
    reason = models.TextField(help_text="Reason for requesting this card")
    status = models.CharField(max_length=20, choices=REQUEST_STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_requests'
    )
    admin_comments = models.TextField(blank=True)
    
    # Generated card (if approved)
    approved_card = models.OneToOneField(
        CarteVirtuelle, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    
    def __str__(self):
        return f"{self.user.username} - {self.card_type} Request"
    
    class Meta:
        ordering = ['-created_at']
