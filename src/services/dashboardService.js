import { db } from './firebase/config'; // AÑADIR esta línea
import {
    doc,           // AÑADIR
    setDoc,        // AÑADIR
    serverTimestamp // AÑADIR
} from 'firebase/firestore'; // AÑADIR estos imports
import { getModulesByYear } from './moduleService'; // AÑADIR
import { getUserProgress, getUserStats, getUserModuleProgress } from './progressService';
/**
 * Obtener todos los datos necesarios para el dashboard
 */
export const getDashboardData = async (userId, year) => {
    try {
        const [modules, progress, stats, userProgress] = await Promise.all([
            getModulesByYear(year),
            getUserProgress(userId),
            getUserStats(userId, year),
            getUserModuleProgress(userId, year)
        ]);

        // Formatear módulos con estado y progreso
        const formattedModules = modules.map(module => {
            const moduleProgress = userProgress[module.id];

            let status = 'not-started';
            let progressValue = 0;

            if (moduleProgress) {
                if (moduleProgress.completado) {
                    status = 'completed';
                    progressValue = 100;
                } else if (moduleProgress.fechaInicio) {
                    status = 'in-progress';
                    progressValue = moduleProgress.testResultado?.puntaje || 0;
                }
            }

            return {
                id: module.id,
                title: module.titulo,
                description: module.descripcion,
                status,
                progress: progressValue,
                icon: getModuleIcon(module.orden),
                difficulty: module.dificultad || 'básico',
                duration: `${module.duracionEstimada || 120} min`,
                order: module.orden,
                moduleData: module
            };
        });

        // Módulos próximos (no completados, ordenados)
        const nextModules = formattedModules
            .filter(m => m.status !== 'completed')
            .sort((a, b) => a.order - b.order)
            .slice(0, 3);

        // Módulos recientes (completados o en progreso)
        const recentModules = formattedModules
            .filter(m => m.status === 'completed' || m.status === 'in-progress')
            .sort((a, b) => {
                // Ordenar por fecha de finalización si está disponible
                const progressA = userProgress[a.id];
                const progressB = userProgress[b.id];
                const dateA = progressA?.fechaCompletado || progressA?.fechaInicio;
                const dateB = progressB?.fechaCompletado || progressB?.fechaInicio;

                if (dateA && dateB) {
                    return dateB.toDate() - dateA.toDate();
                }
                return b.progress - a.progress;
            })
            .slice(0, 4);

        // Datos del año actual
        const yearKey = `año${year}`;
        const yearProgress = progress[yearKey] || {};

        return {
            modules: formattedModules,
            nextModules,
            recentModules,
            stats,
            yearProgress,
            yearTitle: year === 1 ? 'Primero de Bachillerato' : 'Segundo de Bachillerato',
            canDownloadCertificate: yearProgress.completado || false,
            progressPercent: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
        };

    } catch (error) {
        console.error('Error obteniendo datos del dashboard:', error);
        throw error;
    }
};

/**
 * Función auxiliar para obtener icono según orden del módulo
 */
const getModuleIcon = (order) => {
    const icons = ['💻', '🌐', '⚡', '🗄️', '🚀', '⚛️', '🔥', '🔌', '📱', '💼', '🎯'];
    return icons[order - 1] || '📚';
};

/**
 * Iniciar un módulo
 */
export const startModule = async (userId, moduleId) => {
    try {
        const progressRef = doc(db, `users/${userId}/progress`, moduleId);

        await setDoc(progressRef, {
            nivelId: moduleId,
            fechaInicio: serverTimestamp(),
            completado: false,
            testResultado: null
        }, { merge: true });

        return true;
    } catch (error) {
        console.error('Error iniciando módulo:', error);
        throw error;
    }
};

/**
 * Marcar módulo como completado
 */
export const completeModule = async (userId, moduleId, testScore = 100) => {
    try {
        const passed = testScore >= 80; // 80% mínimo para aprobar

        const progressRef = doc(db, `users/${userId}/progress`, moduleId);

        await setDoc(progressRef, {
            nivelId: moduleId,
            completado: passed,
            fechaCompletado: passed ? serverTimestamp() : null,
            testResultado: {
                puntaje: testScore,
                aprobado: passed,
                intentos: 1
            }
        }, { merge: true });

        return passed;
    } catch (error) {
        console.error('Error completando módulo:', error);
        throw error;
    }
};