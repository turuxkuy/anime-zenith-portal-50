
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

// Function to load user profile
async function loadUserProfile() {
  console.log("Loading user profile...");
  try {
    // Get user from authenticated session
    const { data: { user }, error: authError } = await window.supabase.auth.getUser();
    
    if (authError) {
      console.error("Auth error:", authError);
      throw authError;
    }
    
    if (!user) {
      console.log("No authenticated user found");
      return;
    }

    console.log("User authenticated:", user.id);

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      throw profileError;
    }

    if (!profile) {
      console.error("Profile not found for user:", user.id);
      showToast("Profil tidak ditemukan", "error");
      return;
    }

    console.log("User profile loaded:", profile);

    // Update the DOM with user info
    updateUserInterface(profile, user);
    
    // Check if user is admin and show admin link if true
    const adminLink = document.getElementById('adminLink');
    if (adminLink && profile.role === 'admin') {
      adminLink.style.display = 'block';
    }

  } catch (error) {
    console.error("Error loading user profile:", error);
    showToast("Terjadi kesalahan saat memuat profil", "error");
  }
}

// Function to update the user interface with profile data
function updateUserInterface(profile, user) {
  // Update username
  const profileUsername = document.getElementById('profileUsername');
  const detailUsername = document.getElementById('detailUsername');
  if (profileUsername) profileUsername.textContent = profile.username || user.email.split('@')[0];
  if (detailUsername) detailUsername.textContent = profile.username || user.email.split('@')[0];

  // Update email
  const detailEmail = document.getElementById('detailEmail');
  if (detailEmail) detailEmail.textContent = user.email;

  // Update role badge
  const userRole = document.getElementById('userRole');
  const detailRole = document.getElementById('detailRole');
  
  // Format the role text for display
  const roleText = profile.role === 'admin' ? 'Admin' : profile.role === 'vip' ? 'VIP' : 'Regular';
  
  if (userRole) {
    userRole.textContent = roleText;
    userRole.className = `user-role ${profile.role}`;
  }
  
  if (detailRole) detailRole.textContent = roleText;

  // Update join date
  const detailJoined = document.getElementById('detailJoined');
  if (detailJoined && profile.created_at) {
    const joinDate = new Date(profile.created_at);
    detailJoined.textContent = joinDate.toLocaleDateString('id-ID');
  }

  // Show/hide appropriate cards based on role
  const regularUserCard = document.getElementById('regularUserCard');
  const vipUserCard = document.getElementById('vipUserCard');
  const vipExpirationContainer = document.getElementById('vipExpirationContainer');
  const vipExpirationDate = document.getElementById('vipExpirationDate');
  const detailExpiration = document.getElementById('detailExpiration');

  // Handle VIP status and expiration date
  if (profile.role === 'vip') {
    if (regularUserCard) regularUserCard.style.display = 'none';
    if (vipUserCard) vipUserCard.style.display = 'block';
    
    // Handle expiration date display
    if (profile.expiration_date) {
      const expDate = new Date(profile.expiration_date);
      const formattedDate = expDate.toLocaleString('id-ID', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      
      if (vipExpirationContainer) vipExpirationContainer.style.display = 'block';
      if (vipExpirationDate) vipExpirationDate.textContent = formattedDate;
      if (detailExpiration) detailExpiration.textContent = formattedDate;
    } else {
      if (vipExpirationDate) vipExpirationDate.textContent = 'Tidak Ada Batas';
      if (detailExpiration) detailExpiration.textContent = 'Tidak Ada Batas';
    }
  } else {
    if (regularUserCard) regularUserCard.style.display = 'block';
    if (vipUserCard) vipUserCard.style.display = 'none';
    if (vipExpirationContainer) vipExpirationContainer.style.display = 'none';
  }
}

// Function to request VIP status
async function requestVipStatus() {
  try {
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError) throw userError;
    if (!user) throw new Error("User not authenticated");
    
    // Update profile to set requested_vip flag
    const { error } = await window.supabase
      .from('profiles')
      .update({ requested_vip: true })
      .eq('id', user.id);
    
    if (error) throw error;
    
    console.log("VIP status requested successfully");
    return true;
  } catch (error) {
    console.error("Error requesting VIP status:", error);
    throw error;
  }
}

// Function to change password
async function changePassword() {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;
  const passwordError = document.getElementById('passwordError');

  // Reset error message
  if (passwordError) passwordError.textContent = '';

  // Validate passwords
  if (newPassword !== confirmNewPassword) {
    if (passwordError) passwordError.textContent = 'Password baru tidak cocok dengan konfirmasi';
    return;
  }

  try {
    // Change password
    const { error } = await window.supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    // Password changed successfully
    showToast('Password berhasil diubah', 'success');
    closeModal('changePasswordModal');
    
    // Clear form
    document.getElementById('changePasswordForm').reset();
  } catch (error) {
    console.error("Error changing password:", error);
    if (passwordError) passwordError.textContent = error.message || 'Gagal mengubah password';
  }
}

// Function to log out
async function logout() {
  try {
    const { error } = await window.supabase.auth.signOut();
    if (error) throw error;
    window.location.href = 'index.html';
  } catch (error) {
    console.error("Error logging out:", error);
    showToast("Gagal keluar", "error");
  }
}

// Function to open modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'block';
}

// Function to close modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

// Function to show toast message
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
