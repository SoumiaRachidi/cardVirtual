from django.urls import path
from . import views

urlpatterns = [
    # Test endpoint
    path('test-auth/', views.test_auth, name='test-auth'),
    
    # User card views
    path('my-cards/', views.UserCardsListView.as_view(), name='user-cards'),
    path('cards/<int:pk>/', views.CardDetailView.as_view(), name='card-detail'),
    path('cards/<int:card_id>/activate/', views.activate_card, name='activate-card'),
    path('cards/<int:card_id>/deactivate/', views.deactivate_card, name='deactivate-card'),
    path('stats/', views.card_stats, name='card-stats'),
    
    # Card request views
    path('request/', views.CardRequestCreateView.as_view(), name='create-card-request'),
    path('my-requests/', views.UserCardRequestsView.as_view(), name='user-card-requests'),
    
    # Admin views
    path('admin/requests/', views.AdminCardRequestsView.as_view(), name='admin-card-requests'),
    path('admin/requests/<int:pk>/', views.AdminCardRequestDetailView.as_view(), name='admin-card-request-detail'),
    path('admin/cards/', views.AdminAllCardsView.as_view(), name='admin-all-cards'),
    path('admin/stats/', views.admin_stats, name='admin-card-stats'),
]
