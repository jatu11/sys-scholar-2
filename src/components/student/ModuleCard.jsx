// src/components/student/ModuleCard.jsx - VERSIÓN MEJORADA
import React from 'react';
import '../../styles/ModuleCard.css';

const ModuleCard = ({ module, onClick }) => {
  // Determinar qué mostrar según el estado
  const isCompleted = module.estado === 'aprobado' || module.estado === 'reprobado';
  const isInProgress = module.estado === 'en-progreso';
  const isPending = module.estado === 'pendiente';
  
  // Texto del botón
  const getButtonText = () => {
    if (isCompleted) return 'Ver Resultados';
    if (isInProgress) return 'Continuar';
    return 'Comenzar Prueba';
  };
  
  // Formatear fecha si existe
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // Si es un objeto de Firebase Timestamp
      if (timestamp._seconds) {
        return new Date(timestamp._seconds * 1000).toLocaleDateString('es-ES');
      }
      // Si es un string ISO
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString('es-ES');
      }
      return '';
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return '';
    }
  };

  // Manejar clic en el módulo
  const handleClick = () => {
    // Pasar información adicional según el estado
    const moduleData = {
      ...module,
      isCompleted: isCompleted || isInProgress,
      isViewOnly: isCompleted,
      canTakeTest: isPending || isInProgress
    };
    
    onClick(moduleData);
  };

  return (
    <div className={`module-card ${module.estado}`} onClick={handleClick}>
      <div className="module-card-header">
        <div className="module-icon">{module.icon || '📚'}</div>
        <div className="module-title-section">
          <h4 className="module-title">{module.title}</h4>
          <span className="status-badge" style={{ backgroundColor: module.colorEtiqueta }}>
            {module.etiqueta}
          </span>
        </div>
      </div>
      
      <p className="module-description">{module.description}</p>
      
      <div className="module-meta">
        <span className="meta-item">
          <span className="meta-icon">📊</span>
          {module.difficulty}
        </span>
        <span className="meta-item">
          <span className="meta-icon">⏱️</span>
          {module.duration}
        </span>
        {module.porcentaje > 0 && (
          <span className="meta-item">
            <span className="meta-icon">📈</span>
            {module.porcentaje}%
          </span>
        )}
        {isCompleted && module.testInfo?.fecha && (
          <span className="meta-item">
            <span className="meta-icon">📅</span>
            {formatDate(module.testInfo.fecha)}
          </span>
        )}
      </div>
      
      {/* Mostrar diferente contenido según estado */}
      {isCompleted ? (
        // MÓDULOS COMPLETADOS: Sin barra, con info de test
        <div className="completed-info">
          <div className="completion-badge">
            <span className="check-icon">✓</span>
            <span className="completion-text">100% completado</span>
          </div>
          
          {module.testInfo && (
            <div className="test-details">
              <div className="test-score">
                <span className="score-label">Puntaje:</span>
                <span className="score-value">
                  {module.testInfo.puntajeObtenido || 0}/{module.testInfo.totalPreguntas || 5}
                </span>
              </div>
              {module.testInfo.porcentaje > 0 && (
                <div className="test-score">
                  <span className="score-label">Porcentaje:</span>
                  <span className="score-value">
                    {module.testInfo.porcentaje}%
                  </span>
                </div>
              )}
              {module.testInfo.fecha && (
                <div className="test-date">
                  <span className="date-label">Fecha:</span>
                  <span className="date-value">{formatDate(module.testInfo.fecha)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // MÓDULOS EN PROGRESO o PENDIENTES: Con barra de progreso
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${module.progress}%`,
                backgroundColor: module.colorEtiqueta
              }}
            ></div>
          </div>
          <span className="progress-text">
            {module.progress}% completado
            {isPending && ' • Listo para comenzar'}
          </span>
        </div>
      )}
      
      <button className={`module-button ${module.estado}`}>
        {getButtonText()}
      </button>
    </div>
  );
};

export default ModuleCard;