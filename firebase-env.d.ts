declare module 'firebase/auth/react-native' {
  import { Persistence } from 'firebase/auth';
  export const getReactNativePersistence: (storage: any) => Persistence;
}