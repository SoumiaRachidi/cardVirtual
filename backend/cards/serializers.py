from rest_framework import serializers
from .models import CarteVirtuelle, CardRequest
from users.serializers import UserProfileSerializer
from datetime import date, timedelta

class CarteVirtuelleSerializer(serializers.ModelSerializer):
    utilisateur_name = serializers.CharField(source='utilisateur.full_name', read_only=True)
    masked_numero = serializers.SerializerMethodField()
    
    class Meta:
        model = CarteVirtuelle
        fields = ['id', 'numeroCart', 'masked_numero', 'cvv2', 'dateExpiration', 
                 'dateCreation', 'utilisateur', 'utilisateur_name', 'card_type', 
                 'card_name', 'status', 'balance', 'credit_limit']
        read_only_fields = ['id', 'numeroCart', 'cvv2', 'dateExpiration', 'dateCreation']
    
    def get_masked_numero(self, obj):
        """Return masked card number (only last 4 digits visible)"""
        if obj.numeroCart:
            return f"**** **** **** {obj.numeroCart[-4:]}"
        return "****"

class CardRequestSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()
    
    class Meta:
        model = CardRequest
        fields = ['id', 'user', 'user_details', 'card_type', 
                 'card_name', 'requested_limit', 'age_verified', 'date_of_birth',
                 'phone_number', 'emergency_contact', 'profession', 'monthly_income',
                 'identity_document', 'income_proof', 'reason', 'status', 
                 'created_at', 'reviewed_at', 'reviewed_by', 'admin_comments', 'approved_card']
        read_only_fields = ['id', 'created_at', 'reviewed_at', 'reviewed_by', 'approved_card']
    
    def get_user_details(self, obj):
        """Get user details for display"""
        return {
            'id': obj.user.id,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'email': obj.user.email,
            'phone_number': getattr(obj.user, 'phone_number', ''),
        }
    
    def validate(self, attrs):
        """Validate card request data"""
        user = self.context['request'].user
        
        # Check if user already has a pending request for this card type
        existing_request = CardRequest.objects.filter(
            user=user,
            card_type=attrs['card_type'],
            status='pending'
        ).exists()
        
        if existing_request:
            raise serializers.ValidationError(
                f"You already have a pending request for a {attrs['card_type']} card."
            )
        
        # Validate requested limit
        if attrs['requested_limit'] > 10000:
            raise serializers.ValidationError(
                "Requested credit limit cannot exceed $10,000."
            )
        
        return attrs

class CardRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating card requests with age validation"""
    
    class Meta:
        model = CardRequest
        fields = ['card_type', 'card_name', 'requested_limit', 'date_of_birth',
                 'phone_number', 'emergency_contact', 'profession', 'monthly_income',
                 'identity_document', 'income_proof', 'reason']
    
    def validate_date_of_birth(self, value):
        """Validate that user is at least 18 years old"""
        if not value:
            raise serializers.ValidationError("Date of birth is required.")
            
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        
        if age < 18:
            raise serializers.ValidationError(
                "You must be at least 18 years old to request a virtual card."
            )
        
        return value
    
    def validate_requested_limit(self, value):
        """Validate requested limit"""
        if value < 100:
            raise serializers.ValidationError("Minimum credit limit is $100.")
        if value > 10000:
            raise serializers.ValidationError("Maximum credit limit is $10,000.")
        return value
    
    def validate_reason(self, value):
        """Validate reason length"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Please provide a detailed reason (minimum 10 characters)."
            )
        return value
    
    def create(self, validated_data):
        """Create card request with age verification"""
        date_of_birth = validated_data.get('date_of_birth')
        user = self.context['request'].user
        
        # Calculate age and set age_verified
        today = date.today()
        age = today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))
        
        validated_data['age_verified'] = (age >= 18)
        validated_data['user'] = user
        
        return super().create(validated_data)

class CardApprovalSerializer(serializers.ModelSerializer):
    """Serializer for admin to approve/reject card requests"""
    
    class Meta:
        model = CardRequest
        fields = ['status', 'admin_comments']
    
    def validate_status(self, value):
        """Ensure status is either approved or rejected"""
        if value not in ['approved', 'rejected']:
            raise serializers.ValidationError("Status must be either 'approved' or 'rejected'")
        return value
    
    def update(self, instance, validated_data):
        """Update request and create card if approved"""
        from django.utils import timezone
        
        instance.status = validated_data.get('status', instance.status)
        instance.admin_comments = validated_data.get('admin_comments', instance.admin_comments)
        instance.reviewed_at = timezone.now()
        instance.reviewed_by = self.context['request'].user
        
        # If approved, create the actual card
        if instance.status == 'approved' and not instance.approved_card:
            card = CarteVirtuelle.objects.create(
                utilisateur=instance.user,
                card_type=instance.card_type,
                card_name=instance.card_name,
                credit_limit=instance.requested_limit,
                status='active'  # Automatically activate approved cards
            )
            instance.approved_card = card
        
        instance.save()
        return instance
