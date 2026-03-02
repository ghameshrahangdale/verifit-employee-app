// services/AuthService.ts
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { store } from '../store/store';
import { setUser, setLoading, setError, logout, setSigningUp } from '../store/slices/authSlice';

// User type matching Firebase user structure
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
}

// Convert Firebase user to our User type
const mapFirebaseUser = (firebaseUser: FirebaseAuthTypes.User): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
  phoneNumber: firebaseUser.phoneNumber,
  emailVerified: firebaseUser.emailVerified,
});

export const AuthService = {
  // Email/Password Login
  async loginWithEmail(email: string, password: string): Promise<void> {
    try {
    store.dispatch(setSigningUp(false));

      // store.dispatch(setLoading(true));
      // store.dispatch(setError(null));
      
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = mapFirebaseUser(userCredential.user);
      store.dispatch(setUser(user as any));
    } catch (error: any) {
      const errorCode = error?.code || error?.message || 'unknown-error';
      const errorMessage = this.getErrorMessage(errorCode);
      // store.dispatch(setError(errorMessage));
      // store.dispatch(setLoading(false));
      throw new Error(errorMessage);
    }
  },

  // Email/Password Signup
async signupWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<void> {
  try {
   
    store.dispatch(setSigningUp(true));
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);

    console.log(userCredential);

    await userCredential.user.updateProfile({
      displayName: displayName,
    });
    await auth().signOut();
    
    return; 
  } catch (error: any) {
    const errorCode = error?.code || error?.message || 'unknown-error';
    const errorMessage = this.getErrorMessage(errorCode);
    
    throw new Error(errorMessage);
  }
},

  // Google Sign-In
  async signInWithGoogle(): Promise<void> {
    try {
      store.dispatch(setLoading(true));
      
      // Get the user's ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('Failed to get ID token from Google Sign-In');
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign in with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      const user = mapFirebaseUser(userCredential.user);
      store.dispatch(setUser(user as any));
    } catch (error: any) {
      const errorCode = error?.code || error?.message || 'unknown-error';
      const errorMessage = this.getErrorMessage(errorCode);
      store.dispatch(setError(errorMessage));
      store.dispatch(setLoading(false));
      throw new Error(errorMessage);
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      // Sign out from Firebase
      await auth().signOut();
      
      try {
        // Sign out from Google if applicable
        await GoogleSignin.signOut();
      } catch (error) {
        // Ignore Google sign out errors
      }
      
      // Clear user from Redux
      store.dispatch(logout());
    } catch (error: any) {
      store.dispatch(setError(error.message));
      throw new Error(error.message);
    }
  },

  // Clear error
  clearError(): void {
    store.dispatch(setError(null));
  },

  // Get current user from Redux store
  getCurrentUser(): User | null {
    const state = store.getState();
    return state.auth.user;
  },

  // Error message mapper
  getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-credential': 'Incorrect email or password',
      'auth/email-already-in-use': 'Email already in use',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/account-exists-with-different-credential':
        'Account already exists with different credentials',
    };

    if (errorCode.includes('invalid-credential')) {
      return 'Incorrect email or password';
    }

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }
};