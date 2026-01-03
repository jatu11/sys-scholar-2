import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import '../../styles/Seleccion.css';

const YearSelection = () => {
  const { currentUser, userData } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Datos de los años disponibles (igual a la plantilla original)
  const years = [
    {
      id: 1,
      title: 'Primero de Bachillerato',
      description: 'Accede a tus módulos, progreso académico y actividades asignadas.',
      tag: 'BACHILLERATO',
      path: '/dashboard'
    },
    {
      id: 2,
      title: 'Segundo de Bachillerato',
      description: 'Continúa tu avance académico y revisa tus evaluaciones y certificados.',
      tag: 'BACHILLERATO',
      path: '/dashboard',
      available: userData?.progreso?.año1?.completado || false
    }
  ];

  const handleYearSelect = (year) => {
    if (year.available === false) {
      Swal.fire({
        icon: 'warning',
        title: 'Año bloqueado',
        html: `
          <p>Para acceder al <strong>Año 2</strong> debes completar primero el <strong>Año 1</strong>.</p>
          <p class="text-muted mt-2">Completa todos los módulos del primer año para desbloquear el siguiente nivel.</p>
        `,
        confirmButtonColor: '#30297A',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    setLoading(true);

    // Redirigir después de un breve delay
    /* setTimeout(() => {
      navigate(year.path, { 
        state: { selectedYear: year.id }
      });
    }, 500); */
    navigate('/dashboard', {
      state: {
        selectedYear: year.id,
        yearTitle: year.title
      }
    });
  };

  // Si no hay usuario, mostrar carga
  if (!currentUser || !userData) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando información del usuario...</p>
      </div>
    );
  }

  return (
    <div className="year-selection-container">
      <div className="selector-wrapper">

        {/* HEADER - IDÉNTICO A LA PLANTILLA */}
        <div className="selector-header">
          <h1>Selecciona tu año escolar</h1>
          <p>Accede a tu panel según el nivel académico asignado</p>
        </div>

        {/* GRID DE TARJETAS - IDÉNTICO A LA PLANTILLA */}
        <div className="selector-grid">

          {/* PRIMERO DE BACHILLERATO */}
          <div
            className="role-card"
            onClick={() => handleYearSelect(years[0])}
          >
            <div className="level-circle">
              1
              <div className="level-tag">BACHILLERATO</div>
            </div>

            <div className="role-title">Primero de Bachillerato</div>
            <div className="role-desc">
              Accede a tus módulos, progreso académico y actividades asignadas.
            </div>

            <button
              className="role-btn"
              disabled={loading}
            >
              Ingresar a mi panel <span>→</span>
            </button>
          </div>

          {/* SEGUNDO DE BACHILLERATO */}
          <div
            className={`role-card ${years[1].available === false ? 'card-disabled' : ''}`}
            onClick={() => years[1].available !== false && handleYearSelect(years[1])}
            style={{ cursor: years[1].available === false ? 'not-allowed' : 'pointer' }}
          >
            <div className="level-circle">
              2
              <div className="level-tag">BACHILLERATO</div>
            </div>

            <div className="role-title">Segundo de Bachillerato</div>
            <div className="role-desc">
              Continúa tu avance académico y revisa tus evaluaciones y certificados.
            </div>

            {/* Overlay para año bloqueado */}
            {years[1].available === false && (
              <div className="locked-overlay">
                <div className="lock-icon">🔒</div>
                <div className="lock-text">Completa el Año 1</div>
              </div>
            )}

            <button
              className="role-btn"
              disabled={years[1].available === false || loading}
              onClick={() => handleYearSelect(years[1])}
            >
              {loading ? 'Cargando...' : 'Ingresar a mi panel'} <span>→</span>
            </button>
          </div>

        </div>

        {/* INFORMACIÓN DEL USUARIO (adicional) */}
        <div className="user-info-panel">
          <div className="user-badge">
            <strong>👤 Estudiante:</strong> {userData.nombre || userData.usuario}
          </div>
          {userData.progreso?.año1 && (
            <div className="progress-info">
              <div className="progress-label">
                Progreso Año 1: {userData.progreso.año1.nivelesCompletados}/{userData.progreso.año1.totalNiveles} módulos
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(userData.progreso.año1.nivelesCompletados / userData.progreso.año1.totalNiveles) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default YearSelection;