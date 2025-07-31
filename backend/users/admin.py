from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import CustomUser, UserActivity

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """
    Admin configuration for CustomUser
    """
    list_display = ('email', 'full_name', 'user_type', 'status', 'total_cards', 
                   'total_balance', 'date_created', 'last_login')
    list_filter = ('user_type', 'status', 'date_created', 'last_login')
    search_fields = ('email', 'first_name', 'last_name', 'username')
    ordering = ('-date_created',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone_number', 'profile_picture')}),
        ('Permissions', {'fields': ('user_type', 'status', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Card Info', {'fields': ('total_cards', 'total_balance')}),
        ('Additional Info', {'fields': ('last_login_ip',)}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'user_type', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('date_joined', 'last_login', 'total_cards', 'total_balance')
    
    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = 'Full Name'
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    """
    Admin configuration for UserActivity
    """
    list_display = ('user_email', 'activity_type', 'description', 'ip_address', 'timestamp')
    list_filter = ('activity_type', 'timestamp')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'description')
    ordering = ('-timestamp',)
    readonly_fields = ('user', 'activity_type', 'description', 'ip_address', 'user_agent', 'timestamp')
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'
    
    def has_add_permission(self, request):
        # Prevent manual creation of activities
        return False
    
    def has_change_permission(self, request, obj=None):
        # Make activities read-only
        return False
