import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './GeneratedCards.css';

const GeneratedCards = () => {
    const { token } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            fetchAllCards();
        }
    }, [token]);

    const fetchAllCards = async () => {
        if (!token) {
            setError('No authentication token available');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('Fetching cards with token:', token ? 'Present' : 'None');
            const response = await fetch('http://localhost:8000/api/cards/admin/cards/', {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('API Response:', data);

                // Handle different response formats
                if (Array.isArray(data)) {
                    setCards(data);
                } else if (data && Array.isArray(data.results)) {
                    setCards(data.results);
                } else {
                    console.error('Unexpected data format:', data);
                    setCards([]);
                    setError('Unexpected data format from server');
                }
            } else {
                setError('Failed to fetch cards');
            }
        } catch (error) {
            setError('Network error');
            console.error('Error fetching cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCardCategoryColor = (category) => {
        switch (category) {
            case 'diamond': return '#b8860b';  // Gold color
            case 'platinum': return '#c0c0c0'; // Silver color
            case 'gold': return '#ffd700';     // Gold color
            case 'classic': return '#74645c';  // Brown color
            default: return '#74645c';
        }
    };

    const getCardCategoryIcon = (category) => {
        switch (category) {
            case 'diamond': return '💎';
            case 'platinum': return '🥈';
            case 'gold': return '🥇';
            case 'classic': return '🏷️';
            default: return '💳';
        }
    };

    if (loading) return <div className="loading">Loading cards...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="generated-cards">
            <div className="header">
                <h1>Generated Virtual Cards</h1>
                <div className="stats">
                    <span>Total Cards: {Array.isArray(cards) ? cards.length : 0}</span>
                    <span>Active: {Array.isArray(cards) ? cards.filter(c => c.status === 'active').length : 0}</span>
                </div>
            </div>

            <div className="cards-grid">
                {Array.isArray(cards) && cards.map(card => (
                    <div key={card.id} className="card-item">
                        <div className="card-header">
                            <div className="card-category"
                                style={{ backgroundColor: getCardCategoryColor(card.card_category) }}>
                                {getCardCategoryIcon(card.card_category)} {card.card_category.toUpperCase()}
                            </div>
                            <div className={`card-status ${card.status}`}>
                                {card.status.toUpperCase()}
                            </div>
                        </div>

                        <div className="card-body">
                            <h3>{card.card_name}</h3>
                            <div className="card-details">
                                <div className="detail-row">
                                    <span className="label">Card Number:</span>
                                    <span className="value">{card.masked_numero}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Type:</span>
                                    <span className="value">{card.card_type}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Owner:</span>
                                    <span className="value">{card.utilisateur_name}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Credit Limit:</span>
                                    <span className="value">${card.credit_limit}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Balance:</span>
                                    <span className="value">${card.balance}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Created:</span>
                                    <span className="value">{new Date(card.dateCreation).toLocaleDateString()}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Expires:</span>
                                    <span className="value">{new Date(card.dateExpiration).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="card-actions">
                            <button className="action-btn view">View Details</button>
                            <button className="action-btn manage">Manage</button>
                        </div>
                    </div>
                ))}
            </div>

            {(!Array.isArray(cards) || cards.length === 0) && !loading && (
                <div className="no-cards">
                    <p>No cards have been generated yet.</p>
                    <p>Cards are automatically created when admin approves card requests.</p>
                </div>
            )}
        </div>
    );
};

export default GeneratedCards;
