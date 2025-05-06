
document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }

  // Load episode details
  loadEpisodeDetails();
});

// Function to get URL parameters
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Function to load episode details
function loadEpisodeDetails() {
  const episodeId = getUrlParameter('id');
  const donghuaId = getUrlParameter('donghuaId');
  
  if (!episodeId || !donghuaId) {
    window.location.href = 'index.html';
    return;
  }

  // Get episode data from localStorage
  const episodesData = JSON.parse(localStorage.getItem('episodesData')) || [];
  const episode = episodesData.find(ep => ep.id === episodeId);

  if (!episode) {
    window.location.href = 'donghua.html?id=' + donghuaId;
    return;
  }

  // Get donghua data for this episode
  const donghuaData = JSON.parse(localStorage.getItem('donghuaData')) || [];
  const donghua = donghuaData[donghuaId];

  if (!donghua) {
    window.location.href = 'index.html';
    return;
  }

  // Update page title
  document.title = `${donghua.title} - Episode ${episode.episodeNumber} - Zenith Donghua`;

  // Set episode details
  document.getElementById('episodeTitle').textContent = `${donghua.title} - Episode ${episode.episodeNumber}`;
  document.getElementById('episodeSubtitle').textContent = episode.title;
  document.getElementById('episodeNumber').textContent = `Episode ${episode.episodeNumber}`;
  document.getElementById('episodeDate').textContent = formatDate(episode.releaseDate);
  document.getElementById('episodeDuration').textContent = `${episode.duration} menit`;
  document.getElementById('episodeDescription').textContent = episode.description;

  // Link back to donghua page
  const backLink = document.getElementById('backToDonghua');
  if (backLink) {
    backLink.href = `donghua.html?id=${donghuaId}`;
  }

  // Check if user has VIP access
  const userRole = localStorage.getItem('role') || '';
  const isVip = userRole === 'vip' || userRole === 'admin';

  // Setup video player
  const videoPlayer = document.getElementById('videoPlayer');
  const videoElement = document.getElementById('videoElement');
  const videoSource = document.getElementById('videoSource');
  const vipOverlay = document.getElementById('vipOverlay');
  
  if (videoElement && videoSource && vipOverlay) {
    if (episode.isVip && !isVip) {
      // Show VIP overlay for non-VIP users
      vipOverlay.style.display = 'flex';
      videoSource.src = '';
      videoElement.load();
    } else {
      // Show video for VIP users or non-VIP episodes
      vipOverlay.style.display = 'none';
      videoSource.src = episode.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'; // Default sample video
      videoElement.load();
    }
  }

  // Setup episode navigation
  setupEpisodeNavigation(episodesData, episode, donghuaId);
  
  // Load more episodes from the same donghua
  loadMoreEpisodes(episodesData, donghuaId, episodeId);
}

// Function to setup episode navigation
function setupEpisodeNavigation(episodesData, currentEpisode, donghuaId) {
  const prevButton = document.getElementById('prevEpisode');
  const nextButton = document.getElementById('nextEpisode');
  
  if (!prevButton || !nextButton) return;

  // Get episodes for this donghua
  const donghuaEpisodes = episodesData
    .filter(ep => ep.donghuaId == donghuaId)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);
  
  // Find current episode index
  const currentIndex = donghuaEpisodes.findIndex(ep => ep.id === currentEpisode.id);
  
  // Setup previous episode button
  if (currentIndex > 0) {
    const prevEpisode = donghuaEpisodes[currentIndex - 1];
    prevButton.addEventListener('click', function() {
      window.location.href = `episode.html?id=${prevEpisode.id}&donghuaId=${donghuaId}`;
    });
    prevButton.disabled = false;
  } else {
    prevButton.disabled = true;
  }
  
  // Setup next episode button
  if (currentIndex < donghuaEpisodes.length - 1) {
    const nextEpisode = donghuaEpisodes[currentIndex + 1];
    nextButton.addEventListener('click', function() {
      window.location.href = `episode.html?id=${nextEpisode.id}&donghuaId=${donghuaId}`;
    });
    nextButton.disabled = false;
  } else {
    nextButton.disabled = true;
  }
}

// Function to load more episodes
function loadMoreEpisodes(episodesData, donghuaId, currentEpisodeId) {
  const moreEpisodesList = document.getElementById('moreEpisodesList');
  if (!moreEpisodesList) return;
  
  // Get episodes for this donghua
  const donghuaEpisodes = episodesData
    .filter(ep => ep.donghuaId == donghuaId)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);
  
  // Clear the container
  moreEpisodesList.innerHTML = '';
  
  // Create episode thumbnails
  donghuaEpisodes.forEach(episode => {
    const episodeThumb = document.createElement('a');
    episodeThumb.href = `episode.html?id=${episode.id}&donghuaId=${donghuaId}`;
    episodeThumb.className = 'episode-thumb';
    
    // Highlight the current episode
    if (episode.id === currentEpisodeId) {
      episodeThumb.classList.add('current');
    }
    
    let vipBadge = '';
    if (episode.isVip) {
      vipBadge = '<span class="episode-vip-badge">VIP</span>';
    }
    
    episodeThumb.innerHTML = `
      <img src="${episode.thumbnail || 'images/default-thumbnail.jpg'}" alt="Episode ${episode.episodeNumber}">
      <span class="episode-number-badge">${episode.episodeNumber}</span>
      ${vipBadge}
    `;
    
    moreEpisodesList.appendChild(episodeThumb);
  });
}

// Helper function to format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}
