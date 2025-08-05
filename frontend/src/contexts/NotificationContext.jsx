import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [lastCheck, setLastCheck] = useState(new Date().toISOString());

    // Polling des nouvelles notifications
    const pollNotifications = useCallback(async () => {
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:8000/api/notifications/polling/?last_check=${lastCheck}`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();

                if (data.new_notifications.length > 0) {
                    setNotifications(prev => [...data.new_notifications, ...prev]);

                    // Jouer un son si activé
                    playNotificationSound();

                    // Afficher notification browser si permis
                    showBrowserNotification(data.new_notifications[0]);
                }

                setUnreadCount(data.total_unread);
                setLastCheck(data.timestamp);
            }
        } catch (error) {
            console.error('Erreur lors du polling des notifications:', error);
        }
    }, [token, lastCheck]);

    // Récupérer les notifications récentes
    const fetchRecentNotifications = useCallback(async (limit = 10) => {
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/notifications/recent/?limit=${limit}`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Marquer des notifications comme lues
    const markAsRead = async (notificationIds = null) => {
        if (!token) return;

        try {
            const response = await fetch('http://localhost:8000/api/notifications/mark-read/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    notification_ids: notificationIds
                })
            });

            if (response.ok) {
                if (notificationIds) {
                    // Marquer des notifications spécifiques
                    setNotifications(prev =>
                        prev.map(notif =>
                            notificationIds.includes(notif.id)
                                ? { ...notif, is_read: true }
                                : notif
                        )
                    );
                    setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
                } else {
                    // Marquer toutes comme lues
                    setNotifications(prev =>
                        prev.map(notif => ({ ...notif, is_read: true }))
                    );
                    setUnreadCount(0);
                }
            }
        } catch (error) {
            console.error('Erreur lors du marquage des notifications:', error);
        }
    };

    // Supprimer une notification
    const deleteNotification = async (notificationId) => {
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

                // Décrémenter le compteur si la notification n'était pas lue
                const notification = notifications.find(n => n.id === notificationId);
                if (notification && !notification.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de la notification:', error);
        }
    };

    // Vider toutes les notifications
    const clearAllNotifications = async () => {
        if (!token) return;

        try {
            const response = await fetch('http://localhost:8000/api/notifications/clear-all/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression des notifications:', error);
        }
    };

    // Jouer un son de notification
    const playNotificationSound = () => {
        try {
            const audio = new Audio('/notification-sound.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignorer les erreurs de lecture audio
            });
        } catch (error) {
            // Ignorer les erreurs audio
        }
    };

    // Afficher notification navigateur
    const showBrowserNotification = (notification) => {
        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/icon-192x192.png',
                badge: '/icon-72x72.png',
                tag: `notification-${notification.id}`,
                requireInteraction: notification.is_important
            });
        }
    };

    // Demander permission pour les notifications navigateur
    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    };

    // Polling automatique
    useEffect(() => {
        if (!token) return;

        // Premier chargement
        fetchRecentNotifications();

        // Polling toutes les 30 secondes
        const interval = setInterval(pollNotifications, 30000);

        return () => clearInterval(interval);
    }, [token, fetchRecentNotifications, pollNotifications]);

    const value = {
        notifications,
        unreadCount,
        loading,
        fetchRecentNotifications,
        markAsRead,
        deleteNotification,
        clearAllNotifications,
        requestNotificationPermission,
        playNotificationSound
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
