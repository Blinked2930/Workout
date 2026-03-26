// This is a test file to verify environment variables are being loaded correctly
export const envTest = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ API Key is set' : '❌ API Key is missing',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Auth Domain is set' : '❌ Auth Domain is missing',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Project ID is set' : '❌ Project ID is missing',
};

console.log('Environment Variables Test:');
if (envTest && typeof envTest === 'object') {
  Object.entries(envTest).forEach(([key, value]) => {
    if (value && typeof value === 'string') {
      console.log(`${key}: ${value}`);
      
      // If the value is missing, also log the actual value (for debugging, but be careful with sensitive data)
      if (value.startsWith('❌')) {
        console.log(`  Actual value:`, import.meta.env[`VITE_${key}`]);
      }
    }
  });
}
