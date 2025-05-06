
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
  
  // Load donghua details
  loadDonghuaDetails();
});

// Function to update navigation (same as in main.js)
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

// Function to get URL parameters
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Function to load donghua details from Supabase
async function loadDonghuaDetails() {
  const donghuaId = getUrlParameter('id');
  if (!donghuaId) {
    window.location.href = 'index.html';
    return;
  }

  try {
    // Show loading state
    document.getElementById('donghuaBackdrop').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    
    // Fetch donghua data from Supabase
    const { data: donghua, error } = await supabase
      .from('donghua')
      .select('*')
      .eq('id', donghuaId)
      .single();
      
    if (error) throw error;
    
    if (!donghua) {
      window.location.href = 'index.html';
      return;
    }

    // Update page title
    document.title = `${donghua.title} - Zenith Donghua`;

    // Set backdrop image
    const backdropElement = document.getElementById('donghuaBackdrop');
    if (backdropElement) {
      backdropElement.style.backgroundImage = `linear-gradient(to bottom, rgba(26, 31, 44, 0.5), rgba(26, 31, 44, 0.9)), url('${donghua.backdrop_url || 'images/default-backdrop.jpg'}')`;
      backdropElement.style.backgroundSize = 'cover';
      backdropElement.style.backgroundPosition = 'center';
      backdropElement.innerHTML = ''; // Clear loading spinner
    }

    // Set poster image
    const posterElement = document.getElementById('donghuaPoster');
    if (posterElement) {
      posterElement.innerHTML = `<img src="${donghua.poster_url || 'images/default-poster.jpg'}" alt="${donghua.title}">`;
    }

    // Set donghua details
    document.getElementById('donghuaTitle').textContent = donghua.title;
    document.getElementById('donghuaYear').textContent = donghua.year;
    document.getElementById('donghuaGenre').textContent = donghua.genre;
    document.getElementById('donghuaStatus').textContent = donghua.status;
    document.getElementById('donghuaRating').textContent = donghua.rating;
    document.getElementById('donghuaSynopsis').textContent = donghua.synopsis;

    // Load episodes for this donghua
    loadEpisodes(donghuaId);
  } catch (error) {
    console.error('Error loading donghua details:', error);
    document.getElementById('donghuaBackdrop').innerHTML = `<p class="error-message">Terjadi kesalahan saat memuat data: ${error.message || 'Tidak dapat terhubung ke database'}</p>`;
  }
}

// Function to load episodes from Supabase
async function loadEpisodes(donghuaId) {
  const episodesList = document.getElementById('episodeList');
  if (!episodesList) return;

  try {
    // Show loading state
    episodesList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    
    // Fetch episodes data from Supabase
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('donghua_id', donghuaId)
      .order('episode_number', { ascending: true });
      
    if (error) throw error;

    // Clear the episodes list before adding new items
    episodesList.innerHTML = '';

    // Create episode items
    if (episodes.length === 0) {
      episodesList.innerHTML = '<p class="empty-message">Belum ada episode untuk donghua ini.</p>';
    } else {
      episodes.forEach(episode => {
        const episodeItem = document.createElement('a');
        episodeItem.href = `episode.html?id=${episode.id}&donghuaId=${donghuaId}`;
        episodeItem.className = 'episode-item';
        
        let vipBadge = '';
        if (episode.is_vip) {
          vipBadge = '<span class="episode-vip"><i class="fas fa-crown"></i> VIP</span>';
        }
        
        episodeItem.innerHTML = `
          <div class="episode-thumbnail">
            <img src="${episode.thumbnail_url || 'images/default-thumbnail.jpg'}" alt="Episode ${episode.episode_number}">
          </div>
          <div class="episode-info">
            <div class="episode-number">Episode ${episode.episode_number}</div>
            <h3 class="episode-title">${episode.title}</h3>
          </div>
          ${vipBadge}
        `;
        
        episodesList.appendChild(episodeItem);
      });
    }
  } catch (error) {
    console.error('Error loading episodes:', error);
    episodesList.innerHTML = `<p class="error-message">Terjadi kesalahan saat memuat episode: ${error.message || 'Tidak dapat terhubung ke database'}</p>`;
  }
}

// Helper function to format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}
