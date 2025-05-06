
document.addEventListener('DOMContentLoaded', function() {
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
  
  // Load donghua data for the homepage
  loadDonghuaList();
});

// Function to update navigation based on authentication
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

// Function to load donghua list from Supabase
async function loadDonghuaList() {
  const donghuaGrid = document.getElementById('donghuaGrid');
  if (!donghuaGrid) return;
  
  try {
    // Show loading state
    donghuaGrid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    
    // Fetch donghua data from Supabase
    const { data: donghuaData, error } = await supabase
      .from('donghua')
      .select('*')
      .order('title', { ascending: true });
      
    if (error) throw error;
    
    // Clear the grid before adding new items
    donghuaGrid.innerHTML = '';
    
    if (donghuaData.length === 0) {
      donghuaGrid.innerHTML = '<p class="empty-message">Belum ada donghua tersedia.</p>';
      return;
    }

    // Create donghua cards for each item
    donghuaData.forEach((donghua) => {
      const donghuaCard = document.createElement('a');
      donghuaCard.href = `donghua.html?id=${donghua.id}`;
      donghuaCard.className = 'donghua-card';
      donghuaCard.innerHTML = `
        <img src="${donghua.poster_url || 'images/default-poster.jpg'}" alt="${donghua.title}">
        <div class="donghua-overlay">
          <h3 class="donghua-title">${donghua.title}</h3>
          <div class="donghua-meta">
            <span>${donghua.year}</span>
            <span>${donghua.genre}</span>
            <span>${donghua.status}</span>
          </div>
        </div>
      `;
      donghuaGrid.appendChild(donghuaCard);
    });
  } catch (error) {
    console.error('Error loading donghua list:', error);
    donghuaGrid.innerHTML = `<p class="error-message">Terjadi kesalahan saat memuat data: ${error.message || 'Tidak dapat terhubung ke database'}</p>`;
  }
}
