
document.addEventListener('DOMContentLoaded', function() {
  // Update login/logout button in navbar
  updateAuthButtons();
  
  // Authentication tab switching
  const authTabs = document.querySelectorAll('.auth-tab');
  const authForms = document.querySelectorAll('.auth-form');
  
  if (authTabs.length > 0 && authForms.length > 0) {
    authTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabType = tab.getAttribute('data-tab');
        
        // Update active tab
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding form
        authForms.forEach(form => {
          form.classList.remove('active');
          if (form.id === tabType + 'Form') {
            form.classList.add('active');
          }
        });
      });
    });

    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const errorMsg = document.getElementById('loginError');
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
          // Login successful
          localStorage.setItem('auth', 'true');
          localStorage.setItem('username', user.username);
          localStorage.setItem('role', user.role);
          
          errorMsg.style.display = 'none';
          
          // Redirect based on role
          if (user.role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'index.html';
          }
        } else {
          // Login failed
          errorMsg.textContent = 'Username atau password salah';
          errorMsg.style.display = 'block';
        }
      });
    }

    // Handle registration form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMsg = document.getElementById('registerError');
        
        // Validate passwords match
        if (password !== confirmPassword) {
          errorMsg.textContent = 'Password tidak cocok';
          errorMsg.style.display = 'block';
          return;
        }
        
        // Get existing users
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Check if username already exists
        if (users.some(u => u.username === username)) {
          errorMsg.textContent = 'Username sudah digunakan';
          errorMsg.style.display = 'block';
          return;
        }
        
        // Create new user
        const newUser = {
          username,
          email,
          password, // In a real app, you would hash this
          role: 'user', // Default role
          createdAt: new Date().toISOString()
        };
        
        // Add user to users array
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Create admin user if this is the first user
        if (users.length === 1) {
          const adminUser = {
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin',
            createdAt: new Date().toISOString()
          };
          users.push(adminUser);
          localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Auto login
        localStorage.setItem('auth', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('role', 'user');
        
        // Redirect to homepage
        window.location.href = 'index.html';
      });
    }
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Logout button in user profile
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }
  
  // Check for admin access
  checkAdminAccess();
});

// Function to update auth buttons in navbar
function updateAuthButtons() {
  const loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) return;
  
  const isAuthenticated = localStorage.getItem('auth') === 'true';
  const username = localStorage.getItem('username');
  
  if (isAuthenticated && username) {
    loginBtn.textContent = username;
    loginBtn.href = 'user.html';
  } else {
    loginBtn.textContent = 'Masuk';
    loginBtn.href = 'login.html';
  }
}

// Function to logout
function logout() {
  localStorage.removeItem('auth');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  window.location.href = 'index.html';
}

// Function to check admin access
function checkAdminAccess() {
  // Check if we're on the admin page
  if (window.location.pathname.includes('admin.html')) {
    const role = localStorage.getItem('role');
    
    if (role !== 'admin') {
      // Redirect non-admin users back to home
      window.location.href = 'index.html';
    }
  }
}

// Create initial admin user if needed
function createInitialUsers() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  
  if (users.length === 0) {
    const adminUser = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    
    users.push(adminUser);
    localStorage.setItem('users', JSON.stringify(users));
  }
}

// Initialize users
createInitialUsers();
