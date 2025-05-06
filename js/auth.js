
document.addEventListener('DOMContentLoaded', function() {
  // Tab switching functionality
  const authTabs = document.querySelectorAll('.auth-tab');
  const authForms = document.querySelectorAll('.auth-form');
  
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabTarget = tab.getAttribute('data-tab');
      
      // Update active tab
      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding form
      authForms.forEach(form => {
        form.classList.remove('active');
        if (form.id === tabTarget + 'Form') {
          form.classList.add('active');
        }
      });
    });
  });
  
  // Login form submission
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const errorElement = document.getElementById('loginError');
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Fetch user profile after login
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching user profile:', profileError);
          }
          
          // Store user data
          localStorage.setItem('auth', 'true');
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('username', profileData?.username || '');
          localStorage.setItem('role', profileData?.role || 'user');
          
          // Redirect to homepage
          window.location.href = 'index.html';
        }
      } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = 'Login gagal: ' + (error.message || 'Password atau email salah');
        errorElement.style.display = 'block';
      }
    });
  }
  
  // Register form submission
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('registerUsername').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const errorElement = document.getElementById('registerError');
      
      // Validate password match
      if (password !== confirmPassword) {
        errorElement.textContent = 'Password tidak cocok';
        errorElement.style.display = 'block';
        return;
      }
      
      try {
        // Register user with Supabase
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              username: username
            }
          }
        });
        
        if (error) throw error;
        
        // Create user profile
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: data.user.id,
                username: username,
                email: email,
                role: 'user'
              }
            ]);
            
          if (profileError) {
            console.error('Error creating profile:', profileError);
            throw new Error('Gagal membuat profil pengguna');
          }
          
          // Show success message and switch to login tab
          errorElement.textContent = 'Pendaftaran berhasil! Silakan masuk.';
          errorElement.style.color = '#4CAF50';
          errorElement.style.display = 'block';
          
          // Reset form
          registerForm.reset();
          
          // Switch to login tab after 2 seconds
          setTimeout(() => {
            document.querySelector('.auth-tab[data-tab="login"]').click();
          }, 2000);
        }
      } catch (error) {
        console.error('Registration error:', error);
        errorElement.textContent = 'Pendaftaran gagal: ' + (error.message || 'Terjadi kesalahan');
        errorElement.style.display = 'block';
      }
    });
  }
  
  // Check if user is already logged in
  const checkAuthStatus = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      // If on login page and already logged in, redirect to home
      if (window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
      }
    }
  };
  
  checkAuthStatus();
});

// Logout function (to be used in other pages)
async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    // Clear local storage
    localStorage.removeItem('auth');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    
    // Redirect to login page
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Gagal keluar: ' + (error.message || 'Terjadi kesalahan'));
  }
}

// Check if the user is authenticated (to be used in other pages)
async function checkAuth() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    // Redirect to login if not authenticated
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Get user role (to be used in other pages)
async function getUserRole() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    return null;
  }
  
  try {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.session.user.id)
      .single();
      
    if (error) throw error;
    
    return profileData?.role || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}

// Check if user is admin (to be used in admin pages)
async function checkAdminAuth() {
  const role = await getUserRole();
  if (role !== 'admin') {
    alert('Anda tidak memiliki hak akses admin');
    window.location.href = 'index.html';
    return false;
  }
  return true;
}
