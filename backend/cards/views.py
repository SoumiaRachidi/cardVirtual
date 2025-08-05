from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import CarteVirtuelle, CardRequest
from .serializers import (
    CarteVirtuelleSerializer, 
    CardRequestSerializer, 
    CardRequestCreateSerializer,
    CardApprovalSerializer
)
from .permissions import IsAdminUser, IsOwnerOrAdmin, IsOwnerOnly

# Vue de test pour l'authentification
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def test_auth(request):
    """Test endpoint to verify authentication is working"""
    return Response({
        'message': 'Authentication working!',
        'user': request.user.username,
        'user_id': request.user.id,
        'token': str(request.auth) if request.auth else 'No token'
    })

class UserCardsListView(generics.ListAPIView):
    """List all cards for the authenticated user"""
    serializer_class = CarteVirtuelleSerializer
    permission_classes = [IsOwnerOrAdmin]
    
    def get_queryset(self):
        return CarteVirtuelle.objects.filter(utilisateur=self.request.user).exclude(status='expired')

class CardDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a specific card"""
    serializer_class = CarteVirtuelleSerializer
    permission_classes = [IsOwnerOrAdmin]
    
    def get_queryset(self):
        return CarteVirtuelle.objects.filter(utilisateur=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete - mark as expired instead of actual deletion"""
        card = self.get_object()
        card.supprimerCarte()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsOwnerOrAdmin])
def activate_card(request, card_id):
    """Activate a card"""
    try:
        card = get_object_or_404(CarteVirtuelle, id=card_id, utilisateur=request.user)
        
        if card.activerCarte():
            return Response({
                'message': 'Card activated successfully',
                'card': CarteVirtuelleSerializer(card).data
            })
        else:
            # Provide specific error message based on card status
            status_messages = {
                'active': 'Card is already active',
                'expired': 'Cannot activate an expired card',
                'deleted': 'Cannot activate a deleted card'
            }
            error_message = status_messages.get(card.status, f'Card cannot be activated. Current status: {card.status}')
            
            return Response({
                'error': error_message,
                'card_status': card.status
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'error': f'Error activating card: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsOwnerOrAdmin])
def deactivate_card(request, card_id):
    """Deactivate/Block a card"""
    card = get_object_or_404(CarteVirtuelle, id=card_id, utilisateur=request.user)
    
    card.desactiverCarte()
    return Response({
        'message': 'Card deactivated successfully',
        'card': CarteVirtuelleSerializer(card).data
    })

# Card Request Views
class CardRequestCreateView(generics.CreateAPIView):
    """Create a new card request"""
    serializer_class = CardRequestCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        print(f"Received data: {request.data}")
        print(f"User: {request.user}")
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"Error creating card request: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            raise

class UserCardRequestsView(generics.ListAPIView):
    """List all card requests for the authenticated user"""
    serializer_class = CardRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Désactiver la pagination
    
    def get_queryset(self):
        return CardRequest.objects.filter(user=self.request.user).order_by('-created_at')

# Admin Views
class AdminCardRequestsView(generics.ListAPIView):
    """List all card requests for admin review"""
    serializer_class = CardRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only allow admin users
        if not self.request.user.is_admin:
            return CardRequest.objects.none()
        
        # Return ALL requests, not just pending ones
        # Frontend will handle filtering
        return CardRequest.objects.all().order_by('-created_at')

class AdminCardRequestDetailView(generics.RetrieveUpdateAPIView):
    """Admin view to review and approve/reject card requests"""
    serializer_class = CardApprovalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only allow admin users
        if not self.request.user.is_admin:
            return CardRequest.objects.none()
        return CardRequest.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CardRequestSerializer
        return CardApprovalSerializer

class AdminAllCardsView(generics.ListAPIView):
    """Admin view to see all cards in the system"""
    serializer_class = CarteVirtuelleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only allow admin users
        if not self.request.user.is_admin:
            return CarteVirtuelle.objects.none()
        return CarteVirtuelle.objects.all()

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def card_stats(request):
    """Get card statistics for user dashboard"""
    user_cards = CarteVirtuelle.objects.filter(utilisateur=request.user).exclude(status='expired')
    
    total_cards = user_cards.count()
    active_cards = user_cards.filter(status='active').count()
    total_balance = sum(float(card.balance) for card in user_cards)
    
    return Response({
        'total_cards': total_cards,
        'active_cards': active_cards,
        'blocked_cards': user_cards.filter(status='blocked').count(),
        'pending_cards': user_cards.filter(status='pending').count(),
        'total_balance': total_balance,
        'cards': CarteVirtuelleSerializer(user_cards, many=True).data
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_stats(request):
    """Get card statistics for admin dashboard"""
    if not request.user.is_admin:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    all_cards = CarteVirtuelle.objects.all()
    all_requests = CardRequest.objects.all()
    
    return Response({
        'total_cards': all_cards.count(),
        'active_cards': all_cards.filter(status='active').count(),
        'blocked_cards': all_cards.filter(status='blocked').count(),
        'pending_requests': all_requests.filter(status='pending').count(),
        'approved_requests': all_requests.filter(status='approved').count(),
        'rejected_requests': all_requests.filter(status='rejected').count(),
        'total_balance': sum(float(card.balance) for card in all_cards),
    })
