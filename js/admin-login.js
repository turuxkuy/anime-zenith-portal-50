
document.addEventListener('DOMContentLoaded', function() {
  // Check if Supabase JS is loaded
  if (typeof supabase === 'undefined') {
    console.error('Supabase client is not loaded. Make sure to include supabase-config.js');
    return;
  }
  
  // Check if already logged in
  checkAdminAuth().then(isAdmin => {
    if (isAdmin) {
      window.location.href = 'admin.html';
    }
  });
  
  // Handle admin login form submission
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminLoginError = document.getElementById('adminLoginError');
  
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('adminEmail').value;
      const password = document.getElementById('adminPassword').value;
      
      if (!email || !password) {
        adminLoginError.textContent = 'Email dan password harus diisi';
        adminLoginError.style.display = 'block';
        return;
      }
      
      try {
        // Attempt to sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Check if user is an admin
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) throw profileError;
          
          if (profileData?.role !== 'admin') {
            // Not an admin, sign out
            await supabase.auth.signOut();
            throw new Error('Akun Anda tidak memiliki hak akses admin');
          }
          
          // Store admin status
          localStorage.setItem('auth', 'true');
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('role', 'admin');
          
          // Redirect to admin panel
          window.location.href = 'admin.html';
        }
      } catch (error) {
        console.error('Login error:', error);
        adminLoginError.textContent = error.message || 'Login gagal. Periksa email dan password Anda.';
        adminLoginError.style.display = 'block';
      }
    });
  }
});

// Function to check if the user is admin
async function checkAdminAuth() {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      return false;
    }
    
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.session.user.id)
      .single();
      
    if (error || !profileData) {
      return false;
    }
    
    return profileData.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
