import { db } from '../services/firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Inicializar progreso para un usuario estudiante
 */
export const initializeStudentProgress = async (userId, year = 1) => {
  try {
    console.log(`🎯 Inicializando progreso para usuario: ${userId}, año: ${year}`);
    
    // 1. Verificar si el usuario existe y es estudiante
    const userRef = doc(db, 'users', userId);
    
    // 2. Obtener módulos del año
    const levelsRef = collection(db, 'levels');
    const q = query(
      levelsRef,
      where('año', '==', year.toString()),
      orderBy('orden', 'asc')
    );
    
    const levelsSnapshot = await getDocs(q);
    
    if (levelsSnapshot.empty) {
      console.warn(`⚠️ No hay módulos para el año ${year}`);
      return { success: false, message: 'No hay módulos para este año' };
    }
    
    // 3. Crear batch para escritura eficiente
    const batch = writeBatch(db);
    
    // 4. Crear progreso para cada módulo
    levelsSnapshot.forEach((levelDoc) => {
      const levelId = levelDoc.id;
      const progressRef = doc(db, `users/${userId}/progress`, levelId);
      
      batch.set(progressRef, {
        nivelId: levelId,
        completado: false,
        fechaInicio: null,
        fechaCompletado: null,
        testResultado: null,
        tiempoTotal: 0,
        recursosVistos: [],
        notas: '',
        ultimaActualizacion: serverTimestamp()
      });
    });
    
    // 5. Ejecutar batch
    await batch.commit();
    
    console.log(`✅ Progreso creado para ${levelsSnapshot.size} módulos`);
    
    // 6. Actualizar contador en usuario
    await setDoc(userRef, {
      [`progreso.año${year}`]: {
        completado: false,
        nivelesCompletados: 0,
        totalNiveles: levelsSnapshot.size,
        fechaInicio: serverTimestamp(),
        fechaFin: null,
        promedio: 0,
        certificadoGenerado: false
      }
    }, { merge: true });
    
    console.log(`✅ Contador actualizado en usuario`);
    
    return { 
      success: true, 
      totalModules: levelsSnapshot.size,
      year: year 
    };
    
  } catch (error) {
    console.error('❌ Error inicializando progreso:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Inicializar progreso para todos los años de un estudiante
 */
export const initializeAllYearsProgress = async (userId) => {
  const results = [];
  
  // Para año 1
  const resultYear1 = await initializeStudentProgress(userId, 1);
  results.push({ year: 1, ...resultYear1 });
  
  // Para año 2
  const resultYear2 = await initializeStudentProgress(userId, 2);
  results.push({ year: 2, ...resultYear2 });
  
  return results;
};

/**
 * Función para usar desde la consola del navegador
 */
if (typeof window !== 'undefined') {
  window.initializeStudentProgress = initializeStudentProgress;
  window.initializeAllYearsProgress = initializeAllYearsProgress;
}