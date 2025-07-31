from django.shortcuts import render
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token

@api_view(['GET'])
@permission_classes([AllowAny])
def test_api(request):
    """
    Test API endpoint to verify the server is working
    """
    return Response({
        'message': 'CardVirtual API is working!',
        'status': 'success',
        'version': '1.0.0'
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def simple_login(request):
    """
    Simple login endpoint using Django's built-in User model
    """
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'message': 'Email and password are required',
            'status': 'error'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # For demo purposes, create a mock user response
    # In a real app, this would authenticate against the database
    user_data = {
        'id': 1,
        'email': email,
        'name': 'Test User',
        'role': 'admin' if 'admin' in email.lower() else 'user'
    }
    
    return Response({
        'message': 'Login successful',
        'status': 'success',
        'user': user_data,
        'token': 'mock-token-' + str(hash(email))
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    """
    Simple dashboard stats endpoint
    """
    # Mock data for now
    stats = {
        'total_users': 150,
        'active_users': 142,
        'suspended_users': 8,
        'total_cards': 450,
        'total_balance': '125,000.00'
    }
    
    return Response({
        'message': 'Dashboard stats retrieved successfully',
        'status': 'success',
        'data': stats
    }, status=status.HTTP_200_OK)
