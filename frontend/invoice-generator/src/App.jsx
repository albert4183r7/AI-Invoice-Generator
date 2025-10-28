import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LandingPage from './pages/LandingPage/LandingPage.jsx'
import Login from './pages/Auth/Login.jsx'
import SignUp from './pages/Auth/SignUp.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import AllInvoices from './pages/Invoices/AllInvoices.jsx'
import CreateInvoice from './pages/Invoices/CreateInvoice.jsx'
import InvoiceDetail from './pages/Invoices/InvoiceDetail.jsx'
import ProfilePage from './pages/Profile/ProfilePage.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          {/*  Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<AllInvoices />} />
            <Route path="/invoices/new" element={<CreateInvoice />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      <Toaster
        toastOptions={{
          className: "",
          style: {
            fontSize: '13px',
          },
        }}
      />
    </div>
  )
}

export default App