import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import CodesPage from "./pages/CodesPage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/users"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <UsersPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/codes"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <CodesPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <SettingsPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/users" replace />} />
        </Routes>
    );
};

export default App;
