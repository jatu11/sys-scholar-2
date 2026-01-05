// src/services/dashboardService.js - VERSIÓN FINAL SIN ERRORES
import { db } from './firebase/config';
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
    writeBatch,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';

/**
 * FUNCIÓN PRINCIPAL - Obtiene datos del dashboard
 */
const getDashboardData = async (userId, year) => {
    try {
        console.log(`🚀 getDashboardData para usuario ${userId}, año ${year}`);

        if (!userId) throw new Error('Usuario no autenticado');

        // 1. Obtener progreso de la subcolección progress
        const userProgress = await getProgressFromSubcollection(userId, year);
        console.log('📊 Progreso obtenido:', userProgress);

        // 2. Obtener módulos del año
        const modules = await getModulesByYear(year);
        console.log(`📚 Módulos obtenidos: ${modules.length}`);

        // 3. Determinar estado de cada módulo
        const modulesWithStatus = determineModuleStatus(modules, userProgress, year);

        // 4. Calcular estadísticas
        const stats = calculateStats(modulesWithStatus);

        // 5. Preparar datos para el dashboard
        const result = prepareDashboardResult(modulesWithStatus, stats, year, userProgress);

        console.log('✅ Dashboard generado:', {
            totalModules: result.modules.length,
            aprobados: result.stats.approved,
            reprobados: result.stats.reprobados,
            enProgreso: result.stats.enProgreso,
            pendientes: result.stats.pendientes
        });

        return result;

    } catch (error) {
        console.error('❌ Error en getDashboardData:', error);
        return getFallbackData(year);
    }
};

/**
 * 1. Obtener progreso desde subcolección progress
 */
const getProgressFromSubcollection = async (userId, year) => {
    try {
        const yearKey = year === 1 ? 'año1' : 'año2';
        const progressRef = doc(db, "users", userId, "progress", yearKey);
        const progressDoc = await getDoc(progressRef);

        if (progressDoc.exists()) {
            return progressDoc.data();
        }

        // Si no existe en subcolección, usar datos principales
        return await getProgressFromMain(userId, year);

    } catch (error) {
        console.error('❌ Error obteniendo progreso:', error);
        return {
            testsCompletados: 0,
            testsAprobados: 0,
            promedioGeneral: 0,
            tests: {},
            resumen: {}
        };
    }
};

/**
 * Obtener progreso desde datos principales si no hay subcolección
 */
const getProgressFromMain = async (userId, year) => {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        const yearKey = `año${year}`;
        const progress = userData.progreso?.[yearKey] || {};

        return {
            testsCompletados: progress.nivelesCompletados || 0,
            testsAprobados: progress.nivelesAprobados || 0,
            promedioGeneral: progress.promedioPuntaje || 0,
            tests: {},
            resumen: {
                completado: progress.completado || false,
                mejorPuntaje: progress.promedioPuntaje || 0
            }
        };
    }

    return {
        testsCompletados: 0,
        testsAprobados: 0,
        promedioGeneral: 0,
        tests: {},
        resumen: {}
    };
};

/**
 * 2. Obtener módulos por año
 */
const getModulesByYear = async (year) => {
    try {
        const yearPrefix = year === 1 ? '1ro' : '2do';
        const modulesRef = collection(db, "modules");

        // Intentar consulta por campo año
        const q = query(
            modulesRef,
            where("año", "==", yearPrefix),
            orderBy("orden", "asc")
        );

        const querySnapshot = await getDocs(q);
        const modules = [];

        querySnapshot.forEach((doc) => {
            modules.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Si no encuentra, usar datos por defecto
        if (modules.length === 0) {
            return getDefaultModules(year);
        }

        return modules;

    } catch (error) {
        console.error('❌ Error obteniendo módulos:', error);
        return getDefaultModules(year);
    }
};

/**
 * 3. Determinar estado de cada módulo - LÓGICA PRINCIPAL
 */
const determineModuleStatus = (modules, userProgress, year) => {
    return modules.map((module, index) => {
        const moduleNumber = index + 1;

        // Buscar test específico para este módulo
        const testData = findTestForModule(moduleNumber, userProgress.tests || {});

        // Determinar estado basado en test
        if (testData) {
            const aprobado = testData.aprobado === true || (testData.porcentaje || 0) >= 70;

            return {
                ...formatModuleData(module, moduleNumber, year),
                status: 'completed',
                etiqueta: aprobado ? '✅ APROBADO' : '❌ REPROBADO',
                estado: aprobado ? 'aprobado' : 'reprobado',
                aprobado: aprobado,
                progress: 100,
                porcentaje: testData.porcentaje || 0,
                testInfo: {
                    porcentaje: testData.porcentaje,
                    aprobado: testData.aprobado,
                    fecha: testData.fechaCompletado,
                    puntajeObtenido: testData.puntajeObtenido,
                    totalPreguntas: testData.totalPreguntas
                },
                colorEtiqueta: aprobado ? '#10b981' : '#ef4444',
                mostrarBarraProgreso: false
            };
        }

        // Si no hay test, verificar si está completado según testsCompletados
        if (moduleNumber <= (userProgress.testsCompletados || 0)) {
            // Determinar si fue aprobado según testsAprobados
            const fueAprobado = moduleNumber <= (userProgress.testsAprobados || 0);

            return {
                ...formatModuleData(module, moduleNumber, year),
                status: 'completed',
                etiqueta: fueAprobado ? '✅ APROBADO' : '❌ REPROBADO',
                estado: fueAprobado ? 'aprobado' : 'reprobado',
                aprobado: fueAprobado,
                progress: 100,
                porcentaje: fueAprobado ? 100 : 0,
                testInfo: null,
                colorEtiqueta: fueAprobado ? '#10b981' : '#ef4444',
                mostrarBarraProgreso: false
            };
        }

        // Verificar si es el módulo en progreso
        const esEnProgreso = moduleNumber === (userProgress.testsCompletados || 0) + 1;

        if (esEnProgreso) {
            return {
                ...formatModuleData(module, moduleNumber, year),
                status: 'in-progress',
                etiqueta: '⏳ EN PROGRESO',
                estado: 'en-progreso',
                aprobado: false,
                progress: 50,
                porcentaje: 0,
                testInfo: null,
                colorEtiqueta: '#f59e0b',
                mostrarBarraProgreso: true
            };
        }

        // Módulo pendiente
        return {
            ...formatModuleData(module, moduleNumber, year),
            status: 'pending',
            etiqueta: '📝 PENDIENTE',
            estado: 'pendiente',
            aprobado: false,
            progress: 0,
            porcentaje: 0,
            testInfo: null,
            colorEtiqueta: '#6b7280',
            mostrarBarraProgreso: true
        };
    });
};

/**
 * Buscar test específico para un módulo
 */
const findTestForModule = (moduleNumber, tests) => {
    const testEntries = Object.entries(tests);

    for (const [testKey, testData] of testEntries) {
        // Intentar determinar a qué módulo pertenece este test
        if (testData.moduloId) {
            const match = testData.moduloId.match(/modulo(\d+)/i);
            if (match && parseInt(match[1]) === moduleNumber) {
                return testData;
            }
        }

        // Buscar por nombre del módulo
        const moduleNames = {
            'introduccion_informatica': 1,
            'soporte_tecnico': 2,
            'sistema_operativo': 3,
            'ofimatica_basica': 4,
            'internet_seguro': 5,
            'programacion_basica': 6
        };

        if (testData.moduloNombre && moduleNames[testData.moduloNombre] === moduleNumber) {
            return testData;
        }

        // Buscar por patrón en el ID del test
        const testPatterns = {
            1: /intro/i,
            2: /soporte/i,
            3: /sistema.*operativo|so/i,
            4: /ofimatica/i,
            5: /internet/i,
            6: /programacion/i
        };

        if (testPatterns[moduleNumber] && testPatterns[moduleNumber].test(testKey)) {
            return testData;
        }
    }

    return null;
};

/**
 * Formatear datos básicos del módulo
 */
const formatModuleData = (module, moduleNumber, year) => {
    return {
        id: module.id || `modulo_${moduleNumber}`,
        title: module.titulo || `Módulo ${moduleNumber}`,
        description: module.descripcion || 'Contenido educativo',
        icon: module.icon || getModuleIcon(moduleNumber),
        difficulty: module.dificultad || 'básico',
        duration: `${module.duracionEstimada || 120} min`,
        order: module.orden || moduleNumber,
        moduleData: module,
        archivo: module.archivo || null,
        año: module.año || (year === 1 ? '1ro' : '2do'),
        numeroModulo: moduleNumber
    };
};

/**
 * 4. Calcular estadísticas
 */
const calculateStats = (modules) => {
    const aprobados = modules.filter(m => m.etiqueta === '✅ APROBADO').length;
    const reprobados = modules.filter(m => m.etiqueta === '❌ REPROBADO').length;
    const enProgreso = modules.filter(m => m.etiqueta === '⏳ EN PROGRESO').length;
    const pendientes = modules.filter(m => m.etiqueta === '📝 PENDIENTE').length;
    const totalCompletados = aprobados + reprobados;

    // Calcular promedio de porcentaje de módulos completados
    const modulosCompletados = modules.filter(m => m.estado === 'aprobado' || m.estado === 'reprobado');
    const promedioPorcentaje = modulosCompletados.length > 0
        ? Math.round(modulosCompletados.reduce((sum, m) => sum + (m.porcentaje || 0), 0) / modulosCompletados.length)
        : 0;

    return {
        total: modules.length,
        completed: totalCompletados,
        approved: aprobados,
        reprobados: reprobados,
        enProgreso: enProgreso,
        pendientes: pendientes,
        averageScore: promedioPorcentaje,
        bestScore: Math.max(...modules.map(m => m.porcentaje || 0)),
        totalTimeSpent: 0
    };
};

/**
 * 5. Preparar resultado final
 */
const prepareDashboardResult = (modules, stats, year, userProgress) => {
    const progressPercent = stats.total > 0
        ? Math.round((stats.completed / stats.total) * 100)
        : 0;

    // Módulos próximos (en progreso primero, luego pendientes)
    const nextModules = modules
        .filter(m => m.estado === 'en-progreso' || m.estado === 'pendiente')
        .sort((a, b) => {
            // En progreso primero
            if (a.estado === 'en-progreso' && b.estado !== 'en-progreso') return -1;
            if (b.estado === 'en-progreso' && a.estado !== 'en-progreso') return 1;
            // Luego por orden
            return a.order - b.order;
        })
        .slice(0, 3);

    // Módulos recientes (completados, más recientes primero)
    const recentModules = modules
        .filter(m => m.estado === 'aprobado' || m.estado === 'reprobado')
        .sort((a, b) => b.order - a.order)
        .slice(0, 4);

    return {
        modules: modules,
        nextModules,
        recentModules,
        stats,
        yearProgress: userProgress,
        yearTitle: year === 1 ? 'Primero de Bachillerato' : 'Segundo de Bachillerato',
        canDownloadCertificate: userProgress.resumen?.completado || stats.completed >= modules.length,
        progressPercent,
        rawProgress: userProgress,
        timestamp: new Date().toISOString()
    };
};

/**
 * FUNCIONES AUXILIARES
 */
const getModuleIcon = (order) => {
    const icons = ['💻', '🔧', '⚙️', '📄', '🌐', '👨‍💻', '⚛️', '🔥', '🔌', '🚀', '💼', '🎯'];
    return icons[(order - 1) % icons.length] || '📚';
};

const getDefaultModules = (year) => {
    const defaultModules = {
        1: [
            { id: "1ro_modulo_1", titulo: "Introducción a la Informática", descripcion: "Conceptos básicos de informática", orden: 1, duracionEstimada: 60, dificultad: "básico", año: "1ro", icon: "💻" },
            { id: "1ro_modulo_2", titulo: "Soporte Técnico", descripcion: "Conceptos de soporte técnico", orden: 2, duracionEstimada: 60, dificultad: "básico", año: "1ro", icon: "🔧" },
            { id: "1ro_modulo_3", titulo: "Sistema Operativo", descripcion: "Funciones de sistemas operativos", orden: 3, duracionEstimada: 60, dificultad: "básico", año: "1ro", icon: "⚙️" },
            { id: "1ro_modulo_4", titulo: "Ofimática Básica", descripcion: "Herramientas ofimáticas", orden: 4, duracionEstimada: 60, dificultad: "básico", año: "1ro", icon: "📄" },
            { id: "1ro_modulo_5", titulo: "Internet Seguro", descripcion: "Prácticas seguras en internet", orden: 5, duracionEstimada: 60, dificultad: "básico", año: "1ro", icon: "🌐" },
            { id: "1ro_modulo_6", titulo: "Programación Básica", descripcion: "Fundamentos de programación", orden: 6, duracionEstimada: 60, dificultad: "básico", año: "1ro", icon: "👨‍💻" }
        ],
        2: [
            { id: "2do_modulo_1", titulo: "Algoritmos y Lógica", descripcion: "Fundamentos de algoritmos", orden: 1, duracionEstimada: 90, dificultad: "intermedio", año: "2do", icon: "⚛️" },
            { id: "2do_modulo_2", titulo: "Programación Avanzada", descripcion: "Estructuras avanzadas", orden: 2, duracionEstimada: 90, dificultad: "intermedio", año: "2do", icon: "🔥" },
            { id: "2do_modulo_3", titulo: "Diseño Web", descripcion: "HTML y CSS básico", orden: 3, duracionEstimada: 90, dificultad: "intermedio", año: "2do", icon: "🔌" },
            { id: "2do_modulo_4", titulo: "Seguridad Informática", descripcion: "Protección de sistemas", orden: 4, duracionEstimada: 90, dificultad: "intermedio", año: "2do", icon: "🚀" },
            { id: "2do_modulo_5", titulo: "Bases de Datos", descripcion: "Fundamentos de bases de datos", orden: 5, duracionEstimada: 90, dificultad: "intermedio", año: "2do", icon: "💼" },
            { id: "2do_modulo_6", titulo: "POO", descripcion: "Programación orientada a objetos", orden: 6, duracionEstimada: 90, dificultad: "intermedio", año: "2do", icon: "🎯" },
            { id: "2do_modulo_7", titulo: "Redes", descripcion: "Redes informáticas", orden: 7, duracionEstimada: 90, dificultad: "intermedio", año: "2do", icon: "📡" },
            { id: "2do_modulo_8", titulo: "Pensamiento Computacional", descripcion: "Resolución de problemas", orden: 8, duracionEstimada: 90, dificultad: "intermedio", año: "2do", icon: "🧠" }
        ]
    };

    return defaultModules[year] || defaultModules[1];
};

const getFallbackData = (year) => {
    const modules = getDefaultModules(year);
    const modulesWithStatus = modules.map((module, index) => ({
        ...formatModuleData(module, index + 1, year),
        status: 'pending',
        etiqueta: '📝 PENDIENTE',
        estado: 'pendiente',
        aprobado: false,
        progress: 0,
        porcentaje: 0,
        testInfo: null,
        colorEtiqueta: '#6b7280',
        mostrarBarraProgreso: true
    }));

    const stats = calculateStats(modulesWithStatus);

    return {
        modules: modulesWithStatus,
        nextModules: modulesWithStatus.slice(0, 3),
        recentModules: [],
        stats,
        yearProgress: { testsCompletados: 0, testsAprobados: 0 },
        yearTitle: year === 1 ? 'Primero de Bachillerato' : 'Segundo de Bachillerato',
        canDownloadCertificate: false,
        progressPercent: 0,
        rawProgress: {},
        timestamp: new Date().toISOString(),
        isFallback: true
    };
};

/**
 * Guardar resultado de test
 */
/**
 * Guardar resultado de test - VERSIÓN COMPATIBLE CON TU ESTRUCTURA
 */
/**
 * Guardar resultado de test - VERSIÓN COMPATIBLE CON TU ESTRUCTURA
 */

// Mapeo de módulos para nombres consistentes
/**
 * Guardar resultado de test - VERSIÓN COMPATIBLE CON TU ESTRUCTURA
 */
const saveTestResult = async (userId, year, testId, testData) => {
  try {
    console.log(`💾 Guardando resultado test para usuario ${userId}, año ${year}, módulo ${testId}`);
    
    if (!userId || !testId) {
      throw new Error("Datos incompletos: usuario o testId no proporcionado");
    }
    
    const yearKey = `año${year}`;
    
    // Determinar el nombre del test basado en el módulo
    const testKey = getTestKey(testId);
    console.log('🔑 Clave del test:', testKey);
    
    // Referencias
    const progressRef = doc(db, "users", userId, "progress", yearKey);
    const userRef = doc(db, "users", userId);
    
    // 1. OBTENER DATOS ACTUALES
    const [progressDoc, userDoc] = await Promise.all([
      getDoc(progressRef),
      getDoc(userRef)
    ]);
    
    if (!userDoc.exists()) {
      throw new Error("Usuario no encontrado en Firebase");
    }
    
    const userData = userDoc.data();
    const currentProgress = progressDoc.exists() ? progressDoc.data() : null;
    const currentTests = currentProgress?.tests || {};
    
    // 2. PREPARAR DATOS DEL TEST EN EL FORMATO CORRECTO
    const formattedQuestions = {};
    const totalQuestions = testData.totalPreguntas || testData.puntajeMaximo || 5;
    const userAnswers = testData.respuestas || {};
    
    // Crear estructura de preguntas como en tu Firebase
    for (let i = 1; i <= totalQuestions; i++) {
      const userAnswer = userAnswers[i];
      const questionData = testData.resultadosDetallados?.find(r => r.questionId === i);
      const isCorrect = questionData?.isCorrect || (userAnswer === 1); // 1 = correcta
      
      formattedQuestions[`q${i}`] = {
        id: `q${i}`,
        idPregunta: `q${i}`,
        idModulo: `modulo${testId}`,
        respuestaUsuario: userAnswer?.toString() || "0",
        respuestaCorrecta: "1", // Siempre la opción 1 es correcta en tu estructura
        esCorrecta: isCorrect,
        puntaje: isCorrect ? 1 : 0
      };
    }
    
    // Calcular porcentaje
    const correctAnswers = Object.values(formattedQuestions).filter(q => q.esCorrecta).length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const approved = percentage >= 70;
    
    // Datos del test en el formato exacto de tu Firebase
    const newTestData = {
      id: testKey,
      moduloId: `modulo${testId}`,
      moduloNombre: getModuleSlug(testId),
      moduloNombreCompleto: testData.moduleTitle || getModuleFullName(testId),
      totalPreguntas: totalQuestions,
      puntajeObtenido: correctAnswers,
      porcentaje: percentage,
      aprobado: approved,
      preguntas: formattedQuestions,
      fechaCompletado: serverTimestamp()
    };
    
    console.log('📝 Datos del test preparados:', newTestData);
    
    // 3. VERIFICAR SI ES UN TEST NUEVO O ACTUALIZACIÓN
    const isNewTest = !currentTests[testKey];
    const wasTestApproved = currentTests[testKey]?.aprobado || false;
    
    // 4. ACTUALIZAR progress/añoX
    const progressUpdate = {};
    
    // Actualizar tests
    progressUpdate[`tests.${testKey}`] = newTestData;
    
    // Calcular nuevos contadores
    let testsCompletados = currentProgress?.testsCompletados || 0;
    let testsAprobados = currentProgress?.testsAprobados || 0;
    let totalTests = currentProgress?.totalTests || 6; // 6 para año 1
    
    if (isNewTest) {
      testsCompletados += 1;
      if (approved) {
        testsAprobados += 1;
      }
    } else {
      // Si ya existía, actualizar aprobación
      if (wasTestApproved !== approved) {
        if (approved) {
          testsAprobados += 1;
        } else {
          testsAprobados = Math.max(0, testsAprobados - 1);
        }
      }
    }
    
    progressUpdate.testsCompletados = testsCompletados;
    progressUpdate.testsAprobados = testsAprobados;
    progressUpdate.totalTests = totalTests;
    
    // Calcular promedios y mejor/peor puntaje
    const allTests = { ...currentTests, [testKey]: newTestData };
    const testPercentages = Object.values(allTests)
      .filter(t => t.porcentaje !== undefined)
      .map(t => t.porcentaje);
    
    const promedioGeneral = testPercentages.length > 0
      ? Math.round(testPercentages.reduce((sum, p) => sum + p, 0) / testPercentages.length)
      : percentage;
    
    const mejorPuntaje = Math.max(...testPercentages);
    const peorPuntaje = Math.min(...testPercentages);
    
    progressUpdate.promedioGeneral = promedioGeneral;
    progressUpdate.mejorPuntaje = mejorPuntaje;
    progressUpdate.peorPuntaje = peorPuntaje;
    
    // Actualizar resumen
    const resumen = {
      completado: testsCompletados >= totalTests,
      testsCompletados,
      testsAprobados,
      promedioGeneral,
      mejorPuntaje,
      peorPuntaje,
      tiempoTotal: currentProgress?.resumen?.tiempoTotal || 0
    };
    
    progressUpdate.resumen = resumen;
    
    // Metadatos
    const now = serverTimestamp();
    progressUpdate.metadata = {
      actualizadoEL: now
    };
    
    if (!currentProgress) {
      progressUpdate.userId = userId;
      progressUpdate.año = year;
      progressUpdate.metadata.creadoEL = now;
      progressUpdate.fechaCreacion = now;
    }
    
    // 5. ACTUALIZAR users/progreso/añoX
    const userUpdate = {};
    const userYearProgress = userData.progreso?.[yearKey] || {};
    
    const totalNiveles = userYearProgress.totalNiveles || (year === 1 ? 6 : 8);
    let nivelesCompletados = userYearProgress.nivelesCompletados || 0;
    let nivelesAprobados = userYearProgress.nivelesAprobados || 0;
    
    // Verificar si este módulo ya estaba completado
    const moduleNumber = parseInt(testId);
    const isModuleAlreadyCompleted = moduleNumber <= nivelesCompletados;
    
    if (!isModuleAlreadyCompleted) {
      // Nuevo módulo completado
      nivelesCompletados = Math.max(nivelesCompletados, moduleNumber);
      if (approved) {
        nivelesAprobados += 1;
      }
    } else {
      // Módulo ya existente, verificar cambio en aprobación
      const wasModuleApproved = moduleNumber <= (userYearProgress.nivelesAprobados || 0);
      if (wasModuleApproved !== approved) {
        if (approved) {
          nivelesAprobados += 1;
        } else {
          nivelesAprobados = Math.max(0, nivelesAprobados - 1);
        }
      }
    }
    
    const completado = nivelesCompletados >= totalNiveles;
    
    userUpdate[`progreso.${yearKey}`] = {
      ...userYearProgress,
      nivelesCompletados,
      nivelesAprobados,
      promedioPuntaje: promedioGeneral,
      completado,
      totalNiveles,
      ultimaActualizacion: now
    };
    
    userUpdate.ultimoAcceso = now;
    
    // 6. EJECUTAR ACTUALIZACIONES
    console.log('🚀 Ejecutando actualizaciones en Firebase...');
    
    // Usar batch para transacción atómica
    const batch = writeBatch(db);
    
    if (progressDoc.exists()) {
      batch.update(progressRef, progressUpdate);
    } else {
      batch.set(progressRef, progressUpdate);
    }
    
    batch.update(userRef, userUpdate);
    
    await batch.commit();
    
    console.log(`✅ Test ${testKey} guardado exitosamente`);
    return { 
      success: true, 
      message: "Resultado guardado exitosamente",
      testKey,
      yearKey,
      data: {
        test: newTestData,
        progress: {
          testsCompletados,
          testsAprobados,
          promedioGeneral
        },
        user: {
          nivelesCompletados,
          nivelesAprobados
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Error guardando resultado:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      details: error.stack
    };
  }
};

// Funciones auxiliares para mantener consistencia
const getTestKey = (testId) => {
  const moduleNames = {
    1: 'intro',
    2: 'soporte',
    3: 'so',
    4: 'ofimatica',
    5: 'internet',
    6: 'programacion'
  };
  
  const moduleName = moduleNames[testId] || `modulo${testId}`;
  return `test_${moduleName}_001`; // Usar el mismo formato que ya tienes
};

const getModuleSlug = (testId) => {
  const slugs = {
    1: 'introduccion_informatica',
    2: 'soporte_tecnico',
    3: 'sistema_operativo',
    4: 'ofimatica_basica',
    5: 'internet_seguro',
    6: 'programacion_basica'
  };
  return slugs[testId] || `modulo_${testId}`;
};

const getModuleFullName = (testId) => {
  const names = {
    1: 'Introducción a la Informática',
    2: 'Soporte Técnico',
    3: 'Sistema Operativo',
    4: 'Ofimática Básica',
    5: 'Internet Seguro',
    6: 'Programación Básica'
  };
  return names[testId] || `Módulo ${testId}`;
};

// ¡NO OLVIDES EXPORTAR!
export { getDashboardData, saveTestResult };

