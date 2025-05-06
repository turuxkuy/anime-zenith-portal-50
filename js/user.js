
document.addEventListener('DOMContentLoaded', async function() {
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }

  // Update navigation based on auth status
  updateNavigation();
  
  // Check if user is authenticated
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    // Redirect handled by checkAuth
    return;
  }
  
  // Load user profile
  loadUserProfile();
  
  // Handle change password button
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', function() {
      const modal = document.getElementById('changePasswordModal');
      if (modal) {
        modal.style.display = 'flex';
      }
    });
  }
  
  // Handle VIP button
  const requestVipBtn = document.getElementById('requestVipBtn');
  if (requestVipBtn) {
    requestVipBtn.addEventListener('click', requestVip);
  }
  
  // Handle logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }
  
  // Handle change password form
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleChangePassword();
    });
  }
  
  // Close modals
  const closeButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // Close modal by clicking outside
  window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
});

// Function to update navigation (same as in other files)
async function updateNavigation() {
  try {
    const { data } = await supabase.auth.getSession();
    const isAuthenticated = !!data.session;
    
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;
    
    // Get current navigation items
    const currentNavItems = Array.from(navMenu.querySelectorAll('li a'));
    const hasLoginLink = currentNavItems.some(link => link.href.includes('login.html'));
    const hasUserLink = currentNavItems.some(link => link.href.includes('user.html'));
    const hasAdminLink = currentNavItems.some(link => link.href.includes('admin.html'));
    
    if (isAuthenticated) {
      // User is logged in
      const role = localStorage.getItem('role') || 'user';
      
      // Remove login link if it exists
      if (hasLoginLink) {
        const loginItem = Array.from(navMenu.querySelectorAll('li')).find(li => 
          li.querySelector('a')?.href.includes('login.html')
        );
        if (loginItem) loginItem.remove();
      }
      
      // Add user link if it doesn't exist
      if (!hasUserLink) {
        const userItem = document.createElement('li');
        userItem.innerHTML = `<a href="user.html">Akun</a>`;
        navMenu.appendChild(userItem);
      }
      
      // Add admin link if admin and doesn't exist
      if (role === 'admin' && !hasAdminLink) {
        const adminItem = document.createElement('li');
        adminItem.innerHTML = `<a href="admin.html">Admin</a>`;
        navMenu.appendChild(adminItem);
      }
    } else {
      // User is not logged in
      
      // Add login link if it doesn't exist
      if (!hasLoginLink) {
        const loginItem = document.createElement('li');
        loginItem.innerHTML = `<a href="login.html">Masuk</a>`;
        navMenu.appendChild(loginItem);
      }
      
      // Remove user link if it exists
      if (hasUserLink) {
        const userItem = Array.from(navMenu.querySelectorAll('li')).find(li => 
          li.querySelector('a')?.href.includes('user.html')
        );
        if (userItem) userItem.remove();
      }
      
      // Remove admin link if it exists
      if (hasAdminLink) {
        const adminItem = Array.from(navMenu.querySelectorAll('li')).find(li => 
          li.querySelector('a')?.href.includes('admin.html')
        );
        if (adminItem) adminItem.remove();
      }
    }
  } catch (error) {
    console.error('Error updating navigation:', error);
  }
}

// Function to load user profile from Supabase
async function loadUserProfile() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      window.location.href = 'login.html';
      return;
    }
    
    const userId = sessionData.session.user.id;
    
    // Get user profile from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    if (!profile) {
      console.error('Profile not found');
      return;
    }
    
    // Update profile info
    document.getElementById('profileUsername').textContent = profile.username;
    document.getElementById('detailUsername').textContent = profile.username;
    document.getElementById('detailEmail').textContent = profile.email || sessionData.session.user.email;
    document.getElementById('detailJoined').textContent = formatDate(profile.created_at);
    
    // Set role
    const userRoleElement = document.getElementById('userRole');
    const detailRoleElement = document.getElementById('detailRole');
    
    if (userRoleElement && detailRoleElement) {
      userRoleElement.textContent = capitalizeFirstLetter(profile.role);
      detailRoleElement.textContent = capitalizeFirstLetter(profile.role);
      
      if (profile.role === 'vip') {
        userRoleElement.classList.add('vip');
      } else if (profile.role === 'admin') {
        userRoleElement.classList.add('admin');
      } else {
        userRoleElement.classList.remove('vip', 'admin');
      }
    }
    
    // Show appropriate VIP card
    const regularUserCard = document.getElementById('regularUserCard');
    const vipUserCard = document.getElementById('vipUserCard');
    
    if (regularUserCard && vipUserCard) {
      if (profile.role === 'vip' || profile.role === 'admin') {
        regularUserCard.style.display = 'none';
        vipUserCard.style.display = 'block';
      } else {
        regularUserCard.style.display = 'block';
        vipUserCard.style.display = 'none';
      }
    }
    
    // Update local storage with latest profile info
    localStorage.setItem('username', profile.username);
    localStorage.setItem('role', profile.role);
  } catch (error) {
    console.error('Error loading profile:', error);
    showToast('Gagal memuat profil: ' + error.message, 'error');
  }
}

// Function to handle change password
async function handleChangePassword() {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;
  const errorElement = document.getElementById('passwordError');
  
  // Validate passwords
  if (newPassword !== confirmNewPassword) {
    errorElement.textContent = 'Password baru tidak cocok';
    errorElement.style.display = 'block';
    return;
  }
  
  try {
    // First, get the user's email
    const { data: user } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Pengguna tidak ditemukan');
    
    // Change password using Supabase
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    // Close modal
    document.getElementById('changePasswordModal').style.display = 'none';
    
    // Reset form
    document.getElementById('changePasswordForm').reset();
    errorElement.style.display = 'none';
    
    // Show success message
    showToast('Password berhasil diubah', 'success');
  } catch (error) {
    console.error('Error changing password:', error);
    errorElement.textContent = 'Gagal mengubah password: ' + error.message;
    errorElement.style.display = 'block';
  }
}

// Function to request VIP status
function requestVip() {
  // In a real app, this would send a request to the server
  // For now, just show the modal
  const modal = document.getElementById('requestVipModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

// Helper function to show toast messages
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  
  if (!toastContainer) {
    // Create toast container if it doesn't exist
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  document.getElementById('toastContainer').appendChild(toast);
  
  // Automatically remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Helper function to format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
