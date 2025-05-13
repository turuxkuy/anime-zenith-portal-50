
document.addEventListener('DOMContentLoaded', function() {
  console.log("Auth.js loaded");
  
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
    console.log("Login form found");
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const errorElement = document.getElementById('loginError');
      
      console.log("Attempting login for email:", email);
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (error) {
          console.error('Login error:', error);
          errorElement.textContent = 'Login gagal: ' + (error.message || 'Password atau email salah');
          errorElement.style.display = 'block';
          return;
        }
        
        console.log('Login successful, user data:', data);
        
        if (data.user) {
          // Fetch user profile after login
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            // Continue login process even if profile fetch fails
          } else {
            console.log('Profile data retrieved:', profileData);
          }
          
          // Store user data
          localStorage.setItem('auth', 'true');
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('username', profileData?.username || email.split('@')[0]);
          localStorage.setItem('role', profileData?.role || 'user');
          
          console.log('Auth data stored in localStorage');
          
          // Redirect to homepage
          window.location.href = 'index.html';
        }
      } catch (error) {
        console.error('Login error (catch):', error);
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
        console.log('Calling create-user Edge Function to create user with email:', email, 'and username:', username);
        
        // Use the create-user Edge Function instead of direct signUp
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: email,
            password: password,
            username: username,
            role: 'user'
          }
        });
        
        console.log('Edge function response:', data, error);
        
        if (error) {
          console.error('Registration error from Edge Function:', error);
          throw new Error('Gagal membuat pengguna: ' + (error.message || ''));
        }
        
        if (data && data.user) {
          console.log('User created successfully through Edge Function:', data.user);
          
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
        } else {
          throw new Error('Respons fungsi tidak valid');
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
    console.log("Checking auth status...");
    try {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        console.log("User is logged in, session:", data.session);
        // Store essential auth data in localStorage for easier access
        localStorage.setItem('auth', 'true');
        localStorage.setItem('userId', data.session.user.id);
        
        // Fetch profile data to get username and role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, role')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileData) {
          localStorage.setItem('username', profileData.username);
          localStorage.setItem('role', profileData.role || 'user');
          console.log("User profile loaded:", profileData);
        } else if (profileError) {
          console.error("Error loading profile:", profileError);
          
          // Try to create a profile if it doesn't exist
          const { data: userData } = await supabase.auth.getUser();
          if (userData && userData.user) {
            const username = userData.user.user_metadata?.username || userData.user.email?.split('@')[0] || 'User';
            const { error: createError } = await supabase
              .from('profiles')
              .insert([{ 
                id: data.session.user.id,
                username: username,
                email: userData.user.email,
                role: 'user'
              }]);
              
            if (createError) {
              console.error("Failed to create profile:", createError);
            } else {
              console.log("Profile created for existing user");
              localStorage.setItem('username', username);
              localStorage.setItem('role', 'user');
            }
          }
        }
        
        // If on login page and already logged in, redirect to home
        if (window.location.pathname.includes('login.html')) {
          window.location.href = 'index.html';
        }
        
        // Update UI elements based on auth status
        updateAuthUI(true);
      } else {
        console.log("No active session found");
        // Clear localStorage auth data
        localStorage.removeItem('auth');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        updateAuthUI(false);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      updateAuthUI(false);
    }
  };
  
  // Update UI based on auth status
  function updateAuthUI(isLoggedIn) {
    console.log("Updating UI based on login status:", isLoggedIn);
    const loginBtn = document.getElementById('loginBtn');
    const profileLinks = document.querySelectorAll('.profile-link');
    const adminLink = document.getElementById('adminLink');
    
    if (isLoggedIn) {
      // User is logged in
      if (loginBtn) loginBtn.style.display = 'none';
      
      // Show profile links
      profileLinks.forEach(link => {
        if (link) link.style.display = 'inline-block';
      });
      
      // Check if user is admin and show admin link
      const userRole = localStorage.getItem('role');
      console.log("User role:", userRole);
      if (adminLink && userRole === 'admin') {
        adminLink.style.display = 'inline-block';
      } else if (adminLink) {
        adminLink.style.display = 'none';
      }
    } else {
      // User is not logged in
      if (loginBtn) loginBtn.style.display = 'inline-block';
      
      // Hide profile and admin links
      profileLinks.forEach(link => {
        if (link) link.style.display = 'none';
      });
      
      if (adminLink) adminLink.style.display = 'none';
    }
  }
  
  // Execute auth check on page load
  checkAuthStatus();
});

// Logout function (to be used in other pages)
async function logoutUser() {
  console.log("Attempting to log out user");
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      alert('Gagal keluar: ' + (error.message || 'Terjadi kesalahan'));
      return;
    }
    
    console.log("User logged out successfully");
    
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
