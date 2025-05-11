
document.addEventListener('DOMContentLoaded', function() {
  console.log("Admin login page loaded");

  // Get the admin login form
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminLoginError = document.getElementById('adminLoginError');

  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('adminEmail').value;
      const password = document.getElementById('adminPassword').value;
      
      try {
        // Clear any previous errors
        adminLoginError.textContent = '';
        
        // Attempt to sign in
        const { data: { session }, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (error) throw error;
        
        if (!session) {
          throw new Error('No session returned');
        }
        
        console.log("Login successful, getting user profile");
        
        // Check if user is an admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) throw profileError;
        
        if (!profile || profile.role !== 'admin') {
          // User is not an admin, sign them out
          await supabase.auth.signOut();
          throw new Error('Anda tidak memiliki akses admin');
        }
        
        // Store admin status in localStorage for client-side checks
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('role', profile.role);
        
        // Redirect to admin page
        window.location.href = 'admin.html';
      } catch (error) {
        console.error('Login failed:', error);
        adminLoginError.textContent = error.message || 'Login gagal, silahkan coba kembali';
      }
    });
  }
  
  // Auto redirect if already logged in as admin
  checkAdminAuth().then(isAdmin => {
    if (isAdmin) {
      window.location.href = 'admin.html';
    }
  });
  
  // Function to check if user is admin
  async function checkAdminAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return false;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      return profile?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
});
