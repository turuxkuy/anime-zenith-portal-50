
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Episode page loaded');
  
  // Update navigation based on auth status
  await updateNavigation();
  
  // Load episode details
  loadEpisodeDetails();
});

// Function to update navigation based on auth status
async function updateNavigation() {
  try {
    const { data } = await supabase.auth.getSession();
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

// Function to get URL parameters
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Function to check if user can access VIP content
async function canAccessVipContent() {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return false;
    
    // Get user role from profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.session.user.id)
      .single();
      
    if (error) {
      console.error('Error checking VIP access:', error);
      return false;
    }
    
    return profile.role === 'vip' || profile.role === 'admin';
  } catch (error) {
    console.error('Error checking VIP access:', error);
    return false;
  }
}

// Function to load episode details
async function loadEpisodeDetails() {
  const episodeId = getUrlParameter('id');
  const donghuaId = getUrlParameter('donghuaId');
  
  console.log('Loading episode:', episodeId, 'from donghua:', donghuaId);
  
  if (!episodeId) {
    console.error('No episode ID provided');
    window.location.href = 'donghua.html';
    return;
  }
  
  try {
    // Fetch episode data from Supabase
    const { data: episode, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single();
      
    if (error) throw error;
    
    if (!episode) {
      console.error('Episode not found');
      document.getElementById('episodeTitle').textContent = 'Episode tidak ditemukan';
      return;
    }
    
    console.log('Episode data loaded:', episode);
    
    // Set episode title and info
    document.getElementById('episodeTitle').textContent = episode.title;
    document.getElementById('episodeSubtitle').textContent = episode.title;
    document.getElementById('episodeNumber').textContent = `Episode ${episode.episode_number}`;
    document.getElementById('episodeDate').textContent = formatDate(episode.release_date);
    document.getElementById('episodeDuration').textContent = `${episode.duration} menit`;
    document.getElementById('episodeDescription').textContent = episode.description || 'Tidak ada deskripsi';
    
    // Set back to donghua link
    const backToDonghua = document.getElementById('backToDonghua');
    if (backToDonghua) {
      backToDonghua.href = `donghua.html?id=${episode.donghua_id}`;
    }
    
    // Handle VIP content
    const isVip = episode.is_vip;
    const hasVipAccess = await canAccessVipContent();
    const videoWrapper = document.getElementById('videoWrapper');
    const vipOverlay = document.getElementById('vipOverlay');
    
    console.log('VIP episode:', isVip, 'User has VIP access:', hasVipAccess);
    
    if (isVip && !hasVipAccess) {
      // Show VIP overlay
      vipOverlay.style.display = 'flex';
      videoWrapper.innerHTML = `<div class="video-placeholder"></div>`;
    } else {
      // Show video
      vipOverlay.style.display = 'none';
      
      // Check if video URL is external (embed) or local
      if (episode.video_url && episode.video_url.includes('iframe')) {
        // It's an embed code
        videoWrapper.innerHTML = episode.video_url;
      } else if (episode.video_url) {
        // It's a direct video URL
        videoWrapper.innerHTML = `
          <video controls>
            <source src="${episode.video_url}" type="video/mp4">
            Browser Anda tidak mendukung pemutaran video.
          </video>
        `;
      } else {
        videoWrapper.innerHTML = `<div class="video-error">Video tidak tersedia</div>`;
      }
    }
    
    // Load navigation episodes
    loadEpisodeNavigation(episode.donghua_id, episode.episode_number);
    
    // Load more episodes
    loadMoreEpisodes(episode.donghua_id, episodeId);
    
  } catch (error) {
    console.error('Error loading episode:', error);
    document.getElementById('episodeTitle').textContent = 'Error loading episode';
    document.getElementById('episodeDescription').textContent = `Terjadi kesalahan saat memuat episode: ${error.message || 'Tidak dapat terhubung ke database'}`;
  }
}

// Function to load episode navigation (prev/next)
async function loadEpisodeNavigation(donghuaId, currentEpisodeNumber) {
  try {
    // Fetch all episodes for this donghua
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('id, episode_number')
      .eq('donghua_id', donghuaId)
      .order('episode_number', { ascending: true });
      
    if (error) throw error;
    
    const prevBtn = document.getElementById('prevEpisode');
    const nextBtn = document.getElementById('nextEpisode');
    
    // Find current episode index
    const currentIndex = episodes.findIndex(ep => ep.episode_number === currentEpisodeNumber);
    
    // Setup previous episode button
    if (currentIndex > 0) {
      const prevEpisode = episodes[currentIndex - 1];
      prevBtn.onclick = () => window.location.href = `episode.html?id=${prevEpisode.id}&donghuaId=${donghuaId}`;
      prevBtn.disabled = false;
    } else {
      prevBtn.disabled = true;
    }
    
    // Setup next episode button
    if (currentIndex < episodes.length - 1) {
      const nextEpisode = episodes[currentIndex + 1];
      nextBtn.onclick = () => window.location.href = `episode.html?id=${nextEpisode.id}&donghuaId=${donghuaId}`;
      nextBtn.disabled = false;
    } else {
      nextBtn.disabled = true;
    }
  } catch (error) {
    console.error('Error loading episode navigation:', error);
  }
}

// Function to load more episodes
async function loadMoreEpisodes(donghuaId, currentEpisodeId) {
  const moreEpisodesList = document.getElementById('moreEpisodesList');
  if (!moreEpisodesList) return;
  
  try {
    // Fetch episodes for this donghua
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('donghua_id', donghuaId)
      .order('episode_number', { ascending: true });
      
    if (error) throw error;
    
    // Clear existing episodes
    moreEpisodesList.innerHTML = '';
    
    // Show up to 6 episodes, prioritizing ones close to current
    const episodesToShow = episodes
      .filter(ep => ep.id !== currentEpisodeId) // exclude current episode
      .slice(0, 6);
      
    if (episodesToShow.length === 0) {
      moreEpisodesList.innerHTML = '<p class="empty-message">Tidak ada episode lain.</p>';
      return;
    }
    
    // Create episode cards
    episodesToShow.forEach(episode => {
      const episodeCard = document.createElement('a');
      episodeCard.href = `episode.html?id=${episode.id}&donghuaId=${donghuaId}`;
      episodeCard.className = 'episode-card';
      
      let vipBadge = '';
      if (episode.is_vip) {
        vipBadge = '<span class="vip-badge"><i class="fas fa-crown"></i></span>';
      }
      
      episodeCard.innerHTML = `
        <div class="episode-thumbnail">
          <img src="${episode.thumbnail_url || 'images/default-thumbnail.jpg'}" alt="Episode ${episode.episode_number}">
          ${vipBadge}
        </div>
        <div class="episode-info">
          <span class="episode-number">Episode ${episode.episode_number}</span>
          <h4>${episode.title}</h4>
        </div>
      `;
      
      moreEpisodesList.appendChild(episodeCard);
    });
    
  } catch (error) {
    console.error('Error loading more episodes:', error);
    moreEpisodesList.innerHTML = `<p class="error-message">Terjadi kesalahan saat memuat episode.</p>`;
  }
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return 'Tanggal tidak tersedia';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}
