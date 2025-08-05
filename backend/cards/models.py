from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from datetime import datetime, timedelta
from django.utils import timezone
import string
import random
import hashlib

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
    
    # Card category based on credit limits
    CARD_CATEGORY_CHOICES = [
        ('classic', 'Classic'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
        ('diamond', 'Diamond'),
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
    card_category = models.CharField(max_length=20, choices=CARD_CATEGORY_CHOICES, default='classic')
    card_name = models.CharField(max_length=100, help_text="Custom name for the card")
    status = models.CharField(max_length=20, choices=CARD_STATUS_CHOICES, default='pending')
    
    # Financial Information
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00)
    
    @staticmethod
    def generate_card_number(card_type='personal'):
        """Generate a valid credit card number using Luhn algorithm"""
        # MII (Major Industry Identifier) based on card type
        mii_map = {
            'personal': '4',      # Visa
            'business': '5',      # Mastercard
            'travel': '3',        # American Express (Travel & Entertainment)
            'shopping': '6',      # Discover (Merchandising)
        }
        
        # Start with MII
        mii = mii_map.get(card_type, '4')
        
        # Generate IIN (Issuer Identification Number) - 5 digits
        # Using a fictional bank identifier: 53280
        iin = '53280'
        
        # Generate account number (9 digits for 16-digit card)
        account_digits = 9
        account_number = ''.join([str(random.randint(0, 9)) for _ in range(account_digits)])
        
        # Combine MII + IIN + Account Number (15 digits total)
        partial_number = mii + iin + account_number
        
        # Calculate check digit using Luhn algorithm
        check_digit = CarteVirtuelle.calculate_luhn_check_digit(partial_number)
        
        return partial_number + str(check_digit)
    
    @staticmethod
    def calculate_luhn_check_digit(partial_number):
        """Calculate Luhn check digit for credit card validation"""
        def luhn_checksum(card_num):
            def digits_of(n):
                return [int(d) for d in str(n)]
            digits = digits_of(card_num)
            odd_digits = digits[-1::-2]
            even_digits = digits[-2::-2]
            checksum = sum(odd_digits)
            for d in even_digits:
                checksum += sum(digits_of(d*2))
            return checksum % 10
        
        for i in range(10):
            if luhn_checksum(partial_number + str(i)) == 0:
                return i
        return 0
    
    @staticmethod
    def generate_cvv(card_number, expiry_date):
        """Generate CVV using card number and expiry date"""
        # Create a hash using card number and expiry date
        hash_input = f"{card_number}{expiry_date.strftime('%m%y')}"
        hash_object = hashlib.md5(hash_input.encode())
        hash_hex = hash_object.hexdigest()
        
        # Take first 3 characters and convert to numbers
        cvv = str(int(hash_hex[:6], 16))[-3:]
        
        # Ensure it's exactly 3 digits
        return cvv.zfill(3)
    
    @staticmethod
    def determine_card_category(credit_limit):
        """Determine card category based on credit limit"""
        if credit_limit >= 10000:
            return 'diamond'
        elif credit_limit >= 5000:
            return 'platinum'
        elif credit_limit >= 2000:
            return 'gold'
        else:
            return 'classic'
    
    @staticmethod
    def calculate_expiry_date(card_category, creation_date=None):
        """Calculate expiry date based on card category"""
        if creation_date is None:
            creation_date = timezone.now().date()
            
        expiry_years = {
            'classic': 3,
            'gold': 4,
            'platinum': 5,
            'diamond': 5,
        }
        
        years_to_add = expiry_years.get(card_category, 3)
        expiry_date = creation_date.replace(year=creation_date.year + years_to_add)
        
        return expiry_date
    
    @classmethod
    def create_from_request(cls, card_request, approved_by):
        """Create a new card from an approved card request"""
        # Determine card category based on requested limit
        card_category = cls.determine_card_category(card_request.requested_limit)
        
        # Generate card number
        card_number = cls.generate_card_number(card_request.card_type)
        
        # Calculate expiry date
        creation_date = timezone.now().date()
        expiry_date = cls.calculate_expiry_date(card_category, creation_date)
        
        # Generate CVV
        cvv = cls.generate_cvv(card_number, expiry_date)
        
        # Create the card
        card = cls.objects.create(
            numeroCart=card_number,
            cvv2=cvv,
            dateExpiration=expiry_date,
            utilisateur=card_request.user,
            card_type=card_request.card_type,
            card_category=card_category,
            card_name=card_request.card_name,
            status='active',  # Automatically activate approved cards
            credit_limit=card_request.requested_limit,
            balance=0.00
        )
        
        return card
    
    # Methods from UML
    def activerCarte(self):
        """Activate the card"""
        if self.status in ['pending', 'blocked']:
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
