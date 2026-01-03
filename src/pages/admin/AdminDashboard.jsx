import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../../styles/admin.css';

const AdminDashboard = () => {
  const { currentUser, userData } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    penalizedStudents: 0,
    completionRate: 0,
    averageScore: 0
  });
  const [loading, setLoading] = useState(true);

  // Cargar estadísticas (simulado por ahora)
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        // Datos de prueba - luego conectaremos con Firestore
        setTimeout(() => {
          setStats({
            totalStudents: 42,
            activeStudents: 38,
            penalizedStudents: 4,
            completionRate: 76,
            averageScore: 84
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las estadísticas',
          confirmButtonColor: '#dc2626'
        });
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Verificar que el usuario sea admin
  if (!currentUser || !userData) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando información del administrador...</p>
      </div>
    );
  }

  if (userData.rol !== 'admin') {
    return (
      <div className="container mt-5 text-center">
        <div className="alert alert-danger">
          <h4>Acceso denegado</h4>
          <p>No tienes permisos para acceder al panel de administración.</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => navigate('/select-year')}
          >
            Ir al Panel de Estudiante
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <h1>Panel de Administración</h1>
        <p>Bienvenido, {userData.nombre || 'Administrador'}</p>
        <p className="admin-subtitle">
          <small>Correo: {userData.email} | Último acceso: Hoy</small>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="row stats-row">
        <div className="col-md-3 col-sm-6 mb-4">
          <div className="stat-card bg-primary text-white">
            <div className="stat-icon">👨‍🎓</div>
            <div className="stat-content">
              <h3>{stats.totalStudents}</h3>
              <p>Total Estudiantes</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6 mb-4">
          <div className="stat-card bg-success text-white">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.activeStudents}</h3>
              <p>Estudiantes Activos</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6 mb-4">
          <div className="stat-card bg-warning text-white">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3>{stats.penalizedStudents}</h3>
              <p>Estudiantes Penalizados</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6 mb-4">
          <div className="stat-card bg-info text-white">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.completionRate}%</h3>
              <p>Tasa de Completación</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mt-4">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">Acciones Rápidas</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 col-sm-6 mb-3">
              <button className="btn btn-outline-primary w-100">
                <i className="bi bi-people-fill me-2"></i>
                Gestionar Estudiantes
              </button>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <button className="btn btn-outline-success w-100">
                <i className="bi bi-journal-text me-2"></i>
                Gestionar Contenido
              </button>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <button className="btn btn-outline-warning w-100">
                <i className="bi bi-shield-exclamation me-2"></i>
                Ver Penalizaciones
              </button>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <button className="btn btn-outline-info w-100">
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Generar Reportes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="row mt-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Actividad Reciente</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Actividad</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Juan Pérez</td>
                      <td>Completó "Programación Básica"</td>
                      <td>Hoy, 10:30 AM</td>
                      <td><span className="badge bg-success">Aprobado</span></td>
                    </tr>
                    <tr>
                      <td>María González</td>
                      <td>Inició "HTML/CSS Fundamentos"</td>
                      <td>Ayer, 3:45 PM</td>
                      <td><span className="badge bg-info">En Progreso</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Estado del Sistema</h5>
            </div>
            <div className="card-body">
              <div className="system-status">
                <div className="status-item">
                  <span className="status-indicator bg-success"></span>
                  <span>Firebase Auth</span>
                  <span className="ms-auto">Operativo</span>
                </div>
                <div className="status-item">
                  <span className="status-indicator bg-success"></span>
                  <span>Firestore DB</span>
                  <span className="ms-auto">Operativo</span>
                </div>
                <div className="status-item">
                  <span className="status-indicator bg-success"></span>
                  <span>Servidor Web</span>
                  <span className="ms-auto">Operativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;