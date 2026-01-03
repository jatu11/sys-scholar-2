import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';

// Layouts
import AuthLayout from './components/common/AuthLayout';
import MainLayout from './components/common/MainLayout';

// Public Pages
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ResetPassword from './pages/public/ResetPassword';

// Student Pages
import YearSelection from './pages/student/YearSelection';
import Dashboard from './pages/student/Dashboard';
import Profile from './pages/student/Profile';


// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Styles
import './styles/App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Componente para redirigir según autenticación
const AuthRedirect = () => {
  return <Navigate to="/login" />;
};

// Componente para redirigir después de login
const PostLoginRedirect = () => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Redirigiendo...</span>
        </div>
        <p className="mt-3">Redirigiendo a tu panel...</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta raíz - Redirige según autenticación */}
          <Route path="/" element={<AuthRedirect />} />

          {/* Páginas públicas (sin navbar/footer) */}
          <Route path="/login" element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          } />

          <Route path="/register" element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          } />

          <Route path="/reset-password" element={
            <AuthLayout>
              <ResetPassword />
            </AuthLayout>
          } />

          {/* Ruta de redirección después de login */}
          <Route path="/redirect" element={<PostLoginRedirect />} />

          {/* Páginas protegidas para estudiantes */}
          <Route path="/select-year" element={
            <PrivateRoute>
              <MainLayout>
                <YearSelection />
              </MainLayout>
            </PrivateRoute>
          } />


          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </PrivateRoute>
          } />

          {/* Páginas protegidas para admin */}
          <Route path="/admin" element={
            <PrivateRoute adminOnly={true}>
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            </PrivateRoute>
          } />

          {/* 404 - Redirige a login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;