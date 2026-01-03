import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getDashboardData } from '../../services/dashboardService';
import ModuleCard from '../../components/student/ModuleCard';
import ProgressChart from '../../components/student/ProgressChart';
import '../../styles/Dashboard.css';

const Dashboard = () => {
  const { userData, currentUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Obtener año seleccionado de la navegación
  const selectedYear = location.state?.selectedYear || userData?.año || 1;
  const [activeSection, setActiveSection] = useState('inicio');
  const [dashboardData, setDashboardData] = useState(null);
  const [modules, setModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sidebarActive, setSidebarActive] = useState(window.innerWidth > 768);

  // Cargar datos del dashboard desde Firebase
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getDashboardData(currentUser.uid, selectedYear);
        setDashboardData(data);
        setModules(data.modules);
        setFilteredModules(data.modules);
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        // Datos de respaldo en caso de error
        setDashboardData(getFallbackData(selectedYear));
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser, selectedYear]);

  // Filtrar módulos según búsqueda y estado
  useEffect(() => {
    if (!modules.length) return;

    let result = modules;
    
    if (searchTerm) {
      result = result.filter(module => 
        module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(module => module.status === statusFilter);
    }
    
    setFilteredModules(result);
  }, [searchTerm, statusFilter, modules]);

  // Datos de respaldo (si Firebase falla)
  const getFallbackData = (year) => {
    const yearData = {
      1: {
        modules: [
          {
            id: 'año1_nivel1',
            title: 'Programación Básica',
            description: 'Introducción a algoritmos, variables y lógica de programación.',
            status: userData?.progreso?.año1?.nivelesCompletados >= 1 ? 'completed' : 'in-progress',
            progress: userData?.progreso?.año1?.nivelesCompletados >= 1 ? 100 : 60,
            icon: '💻',
            difficulty: 'básico',
            duration: '2 semanas',
            order: 1
          },
          {
            id: 'año1_nivel2',
            title: 'HTML/CSS Fundamentos',
            description: 'Estructura web y estilos básicos para desarrollo frontend.',
            status: userData?.progreso?.año1?.nivelesCompletados >= 2 ? 'completed' : 'not-started',
            progress: userData?.progreso?.año1?.nivelesCompletados >= 2 ? 100 : 0,
            icon: '🌐',
            difficulty: 'básico',
            duration: '3 semanas',
            order: 2
          },
          {
            id: 'año1_nivel3',
            title: 'JavaScript Intro',
            description: 'Sintaxis básica, DOM manipulation y eventos en JavaScript.',
            status: 'not-started',
            progress: 0,
            icon: '⚡',
            difficulty: 'intermedio',
            duration: '4 semanas',
            order: 3
          },
          {
            id: 'año1_nivel4',
            title: 'Base de Datos',
            description: 'Fundamentos de SQL y modelos de datos relacionales.',
            status: 'not-started',
            progress: 0,
            icon: '🗄️',
            difficulty: 'intermedio',
            duration: '3 semanas',
            order: 4
          },
          {
            id: 'año1_nivel5',
            title: 'Proyecto Final',
            description: 'Desarrollo de una aplicación web completa integrando conocimientos.',
            status: 'not-started',
            progress: 0,
            icon: '🚀',
            difficulty: 'avanzado',
            duration: '4 semanas',
            order: 5
          }
        ],
        nextModules: [],
        recentModules: [],
        stats: {
          total: 5,
          completed: userData?.progreso?.año1?.nivelesCompletados || 0,
          inProgress: userData?.progreso?.año1?.nivelesCompletados < 5 ? 1 : 0,
          notStarted: 5 - (userData?.progreso?.año1?.nivelesCompletados || 0)
        },
        yearTitle: 'Primero de Bachillerato',
        canDownloadCertificate: userData?.progreso?.año1?.completado || false,
        progressPercent: userData?.progreso?.año1?.nivelesCompletados ? 
          Math.round((userData.progreso.año1.nivelesCompletados / 5) * 100) : 0
      },
      2: {
        modules: [
          {
            id: 'año2_nivel1',
            title: 'React Fundamentos',
            description: 'Componentes, estado, props y ciclo de vida en React.',
            status: 'not-started',
            progress: 0,
            icon: '⚛️',
            difficulty: 'intermedio',
            duration: '4 semanas',
            order: 1
          },
          {
            id: 'año2_nivel2',
            title: 'Firebase Backend',
            description: 'Autenticación, Firestore y Storage con Firebase.',
            status: 'not-started',
            progress: 0,
            icon: '🔥',
            difficulty: 'intermedio',
            duration: '3 semanas',
            order: 2
          },
          {
            id: 'año2_nivel3',
            title: 'APIs REST',
            description: 'Consumo y creación de APIs RESTful con Node.js/Express.',
            status: 'not-started',
            progress: 0,
            icon: '🔌',
            difficulty: 'avanzado',
            duration: '4 semanas',
            order: 3
          },
          {
            id: 'año2_nivel4',
            title: 'Despliegue',
            description: 'Hosting, dominios, SSL y despliegue en producción.',
            status: 'not-started',
            progress: 0,
            icon: '🚀',
            difficulty: 'intermedio',
            duration: '2 semanas',
            order: 4
          },
          {
            id: 'año2_nivel5',
            title: 'Proyecto Avanzado',
            description: 'Aplicación fullstack con todas las tecnologías aprendidas.',
            status: 'not-started',
            progress: 0,
            icon: '💼',
            difficulty: 'avanzado',
            duration: '6 semanas',
            order: 5
          },
          {
            id: 'año2_nivel6',
            title: 'Preparación Laboral',
            description: 'Portfolio, entrevistas técnicas y búsqueda de empleo.',
            status: 'not-started',
            progress: 0,
            icon: '🎯',
            difficulty: 'básico',
            duration: '2 semanas',
            order: 6
          }
        ],
        nextModules: [],
        recentModules: [],
        stats: {
          total: 6,
          completed: userData?.progreso?.año2?.nivelesCompletados || 0,
          inProgress: 0,
          notStarted: 6 - (userData?.progreso?.año2?.nivelesCompletados || 0)
        },
        yearTitle: 'Segundo de Bachillerato',
        canDownloadCertificate: userData?.progreso?.año2?.completado || false,
        progressPercent: userData?.progreso?.año2?.nivelesCompletados ? 
          Math.round((userData.progreso.año2.nivelesCompletados / 6) * 100) : 0
      }
    };
    
    return yearData[year] || yearData[1];
  };

  // Funciones de navegación
  const showSection = (section) => {
    setActiveSection(section);
  };

  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive);
  };

  const handleSectionChange = (section) => {
    showSection(section);
    if (window.innerWidth <= 768) {
      setSidebarActive(false);
    }
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const handleModuleClick = async (moduleId) => {
    // Aquí navegaremos al módulo específico
    navigate(`/module/${moduleId}`, { 
      state: { 
        year: selectedYear,
        moduleId: moduleId 
      }
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard del año {selectedYear}...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-loading">
        <div className="error-message">
          <h3>❌ Error cargando datos</h3>
          <p>No se pudieron cargar los datos del dashboard.</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { 
    modules: loadedModules, 
    nextModules, 
    recentModules, 
    stats, 
    yearTitle,
    canDownloadCertificate,
    progressPercent 
  } = dashboardData;

  return (
    <div className="dashboard-fullscreen">
      <div className="dashboard-container">
        <button className="menu-toggle" onClick={toggleSidebar}>
          {sidebarActive ? '✕' : '☰'}
        </button>
        
        <div className="dashboard">
          {/* SIDEBAR */}
          <aside className={`sidebar ${sidebarActive ? 'active' : ''}`}>
            <div 
              className="profile" 
              onClick={() => navigate('/profile')}
              style={{ cursor: 'pointer' }}
            >
              <img 
                id="sidebarPhoto"
                src={userData?.fotoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                alt="Perfil"
              />
              <h3 id="name">{userData?.nombre || 'Estudiante'}</h3>
              <small>✏️ Editar perfil</small>
            </div>

            <nav className="menu">
              <button 
                className={activeSection === 'inicio' ? 'active' : ''}
                onClick={() => handleSectionChange('inicio')}
              >
                🏠 Inicio
              </button>
              <button 
                className={activeSection === 'modulos' ? 'active' : ''}
                onClick={() => handleSectionChange('modulos')}
              >
                📘 Módulos
              </button>
              <button 
                className={activeSection === 'progreso' ? 'active' : ''}
                onClick={() => handleSectionChange('progreso')}
              >
                📊 Progreso
              </button>
              <button 
                className={activeSection === 'certificado' ? 'active' : ''}
                onClick={() => handleSectionChange('certificado')}
              >
                🎓 Certificado
              </button>
              <button onClick={handleLogout}>
                🚪 Cerrar sesión
              </button>
            </nav>
          </aside>

          {/* CONTENIDO PRINCIPAL */}
          <main className={`content ${!sidebarActive ? 'full-width' : ''}`}>
            {/* SECCIÓN INICIO */}
            <section id="inicio" className={`section ${activeSection === 'inicio' ? 'active' : ''}`}>
              <div className="card">
                <div className="modules-header">
                  <h2>👋 Bienvenido, <span id="userName">{userData?.nombre || 'Estudiante'}</span></h2>
                  <p style={{ color: 'var(--muted)' }}>
                    {yearTitle} - Tu progreso general del curso
                  </p>
                </div>

                <div className="stats-container">
                  <div className="stat-card completed">
                    <div className="icon">✅</div>
                    <div className="number" id="completedCountHome">{stats.completed}</div>
                    <div className="label">Completados</div>
                  </div>
                  
                  <div className="stat-card pending">
                    <div className="icon">⏳</div>
                    <div className="number" id="inProgressCountHome">{stats.inProgress}</div>
                    <div className="label">En Progreso</div>
                  </div>
                  
                  <div className="stat-card total">
                    <div className="icon">📚</div>
                    <div className="number" id="totalCountHome">{stats.total}</div>
                    <div className="label">Total Módulos</div>
                  </div>
                  
                  <div className="stat-card" style={{ background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)' }}>
                    <div className="icon">📈</div>
                    <div className="number" id="progressPercentHome">{progressPercent}%</div>
                    <div className="label">Progreso Total</div>
                  </div>
                </div>

                <div className="dashboard-grid">
                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--text)' }}>📊 Progreso por Módulos</h3>
                    <ProgressChart 
                      completed={stats.completed}
                      inProgress={stats.inProgress}
                      notStarted={stats.notStarted}
                    />
                  </div>

                  <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--text)' }}>🎯 Próximos en Continuar</h3>
                    <div id="nextModules" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {nextModules.length > 0 ? (
                        nextModules.map(module => (
                          <div key={module.id} className="timeline-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span className="module-icon" style={{ 
                                background: module.status === 'in-progress' ? '#fef3c7' : '#f3f4f6',
                                color: module.status === 'in-progress' ? '#92400e' : '#6b7280',
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px'
                              }}>
                                {module.icon}
                              </span>
                              <div>
                                <strong>{module.title}</strong>
                                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                  {module.difficulty} • {module.duration}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>
                          ¡Felicidades! Has completado todos los módulos.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginTop: '30px' }}>
                  <h3 style={{ marginBottom: '20px', color: 'var(--text)' }}>🕐 Módulos Recientes</h3>
                  <div className="modules-grid" id="recentModules">
                    {recentModules.length > 0 ? (
                      recentModules.map(module => (
                        <ModuleCard
                          key={module.id}
                          module={module}
                          onClick={() => handleModuleClick(module.id)}
                        />
                      ))
                    ) : (
                      <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px', width: '100%' }}>
                        No hay actividad reciente. ¡Comienza tu primer módulo!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN MÓDULOS */}
            <section id="modulos" className={`section ${activeSection === 'modulos' ? 'active' : ''}`}>
              <div className="card">
                <div className="modules-header">
                  <div>
                    <h3>📚 Módulos Educativos - {yearTitle}</h3>
                    <p style={{ color: 'var(--muted)', marginTop: '5px' }}>Gestiona tu aprendizaje</p>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                    <span id="totalModules">{stats.total} módulos</span> • 
                    <span id="completedModules"> {stats.completed} completados</span>
                  </div>
                </div>

                <div className="stats-container">
                  <div className="stat-card completed">
                    <div className="label">Completados</div>
                    <div className="number" id="completedCount">{stats.completed}</div>
                  </div>
                  <div className="stat-card pending">
                    <div className="label">En progreso</div>
                    <div className="number" id="progressCount">{stats.inProgress}</div>
                  </div>
                  <div className="stat-card total">
                    <div className="label">Total</div>
                    <div className="number" id="totalCount">{stats.total}</div>
                  </div>
                </div>

                <div className="search-filter">
                  <input
                    type="text"
                    className="search-box"
                    placeholder="🔍 Buscar módulos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  
                  <select 
                    className="filter-select" 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Todos los estados</option>
                    <option value="completed">Completados</option>
                    <option value="in-progress">En progreso</option>
                    <option value="not-started">No iniciados</option>
                  </select>
                </div>

                <div className="modules-grid" id="modules">
                  {filteredModules.length > 0 ? (
                    filteredModules.map(module => (
                      <ModuleCard
                        key={module.id}
                        module={module}
                        onClick={() => handleModuleClick(module.id)}
                      />
                    ))
                  ) : (
                    <div className="empty-state">
                      <i>📭</i>
                      <h3>No se encontraron módulos</h3>
                      <p>Intenta con otros términos de búsqueda</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* SECCIÓN PROGRESO */}
            <section id="progreso" className={`section ${activeSection === 'progreso' ? 'active' : ''}`}>
              <div className="card">
                <h3>📊 Progreso de Aprendizaje</h3>
                <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
                  Seguimiento del avance conforme completas cada módulo
                </p>

                <div className="progress-grid">
                  <div>
                    <h4>📈 Progreso acumulado</h4>
                    <div className="progress-chart-container">
                      {/* Aquí irá el gráfico de línea */}
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '40px',
                        background: 'var(--bg)',
                        borderRadius: '10px'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
                        <p>Gráfico de progreso temporal</p>
                        <small className="text-muted">Chart.js se implementará próximamente</small>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4>✅ Módulos completados</h4>
                    <ul id="timeline" style={{ listStyle: 'none', padding: 0 }}>
                      {modules
                        .filter(m => m.status === 'completed')
                        .map(module => (
                          <li key={module.id} className="timeline-item">
                            <strong>{module.title}</strong>
                            <small style={{ display: 'block', color: 'var(--muted)' }}>
                              Completado al 100%
                            </small>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>

                <p id="progressText" style={{ marginTop: '20px', fontWeight: 600 }}>
                  {progressPercent === 100 
                    ? '🎉 ¡Felicidades! Has completado todos los módulos.' 
                    : `Progreso general: ${progressPercent}% completado`}
                </p>
              </div>
            </section>

            {/* SECCIÓN CERTIFICADO */}
            <section id="certificado" className={`section ${activeSection === 'certificado' ? 'active' : ''}`}>
              <div className="card">
                <h3>🎓 Certificado de Finalización</h3>
                <p id="certText">
                  {canDownloadCertificate 
                    ? '✅ ¡Felicidades! Has completado todos los módulos. Ya puedes descargar tu certificado.' 
                    : '🔒 Completa todos los módulos para desbloquear tu certificado'}
                </p>

                <div className="preview-controls">
                  <button 
                    id="btnCert" 
                    className={`btn ${canDownloadCertificate ? 'btn-primary' : 'btn-disabled'}`}
                    disabled={!canDownloadCertificate}
                    style={{ marginBottom: '20px' }}
                  >
                    📄 Descargar Certificado en PDF
                  </button>
                  
                  <div className="preview-options">
                    <select id="themeSelect" className="filter-select">
                      <option value="default">Tema: Clásico</option>
                      <option value="modern">Tema: Moderno</option>
                      <option value="elegant">Tema: Elegante</option>
                    </select>
                    
                    <button className="btn btn-secondary">
                      🔄 Actualizar vista previa
                    </button>
                  </div>
                </div>

                {canDownloadCertificate ? (
                  <div id="certPreview">
                    <div className="preview-header">
                      <h4>👁️ Vista Previa del Certificado</h4>
                      <p>Así se verá tu certificado cuando lo descargues</p>
                    </div>
                    
                    <div id="certPreviewContainer" className="cert-preview-container">
                      <div className="cert-border">
                        <h1>Certificado de Finalización</h1>
                        <div className="cert-subtitle">Sys Scholar Platform</div>
                        <h2>{yearTitle}</h2>
                        <div className="cert-body">
                          Se otorga el presente certificado a
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '20px 0', color: 'var(--primary-dark)' }}>
                          {userData?.nombre || 'Estudiante'}
                        </div>
                        <div className="cert-body">
                          por haber completado exitosamente el curso de<br />
                          <strong>{yearTitle}</strong><br />
                          con un promedio sobresaliente.
                        </div>
                        <div className="cert-message">
                          Este certificado acredita la finalización de todos los módulos requeridos
                          y demuestra competencia en las habilidades adquiridas durante el curso.
                        </div>
                        <div className="cert-footer">
                          <div>
                            <div style={{ fontWeight: 'bold' }}>Fecha de emisión</div>
                            <div>{new Date().toLocaleDateString('es-ES', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>Código de verificación</div>
                            <div>SS-{userData?.uid?.slice(0, 8) || '12345678'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="preview-footer">
                      <p><small>📏 Dimensiones: A4 horizontal (297mm × 210mm)</small></p>
                      <p><small>🎨 Personalizable antes de descargar</small></p>
                    </div>
                  </div>
                ) : (
                  <div id="certLocked" className="cert-locked">
                    <div className="lock-icon">🔒</div>
                    <h4>Certificado bloqueado</h4>
                    <p>Completa todos los módulos para desbloquear tu certificado personalizado</p>
                    <div className="progress-indicator">
                      <div className="progress-bar">
                        <div 
                          className="progress-bar-fill" 
                          id="certProgressBar"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <span id="certProgressText">{progressPercent}% completado</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;