from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Permission personnalisée pour permettre l'accès uniquement aux administrateurs.
    """
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission personnalisée pour permettre l'accès au propriétaire ou à un admin.
    """
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
    
    def has_object_permission(self, request, view, obj):
        # Permissions de lecture pour le propriétaire ou admin
        if hasattr(obj, 'user'):
            return obj.user == request.user or request.user.is_admin
        elif hasattr(obj, 'utilisateur'):
            return obj.utilisateur == request.user or request.user.is_admin
        return request.user.is_admin

class IsOwnerOnly(permissions.BasePermission):
    """
    Permission personnalisée pour permettre l'accès uniquement au propriétaire.
    """
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'utilisateur'):
            return obj.utilisateur == request.user
        return False

class ReadOnlyOrAdmin(permissions.BasePermission):
    """
    Permission personnalisée pour lecture seule pour les utilisateurs, 
    accès complet pour les admins.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Les admins ont tous les droits
        if request.user.is_admin:
            return True
        
        # Les utilisateurs normaux peuvent seulement lire
        return request.method in permissions.SAFE_METHODS
