import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({children}) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        // Shown while the session is confirmed against GET /api/auth/me. The
        // cookie is httpOnly, so the server is the only thing that can answer
        // whether the visitor is signed in.
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <DashboardLayout>{children ? children : <Outlet/>}</DashboardLayout>
}

export default ProtectedRoute