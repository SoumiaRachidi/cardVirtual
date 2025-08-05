import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import './NotificationBadge.css';

const NotificationBadge = () => {
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        deleteNotification,
        clearAllNotifications,
        requestNotificationPermission
    } = useNotifications();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fermer le dropdown en cliquant à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleMarkAllAsRead = () => {
        markAsRead();
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsRead([notification.id]);
        }

        // Rediriger vers l'URL d'action si disponible
        if (notification.action_url) {
            window.location.href = notification.action_url;
        }
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

        if (diffInMinutes < 1) return "À l'instant";
        if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
        if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
        return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
    };

    const getNotificationIcon = (type) => {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️',
            alert: '🚨'
        };
        return icons[type] || 'ℹ️';
    };

    return (
        <div className="notification-badge" ref={dropdownRef}>
            <button
                className="notification-trigger"
                onClick={toggleDropdown}
                title={`${unreadCount} nouvelle(s) notification(s)`}
            >
                <span className="notification-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="notification-count">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isDropdownOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <div className="notification-actions">
                            {unreadCount > 0 && (
                                <button
                                    className="mark-all-read"
                                    onClick={handleMarkAllAsRead}
                                    title="Marquer tout comme lu"
                                >
                                    ✓
                                </button>
                            )}
                            <button
                                className="clear-all"
                                onClick={clearAllNotifications}
                                title="Supprimer toutes les notifications"
                            >
                                🗑️
                            </button>
                            <button
                                className="enable-browser-notifications"
                                onClick={requestNotificationPermission}
                                title="Activer les notifications navigateur"
                            >
                                🔔
                            </button>
                        </div>
                    </div>

                    <div className="notification-list">
                        {loading ? (
                            <div className="notification-loading">
                                <div className="loading-spinner"></div>
                                <span>Chargement...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="no-notifications">
                                <span className="no-notifications-icon">📭</span>
                                <p>Aucune notification</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${notification.is_read ? 'read' : 'unread'} ${notification.color_class}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-content">
                                        <div className="notification-title">
                                            <span className="notification-type-icon">
                                                {getNotificationIcon(notification.notification_type)}
                                            </span>
                                            <span className="title-text">
                                                {notification.title}
                                            </span>
                                            {notification.is_important && (
                                                <span className="important-badge">!</span>
                                            )}
                                        </div>

                                        <p className="notification-message">
                                            {notification.message}
                                        </p>

                                        <div className="notification-meta">
                                            <span className="notification-time">
                                                {formatTimeAgo(notification.created_at)}
                                            </span>
                                            <span className="notification-category">
                                                {notification.category.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="notification-actions-item">
                                        <button
                                            className="delete-notification"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                            title="Supprimer cette notification"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <a href="/notifications" className="view-all-link">
                                Voir toutes les notifications
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBadge;
