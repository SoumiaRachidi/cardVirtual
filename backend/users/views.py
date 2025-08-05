from django.shortcuts import render
from django.contrib.auth import login, logout
from django.db.models import Q
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from .models import CustomUser, UserActivity
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserProfileSerializer,
    AdminUserSerializer,
    UserActivitySerializer,
    PasswordChangeSerializer
)

def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def log_user_activity(user, activity_type, description="", request=None):
    """Log user activity"""
    ip_address = get_client_ip(request) if request else None
    user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''
    
    UserActivity.objects.create(
        user=user,
        activity_type=activity_type,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent
    )

class UserRegistrationView(generics.CreateAPIView):
    """
    View for user registration
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Log registration activity
        log_user_activity(user, 'login', 'User registered', request)
        
        # Create token for the user
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'User registered successfully',
            'user': UserProfileSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    User login view
    """
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Update last login info
        user.last_login = timezone.now()
        user.last_login_ip = get_client_ip(request)
        user.save()
        
        # Log login activity
        log_user_activity(user, 'login', 'User logged in', request)
        
        # Get or create token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Login successful',
            'user': UserProfileSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_200_OK)
    
    return Response({
        'message': 'Login failed',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    User logout view
    """
    try:
        # Log logout activity
        log_user_activity(request.user, 'logout', 'User logged out', request)
        
        # Delete the token
        request.user.auth_token.delete()
        
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
    except:
        return Response({
            'message': 'Logout failed'
        }, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    View for user profile management
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code == 200:
            log_user_activity(request.user, 'profile_updated', 'Profile updated', request)
        return response

class PasswordChangeView(generics.GenericAPIView):
    """
    View for password change
    """
    serializer_class = PasswordChangeSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Log password change
            log_user_activity(user, 'password_changed', 'Password changed', request)
            
            # Delete old token and create new one
            try:
                user.auth_token.delete()
            except:
                pass
            token = Token.objects.create(user=user)
            
            return Response({
                'message': 'Password changed successfully',
                'token': token.key
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Admin Views
class AdminUserListView(generics.ListCreateAPIView):
    """
    Admin view to list and create users
    """
    queryset = CustomUser.objects.all()
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def get_serializer_class(self):
        """
        Use different serializers for list and create operations
        """
        if self.request.method == 'POST':
            return UserRegistrationSerializer
        return AdminUserSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        # Only allow admin users to create users
        if not self.request.user.is_admin:
            raise PermissionDenied("Only admin users can create new users")
        serializer.save()

    def get_queryset(self):
        # Only allow admin users to access this view
        if not self.request.user.is_admin:
            return CustomUser.objects.none()
        
        queryset = CustomUser.objects.all()
        search = self.request.query_params.get('search', None)
        user_type = self.request.query_params.get('user_type', None)
        status_filter = self.request.query_params.get('status', None)

        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-date_created')

class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin view to manage individual users
    """
    queryset = CustomUser.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # Only admin users can access this view
        if not self.request.user.is_admin:
            self.permission_denied(self.request)
        return super().get_permissions()

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code == 200:
            user = self.get_object()
            log_user_activity(
                request.user, 
                'profile_updated', 
                f'Admin updated user: {user.email}', 
                request
            )
        return response

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        log_user_activity(
            request.user, 
            'user_deleted', 
            f'Admin deleted user: {user.email}', 
            request
        )
        return super().destroy(request, *args, **kwargs)

class UserActivityListView(generics.ListAPIView):
    """
    View to list user activities
    """
    serializer_class = UserActivitySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            # Admin can see all activities
            queryset = UserActivity.objects.all()
            user_id = self.request.query_params.get('user_id', None)
            if user_id:
                queryset = queryset.filter(user_id=user_id)
        else:
            # Regular users can only see their own activities
            queryset = UserActivity.objects.filter(user=user)
        
        activity_type = self.request.query_params.get('activity_type', None)
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        
        return queryset.order_by('-timestamp')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics
    """
    user = request.user
    
    if user.is_admin:
        # Admin dashboard stats
        total_users = CustomUser.objects.count()
        active_users = CustomUser.objects.filter(status='active').count()
        suspended_users = CustomUser.objects.filter(status='suspended').count()
        total_admins = CustomUser.objects.filter(user_type='admin').count()
        
        stats = {
            'total_users': total_users,
            'active_users': active_users,
            'suspended_users': suspended_users,
            'total_admins': total_admins,
            'recent_activities': UserActivitySerializer(
                UserActivity.objects.all()[:5], many=True
            ).data
        }
    else:
        # User dashboard stats
        stats = {
            'total_cards': user.total_cards,
            'total_balance': str(user.total_balance),
            'account_status': user.status,
            'member_since': user.date_created,
            'recent_activities': UserActivitySerializer(
                UserActivity.objects.filter(user=user)[:5], many=True
            ).data
        }
    
    return Response(stats, status=status.HTTP_200_OK)
