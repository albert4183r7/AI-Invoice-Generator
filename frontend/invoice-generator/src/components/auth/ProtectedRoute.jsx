import {Navigate, Outlet} from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({children}) => {
    // will integrate these values later
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        // You can replace this with a loading spinner or skeleton
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <DashboardLayout>{children ? children : <Outlet/>}</DashboardLayout>
}

export default ProtectedRoute