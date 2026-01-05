// src/components/student/HTMLModuleViewer.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

import { AuthContext } from '../../context/AuthContext';
import { getDashboardData, saveTestResult } from '../../services/dashboardService'; // CORRECCIÓN: Importar desde dashboardService
import '../../styles/HTMLModuleViewer.css';

const HTMLModuleViewer = () => {
  const { filename } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [moduleData, setModuleData] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false); // Nuevo: Para modo vista
  
  // Extraer datos del estado de navegación
  useEffect(() => {
    if (location.state) {
      setModuleData(location.state);
      console.log('📋 Datos del módulo recibidos:', location.state);
      
      // Determinar si es modo vista (módulo ya completado)
      const isCompleted = location.state.isCompleted || false;
      setIsViewOnly(isCompleted);
      console.log(`🎯 Modo: ${isCompleted ? 'VISTA (completado)' : 'PRUEBA (pendiente)'}`);
    }
  }, [location.state]);
  
  // Cargar el archivo HTML
  useEffect(() => {
    const loadHTMLModule = async () => {
      try {
        setLoading(true);
        
        // Ruta a los módulos HTML
        const modulePath = `/Modulos/${filename}`;
        console.log(`📂 Intentando cargar módulo desde: ${modulePath}`);
        
        // Hacer fetch del archivo HTML
        const response = await fetch(modulePath);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        console.log('✅ HTML cargado exitosamente, tamaño:', html.length);
        
        // Modificar el HTML según el modo (vista o prueba)
        const modifiedHTML = isViewOnly 
          ? injectViewModeFunctionality(html) 
          : injectTestModeFunctionality(html);
        
        setHtmlContent(modifiedHTML);
        setLoading(false);
        
      } catch (error) {
        console.error('❌ Error cargando módulo HTML:', error);
        setLoading(false);
        
        Swal.fire({
          icon: 'error',
          title: 'Error cargando módulo',
          text: `No se pudo cargar: ${filename}`,
          confirmButtonText: 'Volver al dashboard'
        }).then(() => {
          navigate('/dashboard');
        });
      }
    };
    
    if (filename) {
      loadHTMLModule();
    } else {
      console.error('❌ No se proporcionó nombre de archivo');
      navigate('/dashboard');
    }
  }, [filename, navigate, isViewOnly]);
  
  // Inyectar funcionalidad para MODO VISTA (módulos ya completados)
  const injectViewModeFunctionality = (html) => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Buscar todas las preguntas y deshabilitarlas
      const questions = tempDiv.querySelectorAll('.question');
      questions.forEach(question => {
        const inputs = question.querySelectorAll('input[type="radio"]');
        inputs.forEach(input => {
          input.disabled = true;
        });
        
        // Resaltar respuesta correcta (si existe la información)
        if (moduleData?.userAnswers) {
          const questionNum = question.id?.match(/q(\d+)/)?.[1];
          if (questionNum) {
            const userAnswer = moduleData.userAnswers[parseInt(questionNum) - 1];
            if (userAnswer) {
              // Marcar la respuesta del usuario
              const userInput = question.querySelector(`input[value="${userAnswer}"]`);
              if (userInput) {
                userInput.checked = true;
                
                // Verificar si es correcta
                const isCorrect = userAnswer === "1"; // 1 = correcta
                const label = userInput.parentElement;
                if (label) {
                  label.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
                  label.style.border = isCorrect ? '2px solid #28a745' : '2px solid #dc3545';
                  label.style.padding = '10px';
                  label.style.borderRadius = '5px';
                  label.style.margin = '5px 0';
                  
                  // Agregar ícono
                  const icon = document.createElement('span');
                  icon.style.marginLeft = '10px';
                  icon.style.fontSize = '16px';
                  icon.innerHTML = isCorrect ? '✅' : '❌';
                  label.appendChild(icon);
                }
              }
            }
          }
        }
      });
      
      // Reemplazar el botón de evaluar por información de resultados
      const evaluarButtons = tempDiv.querySelectorAll('button, input[type="button"]');
      evaluarButtons.forEach(button => {
        if (button.value?.toLowerCase().includes('evaluar') || 
            button.textContent?.toLowerCase().includes('evaluar')) {
          
          button.style.display = 'none';
          
          // Crear sección de resultados previos
          const resultsDiv = document.createElement('div');
          resultsDiv.className = 'previous-results';
          resultsDiv.style.cssText = `
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 5px solid #30297A;
          `;
          
          if (moduleData?.testInfo) {
            resultsDiv.innerHTML = `
              <h3 style="margin-top: 0;">📊 Resultados Anteriores</h3>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div>
                  <strong>Puntaje:</strong><br>
                  <span style="font-size: 24px; color: ${moduleData.testInfo.aprobado ? '#28a745' : '#dc3545'}">
                    ${moduleData.testInfo.puntajeObtenido || 0}/${moduleData.testInfo.totalPreguntas || 5}
                  </span>
                </div>
                <div>
                  <strong>Porcentaje:</strong><br>
                  <span style="font-size: 24px">${moduleData.testInfo.porcentaje || 0}%</span>
                </div>
                <div>
                  <strong>Estado:</strong><br>
                  <span style="color: ${moduleData.testInfo.aprobado ? '#28a745' : '#dc3545'}; font-weight: bold">
                    ${moduleData.testInfo.aprobado ? '✅ APROBADO' : '❌ REPROBADO'}
                  </span>
                </div>
                <div>
                  <strong>Fecha:</strong><br>
                  <span>${moduleData.testInfo.fecha ? new Date(moduleData.testInfo.fecha._seconds * 1000).toLocaleDateString('es-ES') : 'No disponible'}</span>
                </div>
              </div>
              <p style="margin-top: 15px; font-style: italic;">
                Este módulo ya fue completado. Puedes revisar tus respuestas pero no puedes modificarlas.
              </p>
            `;
          } else {
            resultsDiv.innerHTML = `
              <h3 style="margin-top: 0;">📋 Vista del Módulo</h3>
              <p>Estás viendo el contenido del módulo en modo lectura.</p>
            `;
          }
          
          button.parentNode.insertBefore(resultsDiv, button.nextSibling);
        }
      });
      
      // Agregar botón de regreso
      addBackButton(tempDiv);
      
      return tempDiv.innerHTML;
      
    } catch (error) {
      console.error('❌ Error inyectando funcionalidad de vista:', error);
      return html;
    }
  };
  
  // Inyectar funcionalidad para MODO PRUEBA (módulos pendientes)
  const injectTestModeFunctionality = (html) => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Buscar y modificar el script de evaluación
      const scripts = tempDiv.getElementsByTagName('script');
      
      for (let script of scripts) {
        if (script.textContent.includes('evaluar()')) {
          console.log('🔧 Modificando función evaluar() para modo prueba...');
          
          // Reemplazar la función evaluar con nuestra versión mejorada
          const newScriptContent = `
          function evaluar(){
            // 1. Mostrar resultado en pantalla
            let total = 0;
            let respuestasDetalle = [];
            const totalPreguntas = ${moduleData?.testId === 6 ? 6 : 5};
            const respuestasCorrectas = [];
            
            for(let i = 1; i <= totalPreguntas; i++){
              const r = document.querySelector(\`input[name="q\${i}"]:checked\`);
              if(r) {
                const esCorrecta = parseInt(r.value) === 1;
                total += esCorrecta ? 1 : 0;
                respuestasDetalle.push({
                  preguntaId: i,
                  respuestaSeleccionada: parseInt(r.value),
                  esCorrecta: esCorrecta,
                  puntajePregunta: esCorrecta ? 1 : 0
                });
                respuestasCorrectas.push(esCorrecta ? 1 : 0);
              } else {
                respuestasDetalle.push({
                  preguntaId: i,
                  respuestaSeleccionada: null,
                  esCorrecta: false,
                  puntajePregunta: 0
                });
                respuestasCorrectas.push(0);
              }
            }
            
            const porcentaje = (total / totalPreguntas) * 100;
            const aprobado = porcentaje >= 70; // Umbral 70% para aprobar
            
            // Mostrar resultado
            const resultadoDiv = document.getElementById("resultado");
            if(resultadoDiv) {
              resultadoDiv.innerHTML = \`
                <div class="resultado-detalle" style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 5px solid \${aprobado ? '#28a745' : '#dc3545'}">
                  <h3 style="margin-top: 0;">Resultado del Test</h3>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 15px 0;">
                    <div>
                      <strong>Puntaje obtenido:</strong><br>
                      <span style="font-size: 28px; color: \${aprobado ? '#28a745' : '#dc3545'}">\${total} / \${totalPreguntas}</span>
                    </div>
                    <div>
                      <strong>Porcentaje:</strong><br>
                      <span style="font-size: 28px">\${porcentaje.toFixed(1)}%</span>
                    </div>
                    <div>
                      <strong>Estado:</strong><br>
                      <span style="color: \${aprobado ? '#28a745' : '#dc3545'}; font-weight: bold; font-size: 18px">
                        \${aprobado ? '✅ APROBADO' : '❌ REPROBADO'}
                      </span>
                    </div>
                    <div>
                      <strong>Umbral:</strong><br>
                      <span>70% para aprobar</span>
                    </div>
                  </div>
                  
                  <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <button id="guardarResultadoBtn" style="
                      padding: 12px 30px;
                      background: #30297A;
                      color: white;
                      border: none;
                      border-radius: 5px;
                      cursor: pointer;
                      font-size: 16px;
                      font-weight: bold;
                      margin-right: 10px;
                    ">
                      💾 Guardar Resultado y Continuar
                    </button>
                    <button id="revisarBtn" style="
                      padding: 12px 30px;
                      background: #6c757d;
                      color: white;
                      border: none;
                      border-radius: 5px;
                      cursor: pointer;
                      font-size: 16px;
                    ">
                      🔍 Revisar Respuestas
                    </button>
                  </div>
                </div>
              \`;
              
              // Agregar evento al botón de guardar
              document.getElementById('guardarResultadoBtn').addEventListener('click', function() {
                if (window.saveTestToFirebase) {
                  window.saveTestToFirebase(total, totalPreguntas, respuestasDetalle, porcentaje, aprobado, respuestasCorrectas);
                } else {
                  alert('Error: Función de guardado no disponible.');
                }
              });
              
              // Agregar evento al botón de revisar
              document.getElementById('revisarBtn').addEventListener('click', function() {
                // Mostrar respuestas correctas/incorrectas
                for(let i = 1; i <= totalPreguntas; i++){
                  const questionDiv = document.querySelector(\`#q\${i}\`);
                  if(questionDiv) {
                    const userAnswer = respuestasDetalle[i-1].respuestaSeleccionada;
                    const isCorrect = respuestasDetalle[i-1].esCorrecta;
                    
                    // Resaltar todas las opciones
                    const options = questionDiv.querySelectorAll('input[type="radio"]');
                    options.forEach(option => {
                      const label = option.parentElement;
                      if(option.value == userAnswer) {
                        label.style.backgroundColor = isCorrect ? '#d4edda' : '#f8d7da';
                        label.style.border = isCorrect ? '2px solid #28a745' : '2px solid #dc3545';
                        label.style.padding = '10px';
                        label.style.borderRadius = '5px';
                        label.style.margin = '5px 0';
                        
                        const icon = document.createElement('span');
                        icon.style.marginLeft = '10px';
                        icon.style.fontSize = '16px';
                        icon.innerHTML = isCorrect ? '✅' : '❌';
                        label.appendChild(icon);
                      }
                      
                      // Marcar la respuesta correcta (valor 1)
                      if(option.value == "1") {
                        const correctMark = document.createElement('span');
                        correctMark.style.marginLeft = '10px';
                        correctMark.style.fontSize = '16px';
                        correctMark.innerHTML = '⭐';
                        correctMark.title = 'Respuesta correcta';
                        option.parentElement.appendChild(correctMark);
                      }
                    });
                  }
                }
              });
            }
            
            // Actualizar progreso local
            try {
              let modules = JSON.parse(localStorage.getItem("modulesProgress")) || [];
              modules[0] = modules[0] || {};
              modules[0].progress = 100;
              modules[0].status = "completed";
              localStorage.setItem("modulesProgress", JSON.stringify(modules));
            } catch(e) {
              console.warn('Error actualizando localStorage:', e);
            }
          }
          `;
          
          script.textContent = newScriptContent;
          console.log('✅ Función evaluar() modificada para modo prueba');
        }
      }
      
      // Agregar botón de regreso
      addBackButton(tempDiv);
      
      // Agregar instrucciones para el modo prueba
      const firstCard = tempDiv.querySelector('.card');
      if (firstCard) {
        const instructions = document.createElement('div');
        instructions.className = 'test-instructions';
        instructions.style.cssText = `
          background: #e3f2fd;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #2196f3;
        `;
        instructions.innerHTML = `
          <h4 style="margin-top: 0;">📝 Instrucciones para la Prueba</h4>
          <ul style="margin-bottom: 0;">
            <li>Responde todas las preguntas antes de evaluar</li>
            <li>Cada pregunta tiene una única respuesta correcta</li>
            <li>Necesitas al menos 70% para aprobar</li>
            <li>Puedes revisar tus respuestas antes de guardar</li>
            <li><strong>¡Solo tienes un intento por módulo!</strong></li>
          </ul>
        `;
        firstCard.insertBefore(instructions, firstCard.firstChild);
      }
      
      return tempDiv.innerHTML;
      
    } catch (error) {
      console.error('❌ Error inyectando funcionalidad de prueba:', error);
      return html;
    }
  };
  
  // Función auxiliar para agregar botón de regreso
  const addBackButton = (tempDiv) => {
    const cards = tempDiv.querySelectorAll('.card');
    if (cards.length > 0) {
      const firstCard = cards[0];
      const backButton = document.createElement('button');
      backButton.innerHTML = '← Volver al Dashboard';
      backButton.style.cssText = `
        background: #30297A;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-bottom: 15px;
        font-size: 14px;
        font-weight: bold;
      `;
      backButton.onclick = () => navigate('/dashboard');
      firstCard.insertBefore(backButton, firstCard.firstChild);
    }
  };
  
  // Función para guardar resultados en Firebase - CORREGIDA
  const saveTestResultsToFirebase = async (score, total, answers, percentage, approved, correctAnswers) => {
    try {
      if (!currentUser?.uid || !moduleData) {
        throw new Error('Usuario o datos del módulo no disponibles');
      }
      
      console.log('💾 Guardando resultados en Firebase...', {
        userId: currentUser.uid,
        year: moduleData.year,
        testId: moduleData.testId || moduleData.order,
        score,
        total,
        percentage,
        approved
      });
      
      const testData = {
        testId: moduleData.testId || moduleData.order || 1,
        moduloId: `modulo${moduleData.testId || moduleData.order || 1}`,
        moduloNombre: moduleData.moduleTitle?.toLowerCase().replace(/\s+/g, '_') || 'modulo_desconocido',
        puntajeObtenido: score,
        puntajeMaximo: total,
        porcentaje: percentage,
        aprobado: approved,
        respuestas: answers,
        respuestasCorrectas: correctAnswers || [],
        totalPreguntas: total,
        duracion: 0,
        estado: 'completado',
        tiempoInicio: new Date().toISOString(),
        tiempoFin: new Date().toISOString(),
        fechaCompletado: new Date().toISOString()
      };
      
      // USAR saveTestResult de dashboardService (ya importado)
      const result = await saveTestResult(
        currentUser.uid,
        moduleData.year,
        moduleData.testId?.toString() || (moduleData.order?.toString()) || "1",
        testData
      );
      
      if (result.success) {
        console.log('✅ Resultados guardados exitosamente en Firebase');
        setTestCompleted(true);
        
        Swal.fire({
          icon: 'success',
          title: approved ? '¡Felicidades! 🎉' : 'Test Completado',
          text: approved 
            ? `Has aprobado con ${percentage.toFixed(1)}%. Los resultados se han guardado en tu historial.`
            : `Obtuviste ${percentage.toFixed(1)}%. Puedes revisar el módulo nuevamente.`,
          confirmButtonText: 'Volver al Dashboard',
          confirmButtonColor: '#30297A',
          showCancelButton: !approved,
          cancelButtonText: 'Revisar Respuestas'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/dashboard', { 
              state: { 
                selectedYear: moduleData.year,
                refresh: true // Forzar recarga de datos
              } 
            });
          }
        });
        
        return true;
      } else {
        throw new Error(result.error || 'Error desconocido al guardar');
      }
      
    } catch (error) {
      console.error('❌ Error guardando resultados en Firebase:', error);
      
      Swal.fire({
        icon: 'warning',
        title: 'Resultado no guardado',
        text: 'Tu resultado se mostró pero no se pudo guardar en el historial. Puedes intentar nuevamente.',
        showCancelButton: true,
        confirmButtonText: 'Reintentar',
        cancelButtonText: 'Continuar sin guardar',
        confirmButtonColor: '#30297A'
      }).then((result) => {
        if (result.isConfirmed) {
          // Reintentar guardar
          saveTestResultsToFirebase(score, total, answers, percentage, approved, correctAnswers);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          // Continuar sin guardar
          Swal.fire({
            icon: 'info',
            title: 'Resultado no guardado',
            text: 'Los resultados no se guardaron en tu historial.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#6c757d'
          });
        }
      });
      
      return false;
    }
  };
  
  // Inicializar funcionalidad cuando el HTML se carga
  useEffect(() => {
    if (!loading && htmlContent) {
      console.log(`🌐 HTML cargado en modo ${isViewOnly ? 'VISTA' : 'PRUEBA'}, inicializando funcionalidad...`);
      
      // Exponer función global para que el HTML la llame
      window.saveTestToFirebase = async (score, total, answers, percentage, approved, correctAnswers) => {
        console.log('📝 Guardando test desde función global...');
        await saveTestResultsToFirebase(score, total, answers, percentage, approved, correctAnswers);
      };
      
      // También exponer función para navegación
      window.navigateToDashboard = () => {
        navigate('/dashboard');
      };
    }
    
    // Limpiar funciones globales al desmontar
    return () => {
      window.saveTestToFirebase = null;
      window.navigateToDashboard = null;
    };
  }, [loading, htmlContent, currentUser, moduleData, navigate, isViewOnly]);
  
  if (loading) {
    return (
      <div className="module-loading">
        <div className="spinner"></div>
        <p>Cargando {isViewOnly ? 'resultados del' : ''} módulo {filename}...</p>
        {isViewOnly && <small>Modo vista - Solo lectura</small>}
      </div>
    );
  }
  
  return (
    <div className="html-module-viewer">
      <div className="module-header">
        <button 
          className="btn-back-dashboard"
          onClick={() => navigate('/dashboard')}
        >
          ← Volver al Dashboard
        </button>
        
        {moduleData && (
          <div className="module-info">
            <h1>
              {isViewOnly ? '📋 ' : '📝 '}
              {moduleData.moduleTitle}
              {isViewOnly && <span style={{ fontSize: '14px', color: '#666', marginLeft: '10px' }}>(Modo Vista)</span>}
            </h1>
            <p>
              Año {moduleData.year} • Módulo {moduleData.testId || moduleData.order || 1}
              {isViewOnly && ' • ✅ Ya completado'}
              {!isViewOnly && ' • ⏳ Por realizar'}
            </p>
          </div>
        )}
      </div>
      
      {!isViewOnly && (
        <div className="test-warning" style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '5px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <strong>⚠️ Atención:</strong> Esta prueba solo puede ser realizada una vez. 
          Asegúrate de responder todas las preguntas antes de evaluar.
        </div>
      )}
      
      <div 
        className="html-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      
      {testCompleted && (
        <div className="test-completed-banner">
          <p>✅ Test completado. Los resultados han sido guardados en tu historial.</p>
          <button onClick={() => navigate('/dashboard', { state: { selectedYear: moduleData?.year, refresh: true } })}>
            Volver al Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default HTMLModuleViewer;