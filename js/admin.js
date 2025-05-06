document.addEventListener('DOMContentLoaded', async function() {
  // Check if user is admin
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    // Redirect handled by checkAdminAuth
    return;
  }
  
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

// Initialize admin panel events
function initAdminPanel() {
  // Menu item click handling
  const menuItems = document.querySelectorAll('.admin-menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      const page = this.getAttribute('data-page');
      
      if (page) {
        showAdminPage(page);
        
        // Close sidebar on mobile after clicking a menu item
        const adminSidebar = document.getElementById('adminSidebar');
        const overlay = document.getElementById('overlay');
        if (window.innerWidth <= 768 && adminSidebar && overlay) {
          adminSidebar.classList.remove('active');
          overlay.style.display = 'none';
        }
      }
    });
  });
  
  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const closeSidebar = document.getElementById('closeSidebar');
  const adminSidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('overlay');
  
  if (menuToggle && adminSidebar && overlay) {
    menuToggle.addEventListener('click', function() {
      adminSidebar.classList.add('active');
      overlay.style.display = 'block';
    });
  }
  
  if (closeSidebar && adminSidebar && overlay) {
    closeSidebar.addEventListener('click', function() {
      adminSidebar.classList.remove('active');
      overlay.style.display = 'none';
    });
    
    overlay.addEventListener('click', function() {
      adminSidebar.classList.remove('active');
      this.style.display = 'none';
    });
  }
  
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
  
  // Sync buttons
  const syncDonghuaBtn = document.getElementById('syncDonghuaBtn');
  if (syncDonghuaBtn) {
    syncDonghuaBtn.addEventListener('click', function() {
      loadDonghuaTable();
      showToast('Donghua data berhasil disinkronisasi', 'success');
    });
  }
  
  const syncEpisodeBtn = document.getElementById('syncEpisodeBtn');
  if (syncEpisodeBtn) {
    syncEpisodeBtn.addEventListener('click', function() {
      loadEpisodeTable();
      showToast('Episode data berhasil disinkronisasi', 'success');
    });
  }
  
  const syncUsersBtn = document.getElementById('syncUsersBtn');
  if (syncUsersBtn) {
    syncUsersBtn.addEventListener('click', function() {
      loadUsersTable();
      showToast('User data berhasil disinkronisasi', 'success');
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
    logoutBtn.addEventListener('click', logoutUser);
  }
  
  // Show admin username
  const adminName = document.getElementById('adminName');
  if (adminName) {
    adminName.textContent = localStorage.getItem('username') || 'Admin';
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

// Function to load dashboard stats from Supabase
async function loadDashboardStats() {
  try {
    // Get counts from Supabase
    const { count: donghuaCount, error: donghuaError } = await supabase
      .from('donghua')
      .select('*', { count: 'exact', head: true });
      
    const { count: episodesCount, error: episodesError } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true });
      
    const { count: usersCount, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    const { count: vipCount, error: vipError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['vip', 'admin']);
    
    // Check for errors
    if (donghuaError) throw donghuaError;
    if (episodesError) throw episodesError;
    if (usersError) throw usersError;
    if (vipError) throw vipError;
    
    // Update stats in UI
    document.getElementById('totalDonghua').textContent = donghuaCount || 0;
    document.getElementById('totalEpisodes').textContent = episodesCount || 0;
    document.getElementById('totalUsers').textContent = usersCount || 0;
    document.getElementById('vipUsers').textContent = vipCount || 0;
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    showToast('Gagal memuat statistik dashboard', 'error');
  }
}

// Function to load donghua table from Supabase
async function loadDonghuaTable() {
  const tableBody = document.getElementById('donghuaTableBody');
  if (!tableBody) return;
  
  try {
    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Memuat data...</div></td></tr>';
    
    // Fetch donghua data from Supabase
    const { data: donghuaData, error } = await supabase
      .from('donghua')
      .select('*')
      .order('title');
      
    if (error) throw error;
    
    // Clear table
    tableBody.innerHTML = '';
    
    if (!donghuaData || donghuaData.length === 0) {
      // Show empty state
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
            <div class="empty-state">
              <i class="fas fa-film fa-3x"></i>
              <p>Belum ada donghua. Klik tombol "Tambah Donghua" untuk menambahkan.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    // Add row for each donghua
    donghuaData.forEach((donghua) => {
      const row = document.createElement('tr');
      
      // Status badge class
      let statusClass = '';
      if (donghua.status === 'Ongoing') statusClass = 'status-ongoing';
      else if (donghua.status === 'Completed') statusClass = 'status-completed';
      else statusClass = 'status-coming';
      
      row.innerHTML = `
        <td>
          <div class="table-poster">
            <img src="${donghua.poster_url || 'images/default-poster.jpg'}" alt="${donghua.title}">
          </div>
        </td>
        <td>${donghua.title}</td>
        <td>${donghua.year}</td>
        <td>${donghua.genre}</td>
        <td><span class="status-badge ${statusClass}">${donghua.status}</span></td>
        <td>
          <div class="table-actions">
            <button class="edit-btn" onclick="editDonghua(${donghua.id})"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" onclick="deleteDonghua(${donghua.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading donghua table:', error);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center error-message">Terjadi kesalahan: ${error.message}</td></tr>`;
  }
}

// Function to load episode table from Supabase
async function loadEpisodeTable() {
  const tableBody = document.getElementById('episodeTableBody');
  if (!tableBody) return;
  
  try {
    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Memuat data...</div></td></tr>';
    
    // Fetch episodes with donghua titles using join
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select(`
        *,
        donghua:donghua_id (title)
      `)
      .order('donghua_id')
      .order('episode_number');
      
    if (error) throw error;
    
    // Clear table
    tableBody.innerHTML = '';
    
    if (!episodes || episodes.length === 0) {
      // Show empty state
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
            <div class="empty-state">
              <i class="fas fa-video fa-3x"></i>
              <p>Belum ada episode. Klik tombol "Tambah Episode" untuk menambahkan.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    // Add row for each episode
    episodes.forEach((episode) => {
      const row = document.createElement('tr');
      
      // VIP status badge
      const vipStatus = episode.is_vip ? 
        '<span class="status-badge status-vip">VIP</span>' : 
        '<span class="status-badge status-free">Free</span>';
      
      row.innerHTML = `
        <td>
          <div class="table-thumbnail">
            <img src="${episode.thumbnail_url || 'images/default-thumbnail.jpg'}" alt="Episode ${episode.episode_number}">
          </div>
        </td>
        <td>${episode.donghua?.title || 'Unknown'}</td>
        <td>${episode.episode_number}</td>
        <td>${episode.title}</td>
        <td>${vipStatus}</td>
        <td>
          <div class="table-actions">
            <button class="edit-btn" onclick="editEpisode('${episode.id}')"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" onclick="deleteEpisode('${episode.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading episode table:', error);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center error-message">Terjadi kesalahan: ${error.message}</td></tr>`;
  }
}

// Function to load users table from Supabase
async function loadUsersTable() {
  const tableBody = document.getElementById('usersTableBody');
  if (!tableBody) return;
  
  try {
    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Memuat data...</div></td></tr>';
    
    // Fetch users from Supabase
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Clear table
    tableBody.innerHTML = '';
    
    if (!users || users.length === 0) {
      // Show empty state
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">
            <div class="empty-state">
              <i class="fas fa-users fa-3x"></i>
              <p>Belum ada pengguna terdaftar.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    // Add row for each user
    users.forEach((user) => {
      const row = document.createElement('tr');
      
      // Format date
      const createdDate = new Date(user.created_at).toLocaleDateString('id-ID');
      
      // Role badge class
      let roleClass = '';
      if (user.role === 'admin') roleClass = 'status-completed';
      else if (user.role === 'vip') roleClass = 'status-vip';
      else roleClass = 'status-ongoing';
      
      row.innerHTML = `
        <td>${user.username}</td>
        <td>${user.email || '-'}</td>
        <td><span class="status-badge ${roleClass}">${user.role}</span></td>
        <td>${createdDate}</td>
        <td>
          <div class="table-actions">
            <button class="edit-btn" onclick="editUser('${user.id}')"><i class="fas fa-edit"></i></button>
          </div>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading users table:', error);
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center error-message">Terjadi kesalahan: ${error.message}</td></tr>`;
  }
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
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = form.querySelector('.submit-button');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    
    const title = document.getElementById('title').value;
    const year = parseInt(document.getElementById('year').value);
    const genre = document.getElementById('genre').value;
    const status = document.getElementById('status').value;
    const rating = parseFloat(document.getElementById('rating').value);
    const synopsis = document.getElementById('synopsis').value;
    
    // Create donghua object
    let donghua = {
      title,
      year,
      genre,
      status,
      rating,
      synopsis,
      poster_url: null,
      backdrop_url: null
    };
    
    try {
      // Check if editing existing donghua
      const editId = form.getAttribute('data-id');
      
      // Handle poster image
      const posterFile = posterUpload.files[0];
      if (posterFile) {
        const posterPath = `donghua/${Date.now()}_poster_${posterFile.name.replace(/\s/g, '_')}`;
        const posterUrl = await handleFileUpload(posterFile, 'posters', posterPath);
        if (posterUrl) donghua.poster_url = posterUrl;
      }
      
      // Handle backdrop image
      const backdropFile = backdropUpload.files[0];
      if (backdropFile) {
        const backdropPath = `donghua/${Date.now()}_backdrop_${backdropFile.name.replace(/\s/g, '_')}`;
        const backdropUrl = await handleFileUpload(backdropFile, 'backdrops', backdropPath);
        if (backdropUrl) donghua.backdrop_url = backdropUrl;
      }
      
      let result;
      if (editId) {
        // Get current donghua data to keep existing image URLs if not uploading new ones
        if (!posterFile || !backdropFile) {
          const { data: currentDonghua } = await supabase
            .from('donghua')
            .select('poster_url, backdrop_url')
            .eq('id', editId)
            .single();
            
          if (currentDonghua) {
            // Keep existing image URLs if not uploading new ones
            if (!posterFile && currentDonghua.poster_url) {
              donghua.poster_url = currentDonghua.poster_url;
            }
            
            if (!backdropFile && currentDonghua.backdrop_url) {
              donghua.backdrop_url = currentDonghua.backdrop_url;
            }
          }
        }
        
        // Update existing donghua
        const { error } = await supabase
          .from('donghua')
          .update(donghua)
          .eq('id', editId);
          
        if (error) throw error;
        
        showToast('Donghua berhasil diperbarui!', 'success');
        result = { success: true };
      } else {
        // Add new donghua
        const { data, error } = await supabase
          .from('donghua')
          .insert(donghua)
          .select();
          
        if (error) throw error;
        
        showToast('Donghua baru berhasil ditambahkan!', 'success');
        result = { success: true, data };
      }
      
      // Close modal
      document.getElementById('donghuaModal').style.display = 'none';
      
      // Reload table
      loadDonghuaTable();
      loadDashboardStats();
    } catch (error) {
      console.error('Error saving donghua:', error);
      showToast('Terjadi kesalahan saat menyimpan data: ' + error.message, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Simpan';
    }
  });
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
  
  // Load donghua options
  loadDonghuaOptions();
  
  // Handle form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = form.querySelector('.submit-button');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    
    const donghuaId = parseInt(document.getElementById('donghuaSelect').value);
    const episodeNumber = parseInt(document.getElementById('episodeNumber').value);
    const title = document.getElementById('episodeTitle').value;
    const description = document.getElementById('episodeDescription').value;
    const duration = parseInt(document.getElementById('episodeDuration').value);
    const isVip = document.getElementById('isVip').value === 'true';
    
    // Generate UUID for new episode (if needed)
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    // Create episode object
    let episode = {
      donghua_id: donghuaId,
      episode_number: episodeNumber,
      title,
      description,
      duration,
      is_vip: isVip,
      thumbnail_url: null,
      video_url: null,
      release_date: new Date().toISOString().split('T')[0]
    };
    
    try {
      // Check if editing existing episode or adding new one
      const editId = form.getAttribute('data-id');
      const episodeId = editId || generateUUID();
      
      if (editId) {
        episode.id = editId;
      } else {
        episode.id = episodeId;
      }
      
      // Handle thumbnail image
      const thumbnailFile = thumbnailUpload.files[0];
      if (thumbnailFile) {
        const thumbnailPath = `episodes/${donghuaId}-${episodeNumber}_thumb_${Date.now()}`;
        const thumbnailUrl = await handleFileUpload(thumbnailFile, 'thumbnails', thumbnailPath);
        if (thumbnailUrl) episode.thumbnail_url = thumbnailUrl;
      }
      
      // Handle video file
      const videoFile = videoUpload.files[0];
      if (videoFile) {
        // Show upload progress
        uploadProgress.style.display = 'block';
        uploadProgress.value = 0;
        
        const videoPath = `episodes/${donghuaId}-${episodeNumber}_video_${Date.now()}`;
        const videoUrl = await handleFileUpload(videoFile, 'videos', videoPath, (progress) => {
          uploadProgress.value = progress;
        });
        
        if (videoUrl) episode.video_url = videoUrl;
      }
      
      // If editing, get current episode data to keep existing URLs if not uploading new ones
      if (editId) {
        if (!thumbnailFile || !videoFile) {
          const { data: currentEpisode } = await supabase
            .from('episodes')
            .select('thumbnail_url, video_url')
            .eq('id', editId)
            .single();
            
          if (currentEpisode) {
            // Keep existing URLs if not uploading new ones
            if (!thumbnailFile && currentEpisode.thumbnail_url) {
              episode.thumbnail_url = currentEpisode.thumbnail_url;
            }
            
            if (!videoFile && currentEpisode.video_url) {
              episode.video_url = currentEpisode.video_url;
            }
          }
        }
        
        // Update existing episode
        const { error } = await supabase
          .from('episodes')
          .update(episode)
          .eq('id', editId);
          
        if (error) throw error;
        
        showToast('Episode berhasil diperbarui!', 'success');
      } else {
        // Add new episode
        const { error } = await supabase
          .from('episodes')
          .insert(episode);
          
        if (error) throw error;
        
        showToast('Episode baru berhasil ditambahkan!', 'success');
      }
      
      // Close modal
      document.getElementById('episodeModal').style.display = 'none';
      
      // Reset form
      form.reset();
      document.getElementById('thumbnailPreview').innerHTML = '';
      uploadProgress.style.display = 'none';
      
      // Reload table
      loadEpisodeTable();
      loadDashboardStats();
    } catch (error) {
      console.error('Error saving episode:', error);
      showToast('Terjadi kesalahan saat menyimpan data: ' + error.message, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Simpan';
    }
  });
}

// Function to load donghua options for episode form
async function loadDonghuaOptions() {
  const donghuaSelect = document.getElementById('donghuaSelect');
  if (!donghuaSelect) return;
  
  try {
    // Clear existing options
    donghuaSelect.innerHTML = '<option value="" disabled selected>Loading...</option>';
    
    // Fetch donghua data from Supabase
    const { data: donghuaData, error } = await supabase
      .from('donghua')
      .select('id, title')
      .order('title');
      
    if (error) throw error;
    
    // Clear loading option
    donghuaSelect.innerHTML = '';
    
    if (!donghuaData || donghuaData.length === 0) {
      donghuaSelect.innerHTML = '<option value="" disabled>Tidak ada donghua tersedia</option>';
      return;
    }
    
    // Add option for each donghua
    donghuaData.forEach(donghua => {
      const option = document.createElement('option');
      option.value = donghua.id;
      option.textContent = donghua.title;
      donghuaSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading donghua options:', error);
    donghuaSelect.innerHTML = '<option value="" disabled>Error loading donghua</option>';
  }
}

// Function to setup user form
function setupUserForm() {
  const form = document.getElementById('userForm');
  
  if (!form) return;
  
  // Handle form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const role = document.getElementById('userRole').value;
    
    if (!userId) {
      showToast('User ID tidak valid', 'error');
      return;
    }
    
    const submitButton = form.querySelector('.submit-button');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memperbarui...';
    
    try {
      // Update user role in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Close modal
      document.getElementById('userModal').style.display = 'none';
      
      // Reload table
      loadUsersTable();
      loadDashboardStats();
      
      // Show success message
      showToast('Status pengguna berhasil diperbarui menjadi ' + role, 'success');
    } catch (error) {
      console.error('Error updating user role:', error);
      showToast('Gagal memperbarui status pengguna: ' + error.message, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Perbarui';
    }
  });
}

// Function to edit donghua
async function editDonghua(id) {
  try {
    // Get donghua data from Supabase
    const { data: donghua, error } = await supabase
      .from('donghua')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    if (!donghua) {
      showToast('Donghua tidak ditemukan', 'error');
      return;
    }
    
    openDonghuaModal(donghua);
  } catch (error) {
    console.error('Error fetching donghua for edit:', error);
    showToast('Gagal memuat data donghua: ' + error.message, 'error');
  }
}

// Function to delete donghua
async function deleteDonghua(id) {
  if (confirm('Apakah Anda yakin ingin menghapus donghua ini? Semua episode terkait juga akan dihapus.')) {
    try {
      // First delete all episodes related to this donghua
      const { error: episodesError } = await supabase
        .from('episodes')
        .delete()
        .eq('donghua_id', id);
        
      if (episodesError) throw episodesError;
      
      // Then delete the donghua
      const { error } = await supabase
        .from('donghua')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      showToast('Donghua dan semua episodenya berhasil dihapus', 'success');
      
      // Reload tables
      loadDonghuaTable();
      loadEpisodeTable();
      loadDashboardStats();
    } catch (error) {
      console.error('Error deleting donghua:', error);
      showToast('Gagal menghapus donghua: ' + error.message, 'error');
    }
  }
}

// Function to edit episode
async function editEpisode(id) {
  try {
    // Get episode data from Supabase
    const { data: episode, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    if (!episode) {
      showToast('Episode tidak ditemukan', 'error');
      return;
    }
    
    openEpisodeModal(episode);
  } catch (error) {
    console.error('Error fetching episode for edit:', error);
    showToast('Gagal memuat data episode: ' + error.message, 'error');
  }
}

// Function to delete episode
async function deleteEpisode(id) {
  if (confirm('Apakah Anda yakin ingin menghapus episode ini?')) {
    try {
      // Delete the episode
      const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      showToast('Episode berhasil dihapus', 'success');
      
      // Reload table
      loadEpisodeTable();
      loadDashboardStats();
    } catch (error) {
      console.error('Error deleting episode:', error);
      showToast('Gagal menghapus episode: ' + error.message, 'error');
    }
  }
}

// Function to edit user role
async function editUser(id) {
  try {
    // Get user data from Supabase
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    if (!user) {
      showToast('Pengguna tidak ditemukan', 'error');
      return;
    }
    
    // Open user modal
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    
    if (!modal || !form) return;
    
    // Fill form fields
    document.getElementById('userId').value = user.id;
    document.getElementById('username').value = user.username;
    document.getElementById('email').value = user.email || '';
    document.getElementById('userRole').value = user.role;
    
    // Show the modal
    modal.style.display = 'flex';
  } catch (error) {
    console.error('Error loading user for edit:', error);
    showToast('Gagal memuat data pengguna: ' + error.message, 'error');
  }
}

// Function to open donghua modal
function openDonghuaModal(donghua = null) {
  const modal = document.getElementById('donghuaModal');
  const form = document.getElementById('donghuaForm');
  const modalTitle = document.getElementById('donghuaModalTitle');
  
  if (!modal || !form) return;
  
  // Clear form
  form.reset();
  
  // Clear previews
  document.getElementById('posterPreview').innerHTML = '';
  document.getElementById('backdropPreview').innerHTML = '';
  
  if (donghua) {
    // Edit existing donghua
    modalTitle.textContent = 'Edit Donghua';
    
    // Fill form fields
    document.getElementById('title').value = donghua.title;
    document.getElementById('year').value = donghua.year;
    document.getElementById('genre').value = donghua.genre;
    document.getElementById('status').value = donghua.status;
    document.getElementById('rating').value = donghua.rating;
    document.getElementById('synopsis').value = donghua.synopsis;
    
    // Show existing images
    if (donghua.poster_url) {
      const posterPreview = document.getElementById('posterPreview');
      posterPreview.innerHTML = `<img src="${donghua.poster_url}" alt="Poster">`;
    }
    
    if (donghua.backdrop_url) {
      const backdropPreview = document.getElementById('backdropPreview');
      backdropPreview.innerHTML = `<img src="${donghua.backdrop_url}" alt="Backdrop">`;
    }
    
    // Store the donghua ID for updating
    form.setAttribute('data-id', donghua.id);
  } else {
    // Add new donghua
    modalTitle.textContent = 'Tambah Donghua';
    form.removeAttribute('data-id');
  }
  
  // Show the modal
  modal.style.display = 'flex';
}

// Function to open episode modal
async function openEpisodeModal(episode = null) {
  const modal = document.getElementById('episodeModal');
  const form = document.getElementById('episodeForm');
  const modalTitle = document.getElementById('episodeModalTitle');
  
  if (!modal || !form) return;
  
  // Clear form
  form.reset();
  document.getElementById('thumbnailPreview').innerHTML = '';
  document.getElementById('uploadProgress').style.display = 'none';
  
  // Make sure donghua options are loaded
  await loadDonghuaOptions();
  
  if (episode) {
    // Edit existing episode
    modalTitle.textContent = 'Edit Episode';
    
    // Fill form fields
    document.getElementById('donghuaSelect').value = episode.donghua_id;
    document.getElementById('episodeNumber').value = episode.episode_number;
    document.getElementById('episodeTitle').value = episode.title;
    document.getElementById('episodeDescription').value = episode.description || '';
    document.getElementById('episodeDuration').value = episode.duration || '';
    document.getElementById('isVip').value = episode.is_vip ? 'true' : 'false';
    
    // Show existing thumbnail
    if (episode.thumbnail_url) {
      const thumbnailPreview = document.getElementById('thumbnailPreview');
      thumbnailPreview.innerHTML = `<img src="${episode.thumbnail_url}" alt="Thumbnail">`;
    }
    
    // Store the episode ID for updating
    form.setAttribute('data-id', episode.id);
  } else {
    // Add new episode
    modalTitle.textContent = 'Tambah Episode';
    form.removeAttribute('data-id');
  }
  
  // Show the modal
  modal.style.display = 'flex';
}

// Function to handle file uploads to Supabase Storage
async function handleFileUpload(file, bucket, path, onProgress) {
  if (!file) return null;
  
  try {
    // In a real app with proper Supabase storage setup, use this:
    const { data, error } = await supabaseStorage.uploadFile(bucket, path, file);
    
    if (error) throw error;
    if (onProgress) onProgress(100);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    showToast('Gagal mengupload file: ' + error.message, 'error');
    return null;
  }
}

// Helper function to show toast messages
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Automatically remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
