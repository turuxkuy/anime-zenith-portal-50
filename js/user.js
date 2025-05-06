
document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
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

// Function to load user profile
function loadUserProfile() {
  const isAuthenticated = localStorage.getItem('auth') === 'true';
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role') || 'user';
  
  const loginPrompt = document.getElementById('loginPrompt');
  const profileContainer = document.getElementById('profileContainer');
  
  if (!isAuthenticated || !username) {
    // Show login prompt
    if (loginPrompt) loginPrompt.style.display = 'block';
    if (profileContainer) profileContainer.style.display = 'none';
    return;
  }
  
  // Show profile
  if (loginPrompt) loginPrompt.style.display = 'none';
  if (profileContainer) profileContainer.style.display = 'block';
  
  // Get user data
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.username === username);
  
  if (!user) return;
  
  // Update profile info
  document.getElementById('profileUsername').textContent = user.username;
  document.getElementById('detailUsername').textContent = user.username;
  document.getElementById('detailEmail').textContent = user.email;
  document.getElementById('detailJoined').textContent = formatDate(user.createdAt);
  
  // Set role
  const userRoleElement = document.getElementById('userRole');
  const detailRoleElement = document.getElementById('detailRole');
  
  if (userRoleElement && detailRoleElement) {
    userRoleElement.textContent = capitalizeFirstLetter(user.role);
    detailRoleElement.textContent = capitalizeFirstLetter(user.role);
    
    if (user.role === 'vip') {
      userRoleElement.classList.add('vip');
    } else if (user.role === 'admin') {
      userRoleElement.classList.add('admin');
    } else {
      userRoleElement.classList.remove('vip', 'admin');
    }
  }
  
  // Show appropriate VIP card
  const regularUserCard = document.getElementById('regularUserCard');
  const vipUserCard = document.getElementById('vipUserCard');
  
  if (regularUserCard && vipUserCard) {
    if (user.role === 'vip' || user.role === 'admin') {
      regularUserCard.style.display = 'none';
      vipUserCard.style.display = 'block';
    } else {
      regularUserCard.style.display = 'block';
      vipUserCard.style.display = 'none';
    }
  }
}

// Function to handle change password
function handleChangePassword() {
  const username = localStorage.getItem('username');
  
  if (!username) return;
  
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
  
  // Get user data
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const userIndex = users.findIndex(u => u.username === username);
  
  if (userIndex === -1) return;
  
  // Verify current password
  if (users[userIndex].password !== currentPassword) {
    errorElement.textContent = 'Password saat ini salah';
    errorElement.style.display = 'block';
    return;
  }
  
  // Update password
  users[userIndex].password = newPassword;
  localStorage.setItem('users', JSON.stringify(users));
  
  // Close modal
  document.getElementById('changePasswordModal').style.display = 'none';
  
  // Reset form
  document.getElementById('changePasswordForm').reset();
  errorElement.style.display = 'none';
  
  // Show success message (you could add a toast or alert here)
  alert('Password berhasil diubah');
}

// Function to request VIP status
function requestVip() {
  const username = localStorage.getItem('username');
  
  if (!username) return;
  
  // In a real app, this would send a request to the server
  // For now, just show the modal
  const modal = document.getElementById('requestVipModal');
  if (modal) {
    modal.style.display = 'flex';
  }
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
