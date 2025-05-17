
// Module for password management functionality

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

// Export functions for external use
export { changePassword };
