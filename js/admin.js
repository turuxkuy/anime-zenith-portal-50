document.addEventListener('DOMContentLoaded', function() {
  // Check if user is admin
  checkAdminAccess();
  
  // Initialize admin panel
  initAdminPanel();
  
  // Show dashboard by default
  showAdminPage('dashboard');
  
  // Load data stats
  loadDashboardStats();
  
  // Load tables data
  loadDonghuaTable();
  loadEpisodeTable();
  loadUsersTable();
  
  // Setup forms
  setupDonghuaForm();
  setupEpisodeForm();
  setupUserForm();
});

// Function to check admin access
function checkAdminAccess() {
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');
  
  if (role !== 'admin') {
    window.location.href = 'index.html';
  } else {
    // Update admin name
    document.getElementById('adminName').textContent = username || 'Admin';
  }
}

// Initialize admin panel events
function initAdminPanel() {
  // Menu item click handling
  const menuItems = document.querySelectorAll('.admin-menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      const page = this.getAttribute('data-page');
      
      if (page) {
        showAdminPage(page);
      }
    });
  });
  
  // Add donghua button
  const addDonghuaBtn = document.getElementById('addDonghuaBtn');
  if (addDonghuaBtn) {
    addDonghuaBtn.addEventListener('click', function() {
      openDonghuaModal();
    });
  }
  
  // Add episode button
  const addEpisodeBtn = document.getElementById('addEpisodeBtn');
  if (addEpisodeBtn) {
    addEpisodeBtn.addEventListener('click', function() {
      openEpisodeModal();
    });
  }
  
  // Close modal buttons
  const closeButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // Close modal by clicking outside
  window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('auth');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      window.location.href = 'index.html';
    });
  }
}

// Function to show an admin page
function showAdminPage(pageName) {
  // Update menu items
  const menuItems = document.querySelectorAll('.admin-menu-item');
  menuItems.forEach(item => {
    if (item.getAttribute('data-page') === pageName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Update page title
  document.getElementById('pageTitle').textContent = pageName.charAt(0).toUpperCase() + pageName.slice(1);
  
  // Show selected page
  const pages = document.querySelectorAll('.admin-page');
  pages.forEach(page => {
    if (page.id === pageName) {
      page.classList.add('active');
    } else {
      page.classList.remove('active');
    }
  });
}

// Function to load dashboard stats
function loadDashboardStats() {
  const donghuaData = JSON.parse(localStorage.getItem('donghuaData')) || [];
  const episodesData = JSON.parse(localStorage.getItem('episodesData')) || [];
  const users = JSON.parse(localStorage.getItem('users')) || [];
  
  document.getElementById('totalDonghua').textContent = donghuaData.length;
  document.getElementById('totalEpisodes').textContent = episodesData.length;
  document.getElementById('totalUsers').textContent = users.length;
  
  const vipUsers = users.filter(user => user.role === 'vip').length;
  document.getElementById('vipUsers').textContent = vipUsers;
}

// Function to load donghua table
function loadDonghuaTable() {
  const tableBody = document.getElementById('donghuaTableBody');
  if (!tableBody) return;
  
  const donghuaData = JSON.parse(localStorage.getItem('donghuaData')) || [];
  
  // Clear table
  tableBody.innerHTML = '';
  
  // Add row for each donghua
  donghuaData.forEach((donghua, index) => {
    const row = document.createElement('tr');
    
    // Status badge class
    let statusClass = '';
    if (donghua.status === 'Ongoing') statusClass = 'status-ongoing';
    else if (donghua.status === 'Completed') statusClass = 'status-completed';
    else statusClass = 'status-coming';
    
    row.innerHTML = `
      <td>
        <div class="table-poster">
          <img src="${donghua.poster || 'images/default-poster.jpg'}" alt="${donghua.title}">
        </div>
      </td>
      <td>${donghua.title}</td>
      <td>${donghua.year}</td>
      <td>${donghua.genre}</td>
      <td><span class="status-badge ${statusClass}">${donghua.status}</span></td>
      <td>
        <div class="table-actions">
          <button class="edit-btn" data-id="${index}" onclick="editDonghua(${index})"><i class="fas fa-edit"></i></button>
          <button class="delete-btn" data-id="${index}" onclick="deleteDonghua(${index})"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Function to load episode table
function loadEpisodeTable() {
  const tableBody = document.getElementById('episodeTableBody');
  if (!tableBody) return;
  
  const episodesData = JSON.parse(localStorage.getItem('episodesData')) || [];
  const donghuaData = JSON.parse(localStorage.getItem('donghuaData')) || [];
  
  // Clear table
  tableBody.innerHTML = '';
  
  // Add row for each episode
  episodesData.forEach((episode, index) => {
    const row = document.createElement('tr');
    
    // Find donghua title
    const donghua = donghuaData[episode.donghuaId];
    const donghuaTitle = donghua ? donghua.title : 'Unknown';
    
    // VIP status badge
    const vipStatus = episode.isVip ? 
      '<span class="status-badge status-vip">VIP</span>' : 
      '<span class="status-badge status-free">Free</span>';
    
    row.innerHTML = `
      <td>
        <div class="table-thumbnail">
          <img src="${episode.thumbnail || 'images/default-thumbnail.jpg'}" alt="Episode ${episode.episodeNumber}">
        </div>
      </td>
      <td>${donghuaTitle}</td>
      <td>${episode.episodeNumber}</td>
      <td>${episode.title}</td>
      <td>${vipStatus}</td>
      <td>
        <div class="table-actions">
          <button class="edit-btn" data-id="${index}" onclick="editEpisode('${episode.id}')"><i class="fas fa-edit"></i></button>
          <button class="delete-btn" data-id="${index}" onclick="deleteEpisode('${episode.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Function to load users table
function loadUsersTable() {
  const tableBody = document.getElementById('usersTableBody');
  if (!tableBody) return;
  
  const users = JSON.parse(localStorage.getItem('users')) || [];
  
  // Clear table
  tableBody.innerHTML = '';
  
  // Add row for each user
  users.forEach((user, index) => {
    const row = document.createElement('tr');
    
    // Format date
    const createdDate = new Date(user.createdAt).toLocaleDateString('id-ID');
    
    // Role badge class
    let roleClass = '';
    if (user.role === 'admin') roleClass = 'status-completed';
    else if (user.role === 'vip') roleClass = 'status-vip';
    else roleClass = 'status-ongoing';
    
    row.innerHTML = `
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td><span class="status-badge ${roleClass}">${user.role}</span></td>
      <td>${createdDate}</td>
      <td>
        <div class="table-actions">
          <button class="edit-btn" onclick="editUser('${user.username}')"><i class="fas fa-edit"></i></button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Function to open donghua modal
function openDonghuaModal(donghuaId = null) {
  const modal = document.getElementById('donghuaModal');
  const form = document.getElementById('donghuaForm');
  const modalTitle = document.getElementById('donghuaModalTitle');
  
  if (!modal || !form) return;
  
  // Clear form
  form.reset();
  
  // Clear previews
  document.getElementById('posterPreview').innerHTML = '';
  document.getElementById('backdropPreview').innerHTML = '';
  
  if (donghuaId !== null) {
    // Edit existing donghua
    const donghuaData = JSON.parse(localStorage.getItem('donghuaData')) || [];
    const donghua = donghuaData[donghuaId];
    
    if (donghua) {
      modalTitle.textContent = 'Edit Donghua';
      
      // Fill form fields
      document.getElementById('title').value = donghua.title;
      document.getElementById('year').value = donghua.year;
      document.getElementById('genre').value = donghua.genre;
      document.getElementById('status').value = donghua.status;
      document.getElementById('rating').value = donghua.rating;
      document.getElementById('synopsis').value = donghua.synopsis;
      
      // Show existing images
      if (donghua.poster) {
        const posterPreview = document.getElementById('posterPreview');
        posterPreview.innerHTML = `<img src="${donghua.poster}" alt="Poster">`;
      }
      
      if (donghua.backdrop) {
        const backdropPreview = document.getElementById('backdropPreview');
        backdropPreview.innerHTML = `<img src="${donghua.backdrop}" alt="Backdrop">`;
      }
      
      // Store the donghua ID for updating
      form.setAttribute('data-id', donghuaId);
    }
  } else {
    // Add new donghua
    modalTitle.textContent = 'Tambah Donghua';
    form.removeAttribute('data-id');
  }
  
  // Show the modal
  modal.style.display = 'flex';
}

// Function to setup donghua form
function setupDonghuaForm() {
  const form = document.getElementById('donghuaForm');
  const posterUpload = document.getElementById('posterUpload');
  const backdropUpload = document.getElementById('backdropUpload');
  
  if (!form || !posterUpload || !backdropUpload) return;
  
  // Preview poster image when selected
  posterUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const posterPreview = document.getElementById('posterPreview');
    
    if (file && file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = function(e) {
        posterPreview.innerHTML = `<img src="${e.target.result}" alt="Poster Preview">`;
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Preview backdrop image when selected
  backdropUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const backdropPreview = document.getElementById('backdropPreview');
    
    if (file && file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = function(e) {
        backdropPreview.innerHTML = `<img src="${e.target.result}" alt="Backdrop Preview">`;
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Handle form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const year = parseInt(document.getElementById('year').value);
    const genre = document.getElementById('genre').value;
    const status = document.getElementById('status').value;
    const rating = parseFloat(document.getElementById('rating').value);
    const synopsis = document.getElementById('synopsis').value;
    
    // Get donghua data
    const donghuaData = JSON.parse(localStorage.getItem('donghuaData')) || [];
    
    // Check if editing existing donghua
    const editId = form.getAttribute('data-id');
    
    // Create donghua object
    let donghua = {
      title,
      year,
      genre,
      status,
      rating,
      synopsis,
      poster: '',
      backdrop: ''
    };
    
    // Handle poster image
    const posterFile = posterUpload.files[0];
    if (posterFile) {
      const reader = new FileReader();
      reader.onload = function(e) {
        donghua.poster = e.target.result;
        handleBackdropImage();
      };
      reader.readAsDataURL(posterFile);
    } else if (editId !== null) {
      // Keep existing poster if editing
      donghua.poster = donghuaData[editId].poster || '';
      handleBackdropImage();
    } else {
      // No poster selected for new donghua
      handleBackdropImage();
    }
    
    function handleBackdropImage() {
      // Handle backdrop image
      const backdropFile = backdropUpload.files[0];
      if (backdropFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
          donghua.backdrop = e.target.result;
          saveDonghua();
        };
        reader.readAsDataURL(backdropFile);
      } else if (editId !== null) {
        // Keep existing backdrop if editing
        donghua.backdrop = donghuaData[editId].backdrop || '';
        saveDonghua();
      } else {
        // No backdrop selected for new donghua
        saveDonghua();
      }
    }
    
    function saveDonghua() {
      if (editId !== null) {
        // Update existing donghua
        donghuaData[editId] = donghua;
      } else {
        // Add new donghua
        donghuaData.push(donghua);
      }
      
      // Save to localStorage
      localStorage.setItem('donghuaData', JSON.stringify(donghuaData));
      
      // Close modal
      document.getElementById('donghuaModal').style.display = 'none';
      
      // Reload table
      loadDonghuaTable();
      loadDashboardStats();
    }
  });
}

// Function to edit donghua
function editDonghua(id) {
  openDonghuaModal(id);
}

// Function to delete donghua
function deleteDonghua(id) {
  if (confirm('Apakah Anda yakin ingin menghapus donghua ini?')) {
    // Get donghua data
    const donghuaData = JSON.parse(localStorage.getItem('donghuaData')) || [];
    
    if (id >= 0 && id < donghuaData.length) {
      // Remove donghua
      donghuaData.splice(id, 1);
      localStorage.setItem('donghuaData', JSON.stringify(donghuaData));
      
      // Also delete related episodes
      const episodesData = JSON.parse(localStorage.getItem('episodesData')) || [];
      const filteredEpisodes = episodesData.filter(episode => episode.donghuaId != id);
      localStorage.setItem('episodesData', JSON.stringify(filteredEpisodes));
      
      // Reload tables
      loadDonghuaTable();
      loadEpisodeTable();
      loadDashboardStats();
    }
  }
}

// Function to open episode modal
function openEpisodeModal(episodeId = null) {
  const modal = document.getElementById('episodeModal');
  const form = document.getElementById('episodeForm');
  const modalTitle = document.getElementById('episodeModalTitle');
  const donghuaSelect = document.getElementById('donghuaSelect');
  
  if (!modal || !form || !donghuaSelect) return;
  
  // Clear form
  form.reset();
  document.getElementById('thumbnailPreview').innerHTML = '';
  document.getElementById('uploadProgress').style.display = 'none';
  
  // Populate donghua select
  const donghuaData = JSON.parse(localStorage.getItem('donghuaData')) || [];
  donghuaSelect.innerHTML = '';
  donghuaData.forEach((donghua, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = donghua.title;
    donghuaSelect.appendChild(option);
  });
  
  if (episodeId !== null) {
    // Edit existing episode
    const episodesData = JSON.parse(localStorage.getItem('episodesData')) || [];
    const episode = episodesData.find(ep => ep.id === episodeId);
    
    if (episode) {
      modalTitle.textContent = 'Edit Episode';
      
      // Fill form fields
      donghuaSelect.value = episode.donghuaId;
      document.getElementById('episodeNumber').value = episode.episodeNumber;
      document.getElementById('episodeTitle').value = episode.title;
      document.getElementById('episodeDescription').value = episode.description;
      document.getElementById('episodeDuration').value = episode.duration;
      document.getElementById('isVip').value = episode.isVip ? 'true' : 'false';
      
      // Show existing thumbnail
      if (episode.thumbnail) {
        const thumbnailPreview = document.getElementById('thumbnailPreview');
        thumbnailPreview.innerHTML = `<img src="${episode.thumbnail}" alt="Thumbnail">`;
      }
      
      // Store the episode ID for updating
      form.setAttribute('data-id', episodeId);
    }
  } else {
    // Add new episode
    modalTitle.textContent = 'Tambah Episode';
    form.removeAttribute('data-id');
  }
  
  // Show the modal
  modal.style.display = 'flex';
}

// Function to setup episode form
function setupEpisodeForm() {
  const form = document.getElementById('episodeForm');
  const thumbnailUpload = document.getElementById('thumbnailUpload');
  const videoUpload = document.getElementById('videoUpload');
  const uploadProgress = document.getElementById('uploadProgress');
  
  if (!form || !thumbnailUpload || !videoUpload || !uploadProgress) return;
  
  // Preview thumbnail image when selected
  thumbnailUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const thumbnailPreview = document.getElementById('thumbnailPreview');
    
    if (file && file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = function(e) {
        thumbnailPreview.innerHTML = `<img src="${e.target.result}" alt="Thumbnail Preview">`;
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Show progress when video is selected
  videoUpload.addEventListener('change', function() {
    if (this.files.length > 0) {
      // Simulate upload progress (in a real app, this would be actual upload)
      uploadProgress.style.display = 'block';
      uploadProgress.value = 0;
      
      const interval = setInterval(() => {
        uploadProgress.value += 10;
        if (uploadProgress.value >= 100) {
          clearInterval(interval);
        }
      }, 300);
    }
  });
  
  // Handle form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const donghuaId = document.getElementById('donghuaSelect').value;
    const episodeNumber = parseInt(document.getElementById('episodeNumber').value);
    const title = document.getElementById('episodeTitle').value;
    const description = document.getElementById('episodeDescription').value;
    const duration = parseInt(document.getElementById('episodeDuration').value);
    const isVip = document.getElementById('isVip').value === 'true';
    
    // Get episodes data
    const episodesData = JSON.parse(localStorage.getItem('episodesData')) || [];
    
    // Check if editing existing episode
    const editId = form.getAttribute('data-id');
    
    // Create episode object
    let episode = {
      id: editId || `${donghuaId}-${episodeNumber}`,
      donghuaId,
      episodeNumber,
      title,
      description,
      duration,
      isVip,
      thumbnail: '',
      videoUrl: '#', // Would be a real URL in production
      releaseDate: new Date().toISOString().split('T')[0]
    };
    
    // Handle thumbnail image
    const thumbnailFile = thumbnailUpload.files[0];
    if (thumbnailFile) {
      const reader = new FileReader();
      reader.onload = function(e) {
        episode.thumbnail = e.target.result;
        saveEpisode();
      };
      reader.readAsDataURL(thumbnailFile);
    } else if (editId) {
      // Keep existing thumbnail if editing
      const existingEpisode = episodesData.find(ep => ep.id === editId);
      if (existingEpisode) {
        episode.thumbnail = existingEpisode.thumbnail || '';
      }
      saveEpisode();
    } else {
      saveEpisode();
    }
    
    function saveEpisode() {
      if (editId) {
        // Update existing episode
        const index = episodesData.findIndex(ep => ep.id === editId);
        if (index !== -1) {
          episodesData[index] = episode;
        }
      } else {
        // Add new episode
        episodesData.push(episode);
      }
      
      // Save to localStorage
      localStorage.setItem('episodesData', JSON.stringify(episodesData));
      
      // Close modal
      document.getElementById('episodeModal').style.display = 'none';
      
      // Reload table
      loadEpisodeTable();
      loadDashboardStats();
    }
  });
}

// Function to edit episode
function editEpisode(id) {
  openEpisodeModal(id);
}

// Function to delete episode
function deleteEpisode(id) {
  if (confirm('Apakah Anda yakin ingin menghapus episode ini?')) {
    // Get episodes data
    const episodesData = JSON.parse(localStorage.getItem('episodesData')) || [];
    
    // Find the episode
    const index = episodesData.findIndex(ep => ep.id === id);
    
    if (index !== -1) {
      // Remove episode
      episodesData.splice(index, 1);
      localStorage.setItem('episodesData', JSON.stringify(episodesData));
      
      // Reload tables
      loadEpisodeTable();
      loadDashboardStats();
    }
  }
}

// Function to setup user form
function setupUserForm() {
  const form = document.getElementById('userForm');
  
  if (!form) return;
  
  // Handle form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const role = document.getElementById('userRole').value;
    
    // Get users data
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Find the user
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex !== -1) {
      // Update user role
      users[userIndex].role = role;
      
      // Save to localStorage
      localStorage.setItem('users', JSON.stringify(users));
      
      // Close modal
      document.getElementById('userModal').style.display = 'none';
      
      // Reload table
      loadUsersTable();
      loadDashboardStats();
    }
  });
}

// Function to edit user
function editUser(username) {
  const modal = document.getElementById('userModal');
  const form = document.getElementById('userForm');
  
  if (!modal || !form) return;
  
  // Get users data
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.username === username);
  
  if (user) {
    // Fill form fields
    document.getElementById('username').value = user.username;
    document.getElementById('email').value = user.email;
    document.getElementById('userRole').value = user.role;
    
    // Show the modal
    modal.style.display = 'flex';
  }
}
