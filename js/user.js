
// Main user profile page script
import { loadUserProfile } from './modules/profile-display.js';
import { requestVipStatus } from './modules/vip-management.js';
import { changePassword } from './modules/password-management.js';
import { logout } from './modules/auth-management.js';
import { openModal, closeModal, showToast } from './modules/ui-utils.js';

// Make functions available to the global scope for HTML event handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.logout = logout;
window.requestVipStatus = requestVipStatus;
window.changePassword = changePassword;

// Get elements from the DOM
document.addEventListener('DOMContentLoaded', async function() {
  console.log('User page loaded');

  // Check if Supabase client is available
  if (typeof window.supabase === 'undefined') {
    console.error("Supabase client not available");
    return;
  }

  // Check if user is logged in
  const isLoggedIn = await checkLoginStatus();
  const loginPrompt = document.getElementById('loginPrompt');
  const profileContainer = document.getElementById('profileContainer');
  const adminLink = document.getElementById('adminLink');
  const loginBtn = document.getElementById('loginBtn');
  const logoutButton = document.getElementById('logoutButton');
  
  if (isLoggedIn) {
    // User is logged in
    if (loginBtn) {
      loginBtn.textContent = 'Keluar';
      loginBtn.setAttribute('href', '#');
      loginBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        await logout();
      });
    }

    // Set up logout button event listener
    if (logoutButton) {
      console.log("Setting up logout button");
      logoutButton.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log("Logout button clicked");
        await logout();
      });
    }

    // Get current user data
    try {
      await loadUserProfile();
    } catch (error) {
      console.error("Error loading user profile:", error);
      showToast("Gagal memuat profil pengguna", "error");
    }

    // Show profile container, hide login prompt
    if (loginPrompt) loginPrompt.style.display = 'none';
    if (profileContainer) profileContainer.style.display = 'block';
  } else {
    // User is not logged in
    if (loginPrompt) loginPrompt.style.display = 'block';
    if (profileContainer) profileContainer.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
  }

  // Set up event listeners for change password modal
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', function() {
      openModal('changePasswordModal');
    });
  }

  // Set up event listeners for VIP request
  const requestVipBtn = document.getElementById('requestVipBtn');
  if (requestVipBtn) {
    requestVipBtn.addEventListener('click', async function() {
      try {
        await requestVipStatus();
        openModal('requestVipModal');
      } catch (error) {
        console.error("Error requesting VIP status:", error);
        showToast("Gagal meminta status VIP", "error");
      }
    });
  }

  // Set up event listeners for change password form
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      await changePassword();
    });
  }

  // Set up event listeners for closing modals
  const closeModalButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
  closeModalButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });
});
