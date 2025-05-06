
document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }

  // Load donghua details
  loadDonghuaDetails();
});

// Function to get URL parameters
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Function to load donghua details
function loadDonghuaDetails() {
  const donghuaId = getUrlParameter('id');
  if (!donghuaId) {
    window.location.href = 'index.html';
    return;
  }

  // Get donghua data from localStorage
  const donghuaData = JSON.parse(localStorage.getItem('donghuaData')) || [];
  const donghua = donghuaData[donghuaId];

  if (!donghua) {
    window.location.href = 'index.html';
    return;
  }

  // Update page title
  document.title = `${donghua.title} - Zenith Donghua`;

  // Set backdrop image
  const backdropElement = document.getElementById('donghuaBackdrop');
  if (backdropElement) {
    backdropElement.style.backgroundImage = `linear-gradient(to bottom, rgba(26, 31, 44, 0.5), rgba(26, 31, 44, 0.9)), url('${donghua.backdrop || 'images/default-backdrop.jpg'}')`;
    backdropElement.style.backgroundSize = 'cover';
    backdropElement.style.backgroundPosition = 'center';
  }

  // Set poster image
  const posterElement = document.getElementById('donghuaPoster');
  if (posterElement) {
    posterElement.innerHTML = `<img src="${donghua.poster || 'images/default-poster.jpg'}" alt="${donghua.title}">`;
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
}

// Function to load episodes
function loadEpisodes(donghuaId) {
  const episodesList = document.getElementById('episodeList');
  if (!episodesList) return;

  // Get episodes data from localStorage
  let episodesData = JSON.parse(localStorage.getItem('episodesData')) || [];

  // Filter episodes for this donghua
  const donghuaEpisodes = episodesData.filter(episode => episode.donghuaId == donghuaId);

  // If no episodes exist, create some sample episodes
  if (donghuaEpisodes.length === 0) {
    const newEpisodes = createSampleEpisodes(donghuaId);
    
    // Add these episodes to the main episodes data
    if (episodesData.length === 0) {
      episodesData = newEpisodes;
    } else {
      episodesData = [...episodesData, ...newEpisodes];
    }
    
    localStorage.setItem('episodesData', JSON.stringify(episodesData));
  }

  // Clear the episodes list before adding new items
  episodesList.innerHTML = '';

  // Sort episodes by episode number
  const sortedEpisodes = donghuaEpisodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

  // Create episode items
  if (sortedEpisodes.length === 0) {
    episodesList.innerHTML = '<p class="empty-message">Belum ada episode untuk donghua ini.</p>';
  } else {
    sortedEpisodes.forEach(episode => {
      const episodeItem = document.createElement('a');
      episodeItem.href = `episode.html?id=${episode.id}&donghuaId=${donghuaId}`;
      episodeItem.className = 'episode-item';
      
      let vipBadge = '';
      if (episode.isVip) {
        vipBadge = '<span class="episode-vip"><i class="fas fa-crown"></i> VIP</span>';
      }
      
      episodeItem.innerHTML = `
        <div class="episode-thumbnail">
          <img src="${episode.thumbnail || 'images/default-thumbnail.jpg'}" alt="Episode ${episode.episodeNumber}">
        </div>
        <div class="episode-info">
          <div class="episode-number">Episode ${episode.episodeNumber}</div>
          <h3 class="episode-title">${episode.title}</h3>
        </div>
        ${vipBadge}
      `;
      
      episodesList.appendChild(episodeItem);
    });
  }
}

// Function to create sample episodes
function createSampleEpisodes(donghuaId) {
  // Create different numbers of episodes based on donghua ID
  const episodeCount = 10 + (donghuaId % 5) * 2; // Between 10 and 18 episodes
  const episodes = [];
  
  for (let i = 1; i <= episodeCount; i++) {
    episodes.push({
      id: `${donghuaId}-${i}`, // Composite ID to ensure uniqueness
      donghuaId: donghuaId,
      episodeNumber: i,
      title: `Episode ${i}`,
      description: `This is the description for episode ${i} of this amazing donghua series.`,
      thumbnail: `https://via.placeholder.com/300x170?text=Episode+${i}`,
      videoUrl: `#`, // Would be a real URL in production
      duration: 24, // minutes
      isVip: i > episodeCount - 3, // Make the last 2 episodes VIP only
      releaseDate: new Date(2023, 0, i).toISOString().split('T')[0] // Format: YYYY-MM-DD
    });
  }
  
  return episodes;
}
