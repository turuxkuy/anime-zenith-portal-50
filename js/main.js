
document.addEventListener('DOMContentLoaded', function() {
  console.log('Main.js loaded and executing');
  
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
    console.log('Updating navigation based on authentication status');
    
    // Check if supabase is defined
    if (typeof window.supabase === 'undefined') {
      console.error('Supabase is not defined in updateNavigation');
      return;
    }
    
    const { data } = await window.supabase.auth.getSession();
    const isAuthenticated = !!data.session;
    console.log('Authentication status:', isAuthenticated ? 'Logged in' : 'Not logged in');
    
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
      
      // Update existing user and admin links to be hidden
      document.querySelectorAll('.profile-link').forEach(link => {
        link.style.display = 'none';
      });
      
      if (document.getElementById('adminLink')) {
        document.getElementById('adminLink').style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error updating navigation:', error);
  }
}

// Function to load donghua list from Supabase
async function loadDonghuaList() {
  const donghuaGrid = document.getElementById('donghuaGrid');
  if (!donghuaGrid) {
    console.error('donghuaGrid element not found');
    return;
  }
  
  try {
    console.log('Loading donghua list...');
    
    // Show loading state
    donghuaGrid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    
    // Check if supabase is defined
    if (typeof window.supabase === 'undefined') {
      console.error('Supabase is not defined in loadDonghuaList');
      donghuaGrid.innerHTML = '<p class="error-message">Terjadi kesalahan: Supabase tidak tersedia</p>';
      return;
    }
    
    // Fetch donghua data from Supabase
    console.log('Fetching donghua data from Supabase...');
    const { data: donghuaData, error } = await window.supabase
      .from('donghua')
      .select('*')
      .order('title', { ascending: true });
      
    if (error) {
      console.error('Error fetching donghua data:', error);
      throw error;
    }
    
    console.log('Fetched donghua data:', donghuaData);
    
    // Clear the grid before adding new items
    donghuaGrid.innerHTML = '';
    
    if (!donghuaData || donghuaData.length === 0) {
      console.log('No donghua data available');
      donghuaGrid.innerHTML = '<p class="empty-message">Belum ada donghua tersedia.</p>';
      return;
    }

    // Create donghua cards for each item
    donghuaData.forEach((donghua) => {
      console.log('Creating card for donghua:', donghua.title, 'with ID:', donghua.id);
      
      const donghuaCard = document.createElement('a');
      donghuaCard.href = `donghua.html?id=${donghua.id}`;
      donghuaCard.className = 'donghua-card';
      donghuaCard.setAttribute('data-donghua-id', donghua.id);
      
      // Ensure poster_url is properly handled
      const posterUrl = donghua.poster_url || 'images/default-poster.jpg';
      console.log('Using poster URL:', posterUrl);
      
      donghuaCard.innerHTML = `
        <img src="${posterUrl}" alt="${donghua.title}" onerror="this.src='images/default-poster.jpg';">
        <div class="donghua-overlay">
          <h3 class="donghua-title">${donghua.title}</h3>
          <div class="donghua-meta">
            <span>${donghua.year || 'Tahun tidak tersedia'}</span>
            <span>${donghua.genre || 'Genre tidak tersedia'}</span>
            <span>${donghua.status || 'Status tidak tersedia'}</span>
          </div>
        </div>
      `;
      
      // Add click event listener to ensure the link works properly
      donghuaCard.addEventListener('click', function(e) {
        console.log(`Clicked on donghua card: ${donghua.id} - ${donghua.title}`);
        window.location.href = this.href;
      });
      
      donghuaGrid.appendChild(donghuaCard);
    });
    
    console.log('Donghua list loaded successfully');
  } catch (error) {
    console.error('Error loading donghua list:', error);
    if (donghuaGrid) {
      donghuaGrid.innerHTML = `<p class="error-message">Terjadi kesalahan saat memuat data: ${error.message || 'Tidak dapat terhubung ke database'}</p>`;
    }
  }
}
