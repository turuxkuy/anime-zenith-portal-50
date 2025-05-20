
// Handle admin login form submission
document.addEventListener('DOMContentLoaded', function() {
  console.log('Admin login script loaded');
  
  // Get the admin login form
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminLoginError = document.getElementById('adminLoginError');
  
  if (adminLoginForm) {
    console.log('Admin login form found');
    adminLoginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('adminEmail').value;
      const password = document.getElementById('adminPassword').value;
      
      console.log('Attempting admin login for:', email);
      
      try {
        // Sign in with email and password
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (error) {
          console.error('Admin login error:', error);
          adminLoginError.textContent = error.message || 'Login gagal';
          adminLoginError.style.display = 'block';
          return;
        }
        
        console.log('Login successful, checking if admin');
        
        // Check if the user is an admin
        if (data.user) {
          // Get user profile to check role
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            adminLoginError.textContent = 'Gagal memverifikasi peran admin';
            adminLoginError.style.display = 'block';
            return;
          }
          
          // Check if user has admin role
          if (profileData && profileData.role === 'admin') {
            console.log('User is admin, redirecting to admin panel');
            
            // Store admin data
            localStorage.setItem('auth', 'true');
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('role', 'admin');
            
            // Redirect to admin panel
            window.location.href = 'admin.html';
          } else {
            console.error('User is not an admin');
            adminLoginError.textContent = 'Anda tidak memiliki hak akses admin';
            adminLoginError.style.display = 'block';
          }
        }
      } catch (error) {
        console.error('Admin login error:', error);
        adminLoginError.textContent = 'Login gagal: ' + (error.message || 'Terjadi kesalahan');
        adminLoginError.style.display = 'block';
      }
    });
  }
});
