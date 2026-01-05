import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../services/firebase/config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (user) => {
    if (!user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    try {
      console.log('=== DEBUG ===');
      console.log('Usuario autenticado UID:', user.uid);
      console.log('Usuario autenticado email:', user.email);

      // 1. Cargar solo los datos principales del usuario
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      console.log('Documento encontrado?:', userDoc.exists());

      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('Datos cargados:', data);
        // ... resto del código
      } else {
        console.log('ERROR: No existe documento con UID:', user.uid);
        console.log('Verifica que exista en colección "users"');

        // Crear documento automáticamente si no existe
        const newUserData = {
          uid: user.uid,
          email: user.email,
          nombre: user.email?.split('@')[0] || 'Estudiante',
          rol: 'estudiante',
          fechaRegistro: new Date().toISOString(),
          ultimoAcceso: new Date().toISOString(),
          progreso: {
            año1: {
              completado: false,
              nivelesCompletados: 0,
              totalNiveles: 6
            },
            año2: {
              completado: false,
              nivelesCompletados: 0,
              totalNiveles: 8
            }
          }
        };

        // Crear documento automáticamente
        await setDoc(userRef, newUserData);
        console.log('Documento creado automáticamente');
        setUserData(newUserData);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }

  const updateUserData = async (updates) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        ...updates,
        ultimoAcceso: serverTimestamp()
      });

      // Actualizar el estado local
      setUserData(prev => ({ ...prev, ...updates }));
      return true;
    } catch (error) {
      console.error("Error actualizando datos del usuario:", error);
      return false;
    }
  };


  // Observador de autenticación
  useEffect(() => {
    console.log('👤 AuthProvider: Inicializando...');

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('👤 Firebase Auth State Changed:', {
        hasUser: !!user,
        email: user?.email,
        uid: user?.uid,
        timestamp: new Date().toISOString()
      });

      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Función de login
  const login = async (email, password) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await loadUserData(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: error.message };
    }
  };

  // Función de registro
  const register = async (email, password, userData) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Crear documento del usuario en Firestore
      const userDoc = {
        ...userData,
        uid: userCredential.user.uid,
        email: email,
        rol: 'estudiante',
        fechaRegistro: new Date().toISOString(),
        ultimoAcceso: new Date().toISOString(),
        progreso: {
          año1: {
            completado: false,
            nivelesAprobados: 0,
            nivelesCompletados: 0,
            promedioPuntaje: 0,
            totalNiveles: 6
          },
          año2: {
            completado: false,
            nivelesAprobados: 0,
            nivelesCompletados: 0,
            promedioPuntaje: 0,
            totalNiveles: 8
          }
        }
      };

      // Guardar en Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

      setUserData(userDoc);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Error en reset password:', error);
      return { success: false, error: error.message };
    }
  };



  return (
    <AuthContext.Provider value={{
      currentUser,
      userData,
      loading,
      login,
      register,
      logout,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);