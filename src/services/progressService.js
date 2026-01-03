import { db } from './firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy  // AÑADIR este import
} from 'firebase/firestore';
import { getModulesByYear } from './moduleService'; // AÑADIR esta línea

/**
 * Obtener progreso del usuario
 */
export const getUserProgress = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().progreso || {};
    }
    
    return {};
  } catch (error) {
    console.error('Error obteniendo progreso:', error);
    throw error;
  }
};

/**
 * Obtener progreso detallado por módulo
 */
export const getUserModuleProgress = async (userId, year) => {
  try {
    const progressRef = collection(db, `users/${userId}/progress`);
    const q = query(progressRef, where('nivelId', '>=', `año${year}_`));
    
    const querySnapshot = await getDocs(q);
    const progressData = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      progressData[data.nivelId] = data;
    });
    
    return progressData;
  } catch (error) {
    console.error('Error obteniendo progreso por módulo:', error);
    throw error;
  }
};

/**
 * Actualizar progreso de un módulo
 */
export const updateModuleProgress = async (userId, moduleId, progressData) => {
  try {
    const progressRef = doc(db, `users/${userId}/progress`, moduleId);
    
    await setDoc(progressRef, {
      nivelId: moduleId,
      ...progressData,
      ultimaActualizacion: serverTimestamp()
    }, { merge: true });
    
    // Actualizar también el contador en el usuario
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    const year = moduleId.split('_')[0].replace('año', '');
    const yearKey = `año${year}`;
    
    if (userData.progreso && userData.progreso[yearKey]) {
      const completed = progressData.completado ? 1 : 0;
      
      await updateDoc(userRef, {
        [`progreso.${yearKey}.nivelesCompletados`]: userData.progreso[yearKey].nivelesCompletados + completed,
        [`progreso.${yearKey}.completado`]: userData.progreso[yearKey].nivelesCompletados + completed === userData.progreso[yearKey].totalNiveles
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error actualizando progreso:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas del usuario
 */
export const getUserStats = async (userId, year) => {
  try {
    const [progress, modules] = await Promise.all([
      getUserModuleProgress(userId, year),
      getModulesByYear(year)
    ]);
    
    const stats = {
      total: modules.length,
      completed: 0,
      inProgress: 0,
      notStarted: 0
    };
    
    modules.forEach(module => {
      const moduleProgress = progress[module.id];
      
      if (moduleProgress) {
        if (moduleProgress.completado) {
          stats.completed++;
        } else if (moduleProgress.fechaInicio) {
          stats.inProgress++;
        } else {
          stats.notStarted++;
        }
      } else {
        stats.notStarted++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
};