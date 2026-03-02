// hooks/useAuth.ts
import { useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading, setError } from '../store/slices/authSlice';
import { RootState } from '../store/store';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, isSigningUp, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = auth().onAuthStateChanged(
      (firebaseUser) => {
        if (firebaseUser) {
          // Map Firebase user to our User type
          const user = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            phoneNumber: firebaseUser.phoneNumber,
            emailVerified: firebaseUser.emailVerified,
          };
          dispatch(setUser(user));
        } else {
          dispatch(setUser(null));
        }
      },
      
    );

    return unsubscribe;
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isSigningUp,
    error,
  };
};