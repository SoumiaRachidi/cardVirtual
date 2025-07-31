import React from 'react';
import './Home.css';

const Home = () => {
    return (
        <div className="home">
            <div className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Welcome to CardVirtual</h1>
                    <p className="hero-description">
                        Manage your virtual cards with ease and security.
                        Experience seamless digital payments and card management.
                    </p>
                    <div className="hero-buttons">
                        <button className="cta-button primary">Get Started</button>
                        <button className="cta-button secondary">Learn More</button>
                    </div>
                </div>
            </div>

            <div className="features-section">
                <div className="container">
                    <h2 className="section-title">Why Choose CardVirtual?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🔒</div>
                            <h3>Secure</h3>
                            <p>Bank-level security for all your transactions</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">⚡</div>
                            <h3>Fast</h3>
                            <p>Instant card creation and management</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📱</div>
                            <h3>Easy to Use</h3>
                            <p>Intuitive interface for seamless experience</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
