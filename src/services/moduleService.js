import { db } from './firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

/**
 * Obtener todos los módulos de un año específico
 */
export const getModulesByYear = async (year) => {
  try {
    const modulesRef = collection(db, 'levels');
    const q = query(
      modulesRef,
      where('año', '==', year.toString()),
      orderBy('orden', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const modules = [];
    
    querySnapshot.forEach((doc) => {
      modules.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return modules;
  } catch (error) {
    console.error('Error obteniendo módulos:', error);
    throw error;
  }
};

/**
 * Obtener un módulo específico por ID
 */
export const getModuleById = async (moduleId) => {
  try {
    const moduleRef = doc(db, 'levels', moduleId);
    const moduleDoc = await getDoc(moduleRef);
    
    if (moduleDoc.exists()) {
      return {
        id: moduleDoc.id,
        ...moduleDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo módulo:', error);
    throw error;
  }
};

/**
 * Obtener módulos según estado (completados, en progreso, etc.)
 */
export const getModulesByStatus = async (userId, year, status) => {
  try {
    // Primero obtener progreso del usuario
    const progressRef = collection(db, `users/${userId}/progress`);
    const progressSnapshot = await getDocs(progressRef);
    
    const completedModules = [];
    progressSnapshot.forEach((doc) => {
      const progressData = doc.data();
      if (progressData.completado && progressData.nivelId.includes(`año${year}`)) {
        completedModules.push(progressData.nivelId);
      }
    });
    
    // Obtener todos los módulos del año
    const allModules = await getModulesByYear(year);
    
    // Filtrar según estado
    return allModules.filter(module => {
      if (status === 'completed') {
        return completedModules.includes(module.id);
      } else if (status === 'not-started') {
        return !completedModules.includes(module.id);
      }
      return true; // 'all' o 'in-progress'
    });
    
  } catch (error) {
    console.error('Error obteniendo módulos por estado:', error);
    throw error;
  }
};