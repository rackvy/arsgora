import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth";

interface Props {
    children: React.ReactElement;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div style={{ padding: 20 }}>Загрузка...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== "ADMIN") {
        return <div style={{ padding: 20 }}>Доступ только для администратора</div>;
    }

    return children;
};

export default ProtectedRoute;
