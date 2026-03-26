import { FirestoreError } from 'firebase/firestore';

export const showError = (error: unknown, defaultMessage = 'An error occurred'): string => {
  console.error('Error:', error);
  
  if (error instanceof FirestoreError) {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to perform this action.';
      case 'unauthenticated':
        return 'Please sign in to continue.';
      case 'not-found':
        return 'The requested resource was not found.';
      default:
        return error.message || defaultMessage;
    }
  }
  
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  
  return defaultMessage;
};
