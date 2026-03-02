import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider } from 'firebase/auth';
import { store } from '../store/store';
import { setSigningUp } from '../store/slices/authSlice';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({ 
    webClientId: '533489391926-07aqn2mdo5ngs0bgtiilb0thd48hke5b.apps.googleusercontent.com', // Required for Android
    // iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', 
    offlineAccess: false, 
    forceCodeForRefreshToken: true,
  });
};

export const signInWithGoogle = async () => {
  try {
    store.dispatch(setSigningUp(false));
    // Check if Google Play Services are available (Android only)
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Get user's ID token
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;
    
    if (!idToken) {
      throw new Error('Failed to retrieve ID token');
    }
    
    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken);
    
    return googleCredential;
  } catch (error: any) {
    let errorMessage = 'Google sign in failed';
    
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      errorMessage = 'Sign in cancelled';
    } else if (error.code === statusCodes.IN_PROGRESS) {
      errorMessage = 'Sign in already in progress';
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      errorMessage = 'Google Play Services not available';
    } else {
      console.error('Google Sign-In Error:', error);
    }
    
    throw new Error(errorMessage);
  }
};

export const isSignedInWithGoogle = async () => {
  const currentUser = await GoogleSignin.getCurrentUser();
  return currentUser !== null;
};

export const getCurrentGoogleUser = async () => {
  return await GoogleSignin.getCurrentUser();
};