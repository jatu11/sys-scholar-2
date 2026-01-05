// src/components/student/ModuleViewer.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthContext } from '../../context/AuthContext';
import { saveTestResult } from '../../services/dashboardService';
import { getModuleData, calculateResults } from '../../services/modulesData';
import '../../styles/ModuleViewer.css';

const ModuleViewer = () => {
    const { moduleId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useContext(AuthContext);

    const [moduleData, setModuleData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [loading, setLoading] = useState(true);

    // Cargar datos del módulo
    useEffect(() => {
        const loadModule = async () => {
            try {
                setLoading(true);

                // Obtener datos del módulo
                const data = getModuleData(parseInt(moduleId));
                setModuleData(data);

                // Verificar si es modo vista (ya completado)
                const state = location.state || {};
                const isCompleted = state.isCompleted || false;
                setIsViewMode(isCompleted);

                // Si hay resultados anteriores, cargarlos
                if (state.testInfo?.answers) {
                    setAnswers(state.testInfo.answers);
                    const calculatedResults = calculateResults(parseInt(moduleId), state.testInfo.answers);
                    setResults(calculatedResults);
                }

                console.log('📚 Módulo cargado:', {
                    id: moduleId,
                    title: data.title,
                    mode: isCompleted ? 'VISTA' : 'PRUEBA',
                    user: currentUser?.email
                });

            } catch (error) {
                console.error('Error cargando módulo:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo cargar el módulo. Intenta nuevamente.',
                    confirmButtonText: 'Volver'
                }).then(() => {
                    navigate('/dashboard');
                });
            } finally {
                setLoading(false);
            }
        };

        loadModule();
    }, [moduleId, location, navigate, currentUser]);

    // Manejar selección de respuesta
    const handleAnswerSelect = (questionId, answerId) => {
        if (!isViewMode && !results) {
            setAnswers(prev => ({
                ...prev,
                [questionId]: answerId
            }));
        }
    };

    // Evaluar prueba
    const evaluateTest = () => {
        const answeredCount = Object.keys(answers).length;

        if (answeredCount < moduleData.totalQuestions) {
            Swal.fire({
                icon: 'warning',
                title: 'Preguntas pendientes',
                text: `Has respondido ${answeredCount} de ${moduleData.totalQuestions} preguntas. 
               Responde todas antes de evaluar.`,
                confirmButtonText: 'Continuar'
            });
            return;
        }

        const calculatedResults = calculateResults(parseInt(moduleId), answers);
        setResults(calculatedResults);

        // Mostrar resultados
        showResults(calculatedResults);
    };

    // Mostrar resultados con SweetAlert
    const showResults = (calculatedResults) => {
        const isApproved = calculatedResults.approved;

        Swal.fire({
            title: isApproved ? '¡Aprobado! 🎉' : 'Reprobado 😔',
            html: `
        <div style="text-align: left; padding: 10px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div>
              <strong>Puntaje:</strong><br>
              <span style="font-size: 24px; color: ${isApproved ? '#10b981' : '#ef4444'}">
                ${calculatedResults.score}/${calculatedResults.total}
              </span>
            </div>
            <div>
              <strong>Porcentaje:</strong><br>
              <span style="font-size: 24px">${calculatedResults.percentage.toFixed(1)}%</span>
            </div>
            <div>
              <strong>Estado:</strong><br>
              <span style="color: ${isApproved ? '#10b981' : '#ef4444'}; font-weight: bold">
                ${isApproved ? '✅ APROBADO' : '❌ REPROBADO'}
              </span>
            </div>
            <div>
              <strong>Umbral:</strong><br>
              <span>${calculatedResults.passingScore}% para aprobar</span>
            </div>
          </div>
          <p style="font-size: 14px; color: #666;">
            ${isApproved
                    ? '¡Excelente trabajo! Has demostrado comprensión del módulo.'
                    : 'Necesitas estudiar más el contenido. Puedes revisar las respuestas correctas.'}
          </p>
        </div>
      `,
            showCancelButton: true,
            confirmButtonText: 'Guardar resultados',
            cancelButtonText: 'Revisar respuestas',
            confirmButtonColor: '#30297A',
            cancelButtonColor: '#6b7280'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await saveResultsToFirebase(calculatedResults);
            }
        });
    };


    // Ver respuestas correctas
    const showCorrectAnswers = () => {
        const correctAnswers = {};
        moduleData.questions.forEach(q => {
            const correctOption = q.options.find(opt => opt.correct);
            correctAnswers[q.id] = correctOption?.id;
        });

        setAnswers(correctAnswers);
        setIsViewMode(true);

        Swal.fire({
            icon: 'info',
            title: 'Modo revisión activado',
            text: 'Ahora puedes ver las respuestas correctas. No podrás modificarlas.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#30297A'
        });
    };

    // Reiniciar prueba
    const restartTest = () => {
        Swal.fire({
            title: '¿Reiniciar prueba?',
            text: 'Se borrarán todas tus respuestas actuales.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, reiniciar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#30297A'
        }).then((result) => {
            if (result.isConfirmed) {
                setAnswers({});
                setResults(null);
                setIsViewMode(false);
            }
        });
    };

    // En ModuleViewer.jsx
    // Elimina cualquier otra función saveResultsToFirebase y deja solo esta:

    // Elimina cualquier otra función saveResultsToFirebase y deja solo esta:

    const saveResultsToFirebase = async (calculatedResults) => {
        try {
            if (!currentUser?.uid) {
                throw new Error('Usuario no autenticado');
            }

            // Formatear respuestas como en tu estructura (q1, q2, q3...)
            const formattedAnswers = {};
            calculatedResults.results.forEach(result => {
                formattedAnswers[`q${result.questionId}`] = result.userAnswer || 0;
            });

            // Formatear preguntas detalladas
            const preguntasDetalladas = {};
            calculatedResults.results.forEach(result => {
                preguntasDetalladas[`q${result.questionId}`] = {
                    id: `q${result.questionId}`,
                    idPregunta: `q${result.questionId}`,
                    idModulo: `modulo${moduleId}`,
                    respuestaUsuario: (result.userAnswer || 0).toString(),
                    respuestaCorrecta: "1", // En tu estructura siempre es "1"
                    esCorrecta: result.isCorrect,
                    puntaje: result.isCorrect ? 1 : 0
                };
            });

            // Preparar datos del test en el formato EXACTO de tu Firebase
            const testData = {
                testId: parseInt(moduleId),
                moduleTitle: moduleData.title,
                totalPreguntas: calculatedResults.total,
                puntajeObtenido: calculatedResults.score,
                porcentaje: calculatedResults.percentage,
                aprobado: calculatedResults.approved,
                respuestas: formattedAnswers,
                resultadosDetallados: calculatedResults.results,
                preguntas: preguntasDetalladas
            };

            console.log('📤 Enviando datos a Firebase:', testData);

            // Llamar al servicio de guardado
            const result = await saveTestResult(
                currentUser.uid,
                location.state?.year || 1,
                moduleId.toString(),
                testData
            );

            if (result.success) {
                console.log('✅ Resultados guardados exitosamente:', result);

                // Mostrar mensaje de éxito con detalles
                Swal.fire({
                    icon: 'success',
                    title: '¡Resultados guardados!',
                    html: `
          <div style="text-align: left; padding: 10px;">
            <p><strong>📚 Módulo:</strong> ${moduleData.title}</p>
            <p><strong>📊 Puntaje:</strong> ${calculatedResults.score}/${calculatedResults.total}</p>
            <p><strong>📈 Porcentaje:</strong> ${calculatedResults.percentage.toFixed(1)}%</p>
            <p><strong>✅ Estado:</strong> ${calculatedResults.approved ? 'Aprobado' : 'Reprobado'}</p>
            <p><strong>🆔 ID del test:</strong> ${result.testKey}</p>
            <hr style="margin: 15px 0;">
            <p style="font-size: 14px; color: #666;">
              <strong>📈 Estadísticas actualizadas:</strong><br>
              • Tests completados: ${result.data.progress.testsCompletados}<br>
              • Tests aprobados: ${result.data.progress.testsAprobados}<br>
              • Promedio general: ${result.data.progress.promedioGeneral}%
            </p>
          </div>
        `,
                    confirmButtonText: 'Volver al dashboard',
                    confirmButtonColor: '#30297A',
                    showCancelButton: true,
                    cancelButtonText: 'Ver detalles',
                    cancelButtonColor: '#6b7280'
                }).then((dialogResult) => {
                    if (dialogResult.isConfirmed) {
                        // Navegar al dashboard forzando recarga
                        navigate('/dashboard', {
                            state: {
                                selectedYear: location.state?.year || 1,
                                refresh: true,
                                timestamp: Date.now(),
                                showSuccess: true,
                                successMessage: `¡Test del módulo ${moduleData.title} guardado exitosamente!`
                            }
                        });
                    }
                });

                return result;

            } else {
                throw new Error(result.error || 'Error desconocido al guardar');
            }

        } catch (error) {
            console.error('❌ Error guardando resultados:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                html: `
        <div style="text-align: left;">
          <p><strong>Error:</strong> ${error.message}</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
            <p style="margin: 0; font-size: 14px;">
              <strong>📊 Tu resultado:</strong><br>
              • Puntaje: ${calculatedResults.score}/${calculatedResults.total}<br>
              • Porcentaje: ${calculatedResults.percentage.toFixed(1)}%<br>
              • Estado: ${calculatedResults.approved ? '✅ Aprobado' : '❌ Reprobado'}
            </p>
          </div>
        </div>
      `,
                showCancelButton: true,
                confirmButtonText: 'Reintentar',
                cancelButtonText: 'Continuar sin guardar',
                confirmButtonColor: '#30297A',
                cancelButtonColor: '#6b7280',
                allowOutsideClick: false
            }).then((result) => {
                if (result.isConfirmed) {
                    // Reintentar
                    saveResultsToFirebase(calculatedResults);
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    // Continuar sin guardar
                    Swal.fire({
                        icon: 'info',
                        title: 'Resultados no guardados',
                        text: 'Los resultados no se guardaron en tu historial. Puedes volver a intentarlo más tarde.',
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#6c757d'
                    }).then(() => {
                        navigate('/dashboard');
                    });
                }
            });

            return { success: false, error: error.message };
        }
    };

    if (loading) {
        return (
            <div className="module-loading">
                <div className="spinner"></div>
                <p>Cargando módulo {moduleId}...</p>
            </div>
        );
    }

    if (!moduleData) {
        return (
            <div className="module-error">
                <h3>❌ Módulo no encontrado</h3>
                <p>El módulo {moduleId} no existe o no está disponible.</p>
                <button className="btn-back" onClick={() => navigate('/dashboard')}>
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="module-viewer-container">
            {/* Encabezado */}
            <div className="module-header">
                <button className="btn-back" onClick={() => navigate('/dashboard')}>
                    ← Volver al Dashboard
                </button>

                <div className="module-info">
                    <h1>
                        {isViewMode ? '📋' : '📝'} {moduleData.title}
                        {isViewMode && <span className="view-mode-badge"> (Modo Vista)</span>}
                    </h1>
                    <p className="module-description">{moduleData.description}</p>
                    <div className="module-meta">
                        <span>📊 {moduleData.totalQuestions} preguntas</span>
                        <span>🎯 {moduleData.passingScore}% para aprobar</span>
                        <span>
                            {isViewMode ? '✅ Completado' : '⏳ En progreso'}
                        </span>
                    </div>
                </div>

                {/* Controles */}
                {!isViewMode && !results && (
                    <div className="module-controls">
                        <button
                            className="btn-restart"
                            onClick={restartTest}
                            disabled={Object.keys(answers).length === 0}
                        >
                            🔄 Reiniciar
                        </button>
                        <button
                            className="btn-evaluate"
                            onClick={evaluateTest}
                        >
                            📊 Evaluar prueba
                        </button>
                    </div>
                )}
            </div>

            {/* Contenido teórico */}
            <div className="theory-section">
                <h2>📚 Contenido del módulo</h2>
                <div className="theory-grid">
                    {moduleData.theory.map((item, index) => (
                        <div key={index} className="theory-card">
                            <h4>{item.title}</h4>
                            <p>{item.content}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Autoevaluación */}
            <div className="test-section">
                <div className="test-header">
                    <h2>🧠 Autoevaluación</h2>
                    {!isViewMode && !results && (
                        <div className="progress-indicator">
                            <span className="progress-text">
                                {Object.keys(answers).length}/{moduleData.totalQuestions} preguntas respondidas
                            </span>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${(Object.keys(answers).length / moduleData.totalQuestions) * 100}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Preguntas */}
                <div className="questions-grid">
                    {moduleData.questions.map(q => {
                        const userAnswer = answers[q.id];
                        const correctOption = q.options.find(opt => opt.correct);
                        const isCorrect = userAnswer === correctOption?.id;
                        const showCorrect = isViewMode && correctOption;
                        const showUserAnswer = isViewMode && userAnswer !== undefined;

                        return (
                            <div key={q.id} className="question-card">
                                <h3>
                                    {q.id}. {q.question}
                                    {showUserAnswer && (
                                        <span className={`answer-status ${isCorrect ? 'correct' : 'incorrect'}`}>
                                            {isCorrect ? ' ✅' : ' ❌'}
                                        </span>
                                    )}
                                </h3>

                                <div className="options-grid">
                                    {q.options.map(opt => {
                                        const isSelected = userAnswer === opt.id;
                                        const isCorrectOption = opt.correct;

                                        let optionClass = 'option';
                                        if (isSelected) optionClass += ' selected';
                                        if (showCorrect && isCorrectOption) optionClass += ' correct-answer';
                                        if (showUserAnswer && isSelected && !isCorrectOption) optionClass += ' incorrect-answer';

                                        return (
                                            <label
                                                key={opt.id}
                                                className={optionClass}
                                                onClick={() => handleAnswerSelect(q.id, opt.id)}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`q${q.id}`}
                                                    value={opt.id}
                                                    checked={isSelected}
                                                    onChange={() => { }}
                                                    disabled={isViewMode}
                                                />
                                                <span className="option-text">{opt.text}</span>

                                                {/* Indicadores visuales */}
                                                {showCorrect && isCorrectOption && (
                                                    <span className="correct-indicator">⭐ Respuesta correcta</span>
                                                )}
                                                {showUserAnswer && isSelected && !isCorrectOption && (
                                                    <span className="incorrect-indicator">✗ Tu respuesta</span>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Acciones */}
                {!isViewMode && !results && (
                    <div className="test-actions">
                        <button
                            className="btn-primary btn-evaluate-main"
                            onClick={evaluateTest}
                            disabled={Object.keys(answers).length < moduleData.totalQuestions}
                        >
                            📝 Terminar y evaluar
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={showCorrectAnswers}
                        >
                            🔍 Ver respuestas correctas
                        </button>
                    </div>
                )}

                {/* Resultados anteriores */}
                {isViewMode && results && (
                    <div className="previous-results">
                        <h3>📊 Resultados anteriores</h3>
                        <div className="results-grid">
                            <div className="result-card">
                                <div className="result-value">{results.score}/{results.total}</div>
                                <div className="result-label">Puntaje</div>
                            </div>
                            <div className="result-card">
                                <div className="result-value">{results.percentage.toFixed(1)}%</div>
                                <div className="result-label">Porcentaje</div>
                            </div>
                            <div className="result-card">
                                <div className={`result-value ${results.approved ? 'approved' : 'failed'}`}>
                                    {results.approved ? '✅ Aprobado' : '❌ Reprobado'}
                                </div>
                                <div className="result-label">Estado</div>
                            </div>
                        </div>

                        <button
                            className="btn-secondary"
                            onClick={() => navigate('/dashboard')}
                        >
                            ← Volver al Dashboard
                        </button>
                    </div>
                )}

                {/* Resultados nuevos */}
                {results && !isViewMode && (
                    <div className="new-results">
                        <h3>🎯 Resultados de la prueba</h3>
                        <div className="results-summary">
                            <p>
                                Has completado el módulo <strong>{moduleData.title}</strong> con un puntaje de
                                <span className={`score ${results.approved ? 'approved' : 'failed'}`}>
                                    {' '}{results.score}/{results.total}
                                </span>
                            </p>

                            <div className="results-actions">
                                <button
                                    className="btn-primary"
                                    onClick={() => saveResultsToFirebase(results)}
                                >
                                    💾 Guardar resultados
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setIsViewMode(true)}
                                >
                                    🔍 Revisar respuestas
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModuleViewer;