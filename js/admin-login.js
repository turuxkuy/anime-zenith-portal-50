
// Here we'll create a proper admin login script
document.addEventListener('DOMContentLoaded', function() {
  console.log("Admin login script loaded");
  
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminLoginError = document.getElementById('adminLoginError');
  
  // Function to show toast message
  function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    toastContainer.appendChild(toast);

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
  
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Clear previous errors
      if (adminLoginError) adminLoginError.textContent = '';
      
      const email = adminLoginForm.querySelector('#adminEmail').value;
      const password = adminLoginForm.querySelector('#adminPassword').value;
      
      if (!email || !password) {
        if (adminLoginError) adminLoginError.textContent = 'Email dan password wajib diisi.';
        return;
      }
      
      try {
        console.log('Attempting admin login with:', { email });
        
        // First, authenticate with Supabase
        const { data, error } = await window.supabase.auth.signInWithPassword({
          email: email, 
          password: password
        });
        
        if (error) {
          console.error('Login error:', error);
          adminLoginError.textContent = `Login gagal: ${error.message}`;
          return;
        }
        
        if (!data.user) {
          adminLoginError.textContent = 'Login gagal: User tidak ditemukan';
          return;
        }
        
        console.log('Authentication successful, checking admin role');
        
        // Then check if they have admin role
        const { data: profileData, error: profileError } = await window.supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        if (profileError || !profileData) {
          console.error('Error fetching profile:', profileError);
          adminLoginError.textContent = 'Login gagal: Tidak dapat memverifikasi profil pengguna';
          await window.supabase.auth.signOut();
          return;
        }
        
        console.log('User role:', profileData.role);
        
        if (profileData.role !== 'admin') {
          console.warn('Non-admin tried to access admin page:', email);
          adminLoginError.textContent = 'Akses ditolak: Anda bukan administrator';
          await window.supabase.auth.signOut();
          return;
        }
        
        // Admin login successful, redirect to admin panel
        showToast('Login berhasil! Mengalihkan ke panel admin...', 'success');
        
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 1000);
        
      } catch (err) {
        console.error('Unexpected error during login:', err);
        adminLoginError.textContent = `Terjadi kesalahan: ${err.message}`;
      }
    });
  }
});
