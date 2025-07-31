import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute, AdminRoute, UserRoute, PublicRoute, AccessDenied } from '../components/ProtectedRoute';
import '../components/ProtectedRoute.css';
import Navbar from '../components/Navbar';
import Home from '../pages/Home';
import Login from '../pages/Login';
import CreateUser from '../pages/CreateUser';
import UserDashboard from '../pages/UserDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import AddCard from '../pages/AddCard';
import CardManagement from '../pages/CardManagement';
import GeneratedCards from '../pages/GeneratedCards';

const AppRoutes = () => {
    return (
        <AuthProvider>
            <Router>
                <div className="app">
                    <Routes>
                        {/* Routes publiques avec Navbar */}
                        <Route
                            path="/"
                            element={
                                <PublicRoute>
                                    <Navbar />
                                    <Home />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <Navbar />
                                    <Login />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/create-user"
                            element={
                                <PublicRoute>
                                    <Navbar />
                                    <CreateUser />
                                </PublicRoute>
                            }
                        />

                        {/* Routes protégées pour utilisateurs normaux */}
                        <Route
                            path="/user-dashboard"
                            element={
                                <UserRoute>
                                    <UserDashboard />
                                </UserRoute>
                            }
                        />
                        <Route
                            path="/add-card"
                            element={
                                <ProtectedRoute requiredPermission="card_request">
                                    <AddCard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Routes protégées pour administrateurs */}
                        <Route
                            path="/admin-dashboard"
                            element={
                                <AdminRoute>
                                    <AdminDashboard />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/card-management"
                            element={
                                <AdminRoute>
                                    <CardManagement />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/generated-cards"
                            element={
                                <AdminRoute>
                                    <GeneratedCards />
                                </AdminRoute>
                            }
                        />

                        {/* Page d'accès refusé */}
                        <Route path="/access-denied" element={<AccessDenied />} />

                        {/* Route par défaut - redirection */}
                        <Route
                            path="*"
                            element={
                                <ProtectedRoute fallbackPath="/">
                                    <div>Page non trouvée</div>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
};

export default AppRoutes;
