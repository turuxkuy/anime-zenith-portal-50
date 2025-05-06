
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
  
  // Load episode details
  loadEpisodeDetails();
});

// Function to update navigation (same as in other files)
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

// Function to load episode details from Supabase
async function loadEpisodeDetails() {
  const episodeId = getUrlParameter('id');
  const donghuaId = getUrlParameter('donghuaId');
  
  if (!episodeId || !donghuaId) {
    window.location.href = 'index.html';
    return;
  }

  try {
    // Fetch episode data from Supabase
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single();
      
    if (episodeError) throw episodeError;

    if (!episode) {
      window.location.href = 'donghua.html?id=' + donghuaId;
      return;
    }

    // Fetch donghua data for this episode
    const { data: donghua, error: donghuaError } = await supabase
      .from('donghua')
      .select('*')
      .eq('id', donghuaId)
      .single();
      
    if (donghuaError) throw donghuaError;

    if (!donghua) {
      window.location.href = 'index.html';
      return;
    }

    // Update page title
    document.title = `${donghua.title} - Episode ${episode.episode_number} - Zenith Donghua`;

    // Set episode details
    document.getElementById('episodeTitle').textContent = `${donghua.title} - Episode ${episode.episode_number}`;
    document.getElementById('episodeSubtitle').textContent = episode.title;
    document.getElementById('episodeNumber').textContent = `Episode ${episode.episode_number}`;
    document.getElementById('episodeDate').textContent = formatDate(episode.release_date);
    document.getElementById('episodeDuration').textContent = `${episode.duration} menit`;
    document.getElementById('episodeDescription').textContent = episode.description;

    // Link back to donghua page
    const backLink = document.getElementById('backToDonghua');
    if (backLink) {
      backLink.href = `donghua.html?id=${donghuaId}`;
    }

    // Check if user has VIP access
    const { data: sessionData } = await supabase.auth.getSession();
    const isAuthenticated = !!sessionData.session;
    
    let isVip = false;
    
    if (isAuthenticated) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', sessionData.session.user.id)
        .single();
        
      isVip = profileData?.role === 'vip' || profileData?.role === 'admin';
    }

    // Setup video player
    const videoPlayer = document.getElementById('videoPlayer');
    const videoElement = document.getElementById('videoElement');
    const videoSource = document.getElementById('videoSource');
    const vipOverlay = document.getElementById('vipOverlay');
    
    if (videoElement && videoSource && vipOverlay) {
      if (episode.is_vip && !isVip) {
        // Show VIP overlay for non-VIP users
        vipOverlay.style.display = 'flex';
        videoSource.src = '';
        videoElement.load();
      } else {
        // Show video for VIP users or non-VIP episodes
        vipOverlay.style.display = 'none';
        videoSource.src = episode.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'; // Default sample video
        videoElement.load();
      }
    }

    // Setup episode navigation
    setupEpisodeNavigation(donghuaId, episode);
    
    // Load more episodes from the same donghua
    loadMoreEpisodes(donghuaId, episodeId);
  } catch (error) {
    console.error('Error loading episode details:', error);
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.innerHTML = `<div class="error-container">
        <h2>Terjadi kesalahan</h2>
        <p>${error.message || 'Tidak dapat memuat episode'}</p>
        <a href="index.html" class="back-button">Kembali ke Beranda</a>
      </div>`;
    }
  }
}

// Function to setup episode navigation
async function setupEpisodeNavigation(donghuaId, currentEpisode) {
  const prevButton = document.getElementById('prevEpisode');
  const nextButton = document.getElementById('nextEpisode');
  
  if (!prevButton || !nextButton) return;

  try {
    // Get episodes for this donghua
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('id, episode_number')
      .eq('donghua_id', donghuaId)
      .order('episode_number', { ascending: true });
      
    if (error) throw error;
    
    // Find current episode index
    const currentIndex = episodes.findIndex(ep => ep.id === currentEpisode.id);
    
    // Setup previous episode button
    if (currentIndex > 0) {
      const prevEpisode = episodes[currentIndex - 1];
      prevButton.addEventListener('click', function() {
        window.location.href = `episode.html?id=${prevEpisode.id}&donghuaId=${donghuaId}`;
      });
      prevButton.disabled = false;
    } else {
      prevButton.disabled = true;
    }
    
    // Setup next episode button
    if (currentIndex < episodes.length - 1) {
      const nextEpisode = episodes[currentIndex + 1];
      nextButton.addEventListener('click', function() {
        window.location.href = `episode.html?id=${nextEpisode.id}&donghuaId=${donghuaId}`;
      });
      nextButton.disabled = false;
    } else {
      nextButton.disabled = true;
    }
  } catch (error) {
    console.error('Error setting up navigation:', error);
    prevButton.disabled = true;
    nextButton.disabled = true;
  }
}

// Function to load more episodes
async function loadMoreEpisodes(donghuaId, currentEpisodeId) {
  const moreEpisodesList = document.getElementById('moreEpisodesList');
  if (!moreEpisodesList) return;
  
  try {
    // Show loading state
    moreEpisodesList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    
    // Get episodes for this donghua
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('donghua_id', donghuaId)
      .order('episode_number', { ascending: true });
      
    if (error) throw error;
    
    // Clear the container
    moreEpisodesList.innerHTML = '';
    
    // Add episode items (limited to 6)
    if (episodes.length === 0) {
      moreEpisodesList.innerHTML = '<p class="empty-message">Belum ada episode lain untuk donghua ini.</p>';
    } else {
      // Filter out current episode and limit to 6
      const otherEpisodes = episodes
        .filter(ep => ep.id !== currentEpisodeId)
        .slice(0, 6);
        
      otherEpisodes.forEach(episode => {
        const episodeItem = document.createElement('a');
        episodeItem.href = `episode.html?id=${episode.id}&donghuaId=${donghuaId}`;
        episodeItem.className = 'more-episode-item';
        
        episodeItem.innerHTML = `
          <div class="more-episode-thumbnail">
            <img src="${episode.thumbnail_url || 'images/default-thumbnail.jpg'}" alt="Episode ${episode.episode_number}">
            ${episode.is_vip ? '<span class="vip-badge"><i class="fas fa-crown"></i></span>' : ''}
          </div>
          <div class="more-episode-info">
            <span class="more-episode-number">Ep ${episode.episode_number}</span>
            <h4 class="more-episode-title">${episode.title}</h4>
          </div>
        `;
        
        moreEpisodesList.appendChild(episodeItem);
      });
    }
  } catch (error) {
    console.error('Error loading more episodes:', error);
    moreEpisodesList.innerHTML = `<p class="error-message">Gagal memuat episode lainnya: ${error.message}</p>`;
  }
}

// Helper function to format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}
