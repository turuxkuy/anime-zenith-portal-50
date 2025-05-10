
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Donghua page loaded');
  
  // Check if supabase exists immediately
  if (typeof window.supabase === 'undefined') {
    console.error('CRITICAL ERROR: Supabase is not defined in donghua.js');
    document.getElementById('donghuaBackdrop').innerHTML = '<p class="error-message">Terjadi kesalahan: Supabase tidak terdeteksi</p>';
    document.getElementById('donghuaTitle').textContent = 'Error';
    document.getElementById('donghuaSynopsis').textContent = 'Terjadi kesalahan saat memuat data donghua: supabase is not defined';
    return; // Exit early if supabase is not available
  } else {
    console.log('Supabase is defined and available in donghua.js');
  }
  
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }

  // Check authentication status and update navigation
  await updateNavigation();
  
  // Load donghua details
  loadDonghuaDetails();
});

// Function to update navigation based on auth status
async function updateNavigation() {
  try {
    if (typeof window.supabase === 'undefined') {
      console.error('Supabase is not defined in updateNavigation');
      return;
    }
    
    const { data } = await window.supabase.auth.getSession();
    const isAuthenticated = !!data.session;
    
    const loginBtn = document.getElementById('loginBtn');
    const profileLinks = document.querySelectorAll('.profile-link');
    const adminLink = document.getElementById('adminLink');
    
    if (isAuthenticated) {
      // User is logged in
      console.log('User is logged in, updating nav');
      if (loginBtn) loginBtn.style.display = 'none';
      
      // Show profile links
      profileLinks.forEach(link => {
        if (link) link.style.display = 'inline-block';
      });
      
      // Check if user is admin and show admin link
      const userRole = localStorage.getItem('role');
      if (adminLink && userRole === 'admin') {
        adminLink.style.display = 'inline-block';
      } else if (adminLink) {
        adminLink.style.display = 'none';
      }
    } else {
      // User is not logged in
      console.log('User is not logged in, updating nav');
      if (loginBtn) loginBtn.style.display = 'inline-block';
      
      // Hide profile and admin links
      profileLinks.forEach(link => {
        if (link) link.style.display = 'none';
      });
      
      if (adminLink) adminLink.style.display = 'none';
    }
  } catch (error) {
    console.error('Error updating navigation:', error);
  }
}

// Function to get URL parameters - improved to handle edge cases
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  console.log(`Getting URL parameter '${name}': ${results === null ? 'not found' : results[1]}`);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Function to load donghua details from Supabase
async function loadDonghuaDetails() {
  const donghuaId = getUrlParameter('id');
  console.log('Loading donghua with ID:', donghuaId);
  
  if (!donghuaId) {
    console.log('No donghua ID found, loading donghua list');
    loadDonghuaList();
    return;
  }

  try {
    // Check supabase again to be extra sure
    if (typeof window.supabase === 'undefined') {
      throw new Error("Supabase client not initialized");
    }
    
    // Show loading state
    document.getElementById('donghuaBackdrop').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    document.getElementById('donghuaTitle').textContent = 'Memuat...';
    document.getElementById('donghuaYear').textContent = 'Memuat...';
    document.getElementById('donghuaGenre').textContent = 'Memuat...';
    document.getElementById('donghuaStatus').textContent = 'Memuat...';
    document.getElementById('donghuaSynopsis').textContent = 'Memuat sinopsis...';
    document.getElementById('episodeList').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';

    // Fetch donghua data from Supabase with extensive logging
    console.log('Supabase client:', typeof window.supabase);
    console.log('Fetching donghua with ID:', donghuaId, 'Type:', typeof donghuaId);
    
    // Convert to number for comparison if it's a string that contains a number
    const idToUse = isNaN(Number(donghuaId)) ? donghuaId : Number(donghuaId);
    console.log('Using ID for query:', idToUse, 'Type:', typeof idToUse);
    
    const { data: donghua, error } = await window.supabase
      .from('donghua')
      .select('*')
      .eq('id', idToUse)
      .single();
      
    if (error) {
      console.error('Error fetching donghua:', error);
      throw error;
    }
    
    console.log('Donghua data fetched:', donghua);
    
    if (!donghua) {
      console.error('No donghua found with ID:', donghuaId);
      document.getElementById('donghuaBackdrop').innerHTML = '<p class="error-message">Donghua tidak ditemukan</p>';
      document.getElementById('donghuaTitle').textContent = 'Donghua tidak ditemukan';
      document.getElementById('donghuaSynopsis').textContent = 'Donghua dengan ID tersebut tidak ditemukan dalam database.';
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
      posterElement.innerHTML = `<img src="${donghua.poster_url || 'images/default-poster.jpg'}" alt="${donghua.title}" onerror="this.src='images/default-poster.jpg';">`;
    }

    // Set donghua details
    document.getElementById('donghuaTitle').textContent = donghua.title || 'Judul Tidak Tersedia';
    document.getElementById('donghuaYear').textContent = donghua.year || 'Tahun Tidak Tersedia';
    document.getElementById('donghuaGenre').textContent = donghua.genre || 'Genre Tidak Tersedia';
    document.getElementById('donghuaStatus').textContent = donghua.status || 'Status Tidak Tersedia';
    document.getElementById('donghuaRating').textContent = donghua.rating || '0.0';
    document.getElementById('donghuaSynopsis').textContent = donghua.synopsis || 'Sinopsis tidak tersedia';

    // Load episodes for this donghua
    loadEpisodes(donghuaId);
  } catch (error) {
    console.error('Error loading donghua details:', error);
    document.getElementById('donghuaTitle').textContent = 'Error';
    document.getElementById('donghuaSynopsis').textContent = `Terjadi kesalahan saat memuat data donghua: ${error.message || 'Tidak dapat terhubung ke database'}`;
    
    // Also update other elements to show error state
    document.getElementById('donghuaYear').textContent = '-';
    document.getElementById('donghuaGenre').textContent = '-';
    document.getElementById('donghuaStatus').textContent = '-';
    document.getElementById('donghuaRating').textContent = '0.0';
    
    // Clear loading spinners
    const backdropElement = document.getElementById('donghuaBackdrop');
    if (backdropElement) {
      backdropElement.innerHTML = `<p class="error-message">Error: ${error.message || 'Tidak dapat memuat data'}</p>`;
    }
    
    const posterElement = document.getElementById('donghuaPoster');
    if (posterElement) {
      posterElement.innerHTML = '<div class="error-poster"><i class="fas fa-exclamation-triangle"></i></div>';
    }
  }
}

// Function to load donghua list when no ID is provided
async function loadDonghuaList() {
  const mainContent = document.querySelector('main');
  if (!mainContent) return;
  
  // Create donghua list container
  mainContent.innerHTML = `
    <section class="donghua-list-section">
      <h1 class="section-title">Daftar Donghua</h1>
      <div class="donghua-grid" id="donghuaListGrid">
        <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>
      </div>
    </section>
  `;
  
  try {
    // Check supabase again
    if (typeof window.supabase === 'undefined') {
      throw new Error("Supabase client not initialized");
    }
    
    // Fetch all donghua from Supabase
    const { data: donghuaList, error } = await window.supabase
      .from('donghua')
      .select('*')
      .order('title', { ascending: true });
      
    if (error) throw error;
    
    const donghuaGrid = document.getElementById('donghuaListGrid');
    if (!donghuaGrid) {
      console.error('donghuaListGrid element not found');
      return;
    }
    
    donghuaGrid.innerHTML = '';
    
    if (!donghuaList || donghuaList.length === 0) {
      donghuaGrid.innerHTML = '<p class="empty-message">Belum ada donghua tersedia.</p>';
      return;
    }
    
    console.log('Donghua list loaded:', donghuaList.length, 'items');
    
    // Create donghua cards
    donghuaList.forEach(donghua => {
      const donghuaCard = document.createElement('a');
      donghuaCard.href = `donghua.html?id=${donghua.id}`;
      donghuaCard.className = 'donghua-card';
      donghuaCard.innerHTML = `
        <div class="donghua-poster">
          <img src="${donghua.poster_url || 'images/default-poster.jpg'}" alt="${donghua.title}" onerror="this.src='images/default-poster.jpg';">
        </div>
        <div class="donghua-info">
          <h3 class="donghua-title">${donghua.title}</h3>
          <div class="donghua-meta">
            <span>${donghua.year || '-'}</span>
            <span>${donghua.status || '-'}</span>
          </div>
          <div class="donghua-rating">
            <i class="fas fa-star"></i> ${donghua.rating || '0.0'}
          </div>
        </div>
      `;
      donghuaGrid.appendChild(donghuaCard);
    });
  } catch (error) {
    console.error('Error loading donghua list:', error);
    const donghuaGrid = document.getElementById('donghuaListGrid');
    if (donghuaGrid) {
      donghuaGrid.innerHTML = `<p class="error-message">Terjadi kesalahan saat memuat data: ${error.message || 'Tidak dapat terhubung ke database'}</p>`;
    }
  }
}

// Function to load episodes from Supabase
async function loadEpisodes(donghuaId) {
  const episodesList = document.getElementById('episodeList');
  if (!episodesList) {
    console.error('episodeList element not found');
    return;
  }

  try {
    // Show loading state
    episodesList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    
    console.log('Fetching episodes for donghua ID:', donghuaId);
    
    // Check supabase again
    if (typeof window.supabase === 'undefined') {
      throw new Error("Supabase client not initialized");
    }
    
    // Convert to number if it's a string that contains a number
    const idToUse = isNaN(Number(donghuaId)) ? donghuaId : Number(donghuaId);
    
    // Fetch episodes data from Supabase
    const { data: episodes, error } = await window.supabase
      .from('episodes')
      .select('*')
      .eq('donghua_id', idToUse)
      .order('episode_number', { ascending: true });
      
    if (error) {
      console.error('Error fetching episodes:', error);
      throw error;
    }
    
    console.log('Episodes data loaded:', episodes);

    // Clear the episodes list before adding new items
    episodesList.innerHTML = '';

    // Create episode items
    if (!episodes || episodes.length === 0) {
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
            <img src="${episode.thumbnail_url || 'images/default-thumbnail.jpg'}" alt="Episode ${episode.episode_number}" onerror="this.src='images/default-thumbnail.jpg';">
          </div>
          <div class="episode-info">
            <div class="episode-number">Episode ${episode.episode_number}</div>
            <h3 class="episode-title">${episode.title || `Episode ${episode.episode_number}`}</h3>
          </div>
          ${vipBadge}
        `;
        
        episodesList.appendChild(episodeItem);
      });
    }
  } catch (error) {
    console.error('Error loading episodes:', error);
    if (episodesList) {
      episodesList.innerHTML = `<p class="error-message">Terjadi kesalahan saat memuat episode: ${error.message || 'Tidak dapat terhubung ke database'}</p>`;
    }
  }
}

// Helper function to format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}
