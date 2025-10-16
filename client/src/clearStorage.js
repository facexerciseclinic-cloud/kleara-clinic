// Development helper to clear localStorage and force refresh
if (typeof window !== 'undefined') {
  console.log('🔧 Development Mode: Clearing localStorage...');
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Storage cleared. App should load with mock user.');
}