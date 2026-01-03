import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { startModule } from '../../services/dashboardService';

const ModuleCard = ({ module, onClick }) => {
  const { currentUser } = useContext(AuthContext);
  
  const getStatusConfig = (status) => {
    const configs = {
      'completed': {
        label: 'Completado',
        color: '#16a34a',
        bgColor: '#d1fae5',
        textColor: '#065f46',
        icon: '✅'
      },
      'in-progress': {
        label: 'En progreso',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        textColor: '#92400e',
        icon: '⏳'
      },
      'not-started': {
        label: 'No iniciado',
        color: '#6b7280',
        bgColor: '#f3f4f6',
        textColor: '#374151',
        icon: '📖'
      }
    };
    return configs[status] || configs['not-started'];
  };

  const statusConfig = getStatusConfig(module.status);
  
  // Verificar si el módulo está bloqueado (módulos secuenciales)
  const isLocked = module.status === 'not-started' && module.order > 1;

  const handleStartModule = async (e) => {
    e.stopPropagation(); // Prevenir que se active el onClick del card
    
    if (!currentUser?.uid || isLocked) return;
    
    try {
      await startModule(currentUser.uid, module.id);
      // Recargar la página para ver cambios
      window.location.reload();
    } catch (error) {
      console.error('Error iniciando módulo:', error);
      alert('Error al iniciar el módulo. Por favor, intenta nuevamente.');
    }
  };

  const handleCardClick = () => {
    if (!isLocked && onClick) {
      onClick();
    }
  };

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`module-card ${module.status} ${isLocked ? 'bloqueado' : ''}`}
      onClick={handleCardClick}
      style={{ 
        cursor: isLocked ? 'not-allowed' : 'pointer'
      }}
    >
      <div className="module-header">
        <div className="module-icon" style={{ 
          background: statusConfig.bgColor,
          color: statusConfig.textColor
        }}>
          {module.icon}
        </div>
        <span className="module-status" style={{ 
          background: statusConfig.bgColor,
          color: statusConfig.textColor
        }}>
          {statusConfig.label}
        </span>
      </div>
      
      <div className="module-title">{module.title}</div>
      <div className="module-description">{module.description}</div>
      
      <div className="module-meta">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>
          <span>📊 {module.difficulty}</span>
          <span>⏱️ {module.duration}</span>
        </div>
      </div>
      
      <div className="module-progress">
        <div className="progress-info">
          <span>Progreso</span>
          <span>{module.progress}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill"
            style={{ 
              width: `${module.progress}%`,
              background: statusConfig.color
            }}
          ></div>
        </div>
      </div>
      
      <div className="module-actions">
        {isLocked ? (
          <button className="btn btn-disabled" disabled>
            🔒 Bloqueado
          </button>
        ) : module.status === 'completed' ? (
          <button className="btn btn-success" onClick={handleDetailsClick}>
            ✅ Revisar
          </button>
        ) : module.status === 'in-progress' ? (
          <button className="btn btn-primary" onClick={handleDetailsClick}>
            ➡️ Continuar
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={handleStartModule}>
            🚀 Comenzar
          </button>
        )}
        
        {module.status !== 'not-started' && (
          <button className="btn btn-secondary" onClick={handleDetailsClick}>
            📋 Detalles
          </button>
        )}
      </div>
    </div>
  );
};

export default ModuleCard;