import {Navigate, Outlet} from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';

const ProtectedRoute = ({children}) => {
    // will integrate these values later
    const isAuthenticated = true
    const loading = false

    if (loading) {
        // You can replace this with a loading spinner or skeleton
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <DashboardLayout>{children ? children : <Outlet/>}</DashboardLayout>
    )
}

export default ProtectedRoute