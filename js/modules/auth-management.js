
// Module for authentication management functionality

// Function to log out
async function logout() {
  console.log("Attempting to logout...");
  try {
    // Clear any local storage items first
    localStorage.removeItem('auth');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    
    // Sign out from Supabase
    const { error } = await window.supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      throw error;
    }
    console.log("Logout successful, redirecting...");
    window.location.href = 'index.html';
  } catch (error) {
    console.error("Error logging out:", error);
    showToast("Gagal keluar", "error");
  }
}

// Import helper functions
import { showToast } from './ui-utils.js';

// Export functions for external use
export { logout };
