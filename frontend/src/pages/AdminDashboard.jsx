import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { logout, token } = useAuth();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCards: 0,
        activeUsers: 0,
        totalBalance: 0
    });

    // Fetch users from backend
    const fetchUsers = async () => {
        try {
            console.log('🔍 Fetching users with token:', token ? 'Present' : 'None');
            const response = await fetch('http://localhost:8000/api/users/admin/users/', {
                method: 'GET',
                headers: {
                    'Authorization': token ? `Token ${token}` : '',
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                const usersList = data.results || data; // Handle paginated or direct response
                setUsers(usersList);
                setFilteredUsers(usersList); // Initialize filtered users

                // Calculate stats from real data
                const stats = {
                    totalUsers: usersList.length,
                    totalCards: usersList.reduce((acc, user) => acc + (user.total_cards || 0), 0),
                    activeUsers: usersList.filter(user => user.status === 'active').length,
                    totalBalance: usersList.reduce((acc, user) => acc + parseFloat(user.total_balance || 0), 0)
                };
                setStats(stats);
            } else {
                console.error('Failed to fetch users');
                // Fallback to mock data if API fails
                const mockUsers = [
                    { id: 1, full_name: 'John Doe', email: 'john@email.com', total_cards: 3, status: 'active' },
                    { id: 2, full_name: 'Jane Smith', email: 'jane@email.com', total_cards: 2, status: 'active' },
                ];
                setUsers(mockUsers);
                setFilteredUsers(mockUsers); // Initialize filtered users
                setStats({
                    totalUsers: mockUsers.length,
                    totalCards: mockUsers.reduce((acc, user) => acc + user.total_cards, 0),
                    activeUsers: mockUsers.filter(user => user.status === 'active').length,
                    totalBalance: 0
                });
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Function to refresh users (call this when navigating back from create user)
    const refreshUsers = () => {
        setLoading(true);
        fetchUsers();
        setSearchTerm(''); // Clear search when refreshing
    };

    // Handle logout
    const handleLogout = () => {
        logout();
    };

    // Handle search functionality
    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);

        const filtered = users.filter(user => {
            const fullName = (user.full_name || `${user.first_name} ${user.last_name}` || user.username).toLowerCase();
            const email = user.email.toLowerCase();
            return fullName.includes(term) || email.includes(term);
        });

        setFilteredUsers(filtered);
    };

    // Clear search
    const clearSearch = () => {
        setSearchTerm('');
        setFilteredUsers(users);
    };

    // View user details
    const handleViewUser = (user) => {
        alert(`User Details:\n\nName: ${user.full_name || `${user.first_name} ${user.last_name}`}\nEmail: ${user.email}\nPhone: ${user.phone_number || 'N/A'}\nUser Type: ${user.user_type}\nStatus: ${user.status}\nCards: ${user.total_cards || 0}\nBalance: $${user.total_balance || '0.00'}\nJoined: ${new Date(user.date_created).toLocaleDateString()}`);
    };

    // Edit user (placeholder - could navigate to edit form)
    const handleEditUser = (user) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        if (window.confirm(`Change ${user.full_name || user.username}'s status from ${user.status} to ${newStatus}?`)) {
            updateUserStatus(user.id, newStatus);
        }
    };

    // Update user status
    const updateUserStatus = async (userId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/users/admin/users/${userId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': token ? `Token ${token}` : '',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                alert('User status updated successfully!');
                fetchUsers(); // Refresh the list
            } else {
                alert('Failed to update user status');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error updating user status');
        }
    };

    // Delete user with confirmation
    const handleDeleteUser = async (user) => {
        const confirmMessage = `Are you sure you want to delete ${user.full_name || user.username}?\n\nThis action cannot be undone!`;

        if (window.confirm(confirmMessage)) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:8000/api/users/admin/users/${user.id}/`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': token ? `Token ${token}` : '',
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    alert('User deleted successfully!');
                    fetchUsers(); // Refresh the list
                } else {
                    alert('Failed to delete user');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Error deleting user');
            }
        }
    };

    // Export data to CSV
    const handleExportData = () => {
        try {
            // Create CSV content
            const headers = ['Name', 'Email', 'Phone', 'User Type', 'Status', 'Cards', 'Balance', 'Join Date'];
            const csvContent = [
                headers.join(','),
                ...users.map(user => [
                    `"${user.full_name || `${user.first_name} ${user.last_name}` || user.username}"`,
                    `"${user.email}"`,
                    `"${user.phone_number || 'N/A'}"`,
                    `"${user.user_type}"`,
                    `"${user.status}"`,
                    user.total_cards || 0,
                    `"$${user.total_balance || '0.00'}"`,
                    `"${new Date(user.date_created).toLocaleDateString()}"`
                ].join(','))
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert('Users data exported successfully!');
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Error exporting data');
        }
    };

    const handleAddUser = () => {
        navigate('/create-user');
    };

    const handleAddCard = () => {
        console.log('Add Card button clicked, navigating to /add-card');
        navigate('/add-card');
    };

    const handleManageCards = () => {
        navigate('/card-management');
    };

    const handleViewGeneratedCards = () => {
        navigate('/generated-cards');
    };

    useEffect(() => {
        fetchUsers();

        // Check if a user was just created
        const userCreated = localStorage.getItem('userCreated');
        if (userCreated === 'true') {
            localStorage.removeItem('userCreated');
            // Additional refresh after a short delay to ensure data is updated
            setTimeout(() => {
                fetchUsers();
            }, 1000);
        }
    }, []);

    // Listen for when user returns from create user page
    useEffect(() => {
        const handleFocus = () => {
            refreshUsers();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="dashboard-header">
                    <div className="header-content">
                        <h1>Admin Dashboard</h1>
                        <button className="logout-button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
                <div className="dashboard-content">
                    <p>Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <div className="header-content">
                    <h1>Admin Dashboard</h1>
                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <h3>Total Users</h3>
                            <p className="stat-number">{stats.totalUsers}</p>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="stat-icon">💳</div>
                        <div className="stat-info">
                            <h3>Total Cards</h3>
                            <p className="stat-number">{stats.totalCards}</p>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <h3>Active Users</h3>
                            <p className="stat-number">{stats.activeUsers}</p>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                            <h3>Total Balance</h3>
                            <p className="stat-number">${stats.totalBalance.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="users-section">
                    <div className="section-header">
                        <h2>User Management</h2>
                        <div className="search-section">
                            <div className="search-bar">
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="search-input"
                                />
                                {searchTerm && (
                                    <button onClick={clearSearch} className="clear-search">
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="admin-actions">
                            <button className="admin-button" onClick={refreshUsers}>
                                🔄 Refresh
                            </button>
                            <button className="admin-button" onClick={handleExportData}>
                                📊 Export Data
                            </button>
                            <button className="admin-button" onClick={handleManageCards}>
                                💳 Manage Cards
                            </button>
                            <button className="admin-button" onClick={handleViewGeneratedCards}>
                                🎯 Generated Cards
                            </button>
                            <button className="admin-button primary" onClick={handleAddUser}>Add User</button>
                            <button className="admin-button primary" onClick={handleAddCard}>Add Card</button>
                        </div>
                    </div>

                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Cards</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar">
                                                    {(user.full_name || `${user.first_name} ${user.last_name}` || user.username).charAt(0).toUpperCase()}
                                                </div>
                                                <span className="user-name">
                                                    {user.full_name || `${user.first_name} ${user.last_name}` || user.username}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="user-email">{user.email}</td>
                                        <td>
                                            <span className="cards-count">{user.total_cards || 0} cards</span>
                                        </td>
                                        <td>
                                            <span className={`user-status ${user.status.toLowerCase()}`}>
                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="user-actions">
                                                <button
                                                    className="action-btn view"
                                                    onClick={() => handleViewUser(user)}
                                                    title="View user details"
                                                >
                                                    👁️ View
                                                </button>
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => handleEditUser(user)}
                                                    title="Toggle user status"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDeleteUser(user)}
                                                    title="Delete user"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
