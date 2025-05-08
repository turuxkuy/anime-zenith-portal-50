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
  
  // Debug Supabase
  console.log('Supabase client initialized:', !!supabase);
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
  const posterUrlInput = document.getElementById('posterUrl');
  const backdropUrlInput = document.getElementById('backdropUrl');
  
  if (!form || !posterUrlInput || !backdropUrlInput) {
    console.error('Donghua form elements not found!');
    return;
  }
  
  console.log('Setting up donghua form');
  
  // Preview poster image when URL is entered
  posterUrlInput.addEventListener('change', function() {
    const url = this.value;
    const posterPreview = document.getElementById('posterPreview');
    
    if (url && isValidUrl(url)) {
      posterPreview.innerHTML = `<img src="${url}" alt="Poster Preview">`;
    } else {
      posterPreview.innerHTML = '';
    }
  });
  
  // Preview backdrop image when URL is entered
  backdropUrlInput.addEventListener('change', function() {
    const url = this.value;
    const backdropPreview = document.getElementById('backdropPreview');
    
    if (url && isValidUrl(url)) {
      backdropPreview.innerHTML = `<img src="${url}" alt="Backdrop Preview">`;
    } else {
      backdropPreview.innerHTML = '';
    }
  });
  
  // Handle form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Donghua form submitted');
    
    const submitButton = form.querySelector('.submit-button');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    
    try {
      const title = document.getElementById('title').value;
      const year = parseInt(document.getElementById('year').value);
      const genre = document.getElementById('genre').value;
      const status = document.getElementById('status').value;
      const rating = parseFloat(document.getElementById('rating').value);
      const synopsis = document.getElementById('synopsis').value;
      const poster_url = document.getElementById('posterUrl').value;
      const backdrop_url = document.getElementById('backdropUrl').value;
      
      console.log('Form data:', { title, year, genre, status, rating, synopsis, poster_url, backdrop_url });
    
      // Create donghua object
      let donghua = {
        title,
        year,
        genre,
        status,
        rating,
        synopsis,
        poster_url,
        backdrop_url
      };
      
      if (!supabase) {
        console.error('Supabase client is not initialized!');
        throw new Error('Database connection failed');
      }
      
      console.log('Attempting to save to Supabase...');
      
      // Check if editing existing donghua
      const editId = form.getAttribute('data-id');
      
      let result;
      if (editId) {
        // Update existing donghua
        console.log('Updating donghua with ID:', editId);
        const { data, error } = await supabase
          .from('donghua')
          .update(donghua)
          .eq('id', editId)
          .select();
          
        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
        
        console.log('Update result:', data);
        
        showToast('Donghua berhasil diperbarui!', 'success');
        result = { success: true, data };
      } else {
        // Add new donghua
        console.log('Inserting new donghua');
        const { data, error } = await supabase
          .from('donghua')
          .insert(donghua)
          .select();
          
        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
        
        console.log('Insert result:', data);
        
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
  const thumbnailUrlInput = document.getElementById('thumbnailUrl');
  
  if (!form || !thumbnailUrlInput) {
    console.error('Episode form elements not found!');
    return;
  }
  
  console.log('Setting up episode form');
  
  // Preview thumbnail image when URL is entered
  thumbnailUrlInput.addEventListener('change', function() {
    const url = this.value;
    const thumbnailPreview = document.getElementById('thumbnailPreview');
    
    if (url && isValidUrl(url)) {
      thumbnailPreview.innerHTML = `<img src="${url}" alt="Thumbnail Preview">`;
    } else {
      thumbnailPreview.innerHTML = '';
    }
  });
  
  // Load donghua options
  loadDonghuaOptions();
  
  // Handle form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Episode form submitted');
    
    const submitButton = form.querySelector('.submit-button');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    
    try {
      const donghuaId = parseInt(document.getElementById('donghuaSelect').value);
      const episodeNumber = parseInt(document.getElementById('episodeNumber').value);
      const title = document.getElementById('episodeTitle').value;
      const description = document.getElementById('episodeDescription').value;
      const duration = parseInt(document.getElementById('episodeDuration').value);
      const isVip = document.getElementById('isVip').value === 'true';
      const thumbnail_url = document.getElementById('thumbnailUrl').value;
      const video_url = document.getElementById('videoUrl').value;
      
      console.log('Form data:', { donghuaId, episodeNumber, title, description, duration, isVip, thumbnail_url, video_url });
    
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
        thumbnail_url,
        video_url,
        release_date: new Date().toISOString().split('T')[0]
      };
      
      // Check if editing existing episode or adding new one
      const editId = form.getAttribute('data-id');
      const episodeId = editId || generateUUID();
      
      if (editId) {
        episode.id = editId;
      } else {
        episode.id = episodeId;
      }
      
      console.log('Episode object to save:', episode);
      
      // Save to Supabase
      if (editId) {
        // Update existing episode
        console.log('Updating episode with ID:', editId);
        const { data, error } = await supabase
          .from('episodes')
          .update(episode)
          .eq('id', editId)
          .select();
          
        if (error) throw error;
        console.log('Update result:', data);
        
        showToast('Episode berhasil diperbarui!', 'success');
      } else {
        // Add new episode
        console.log('Inserting new episode with ID:', episodeId);
        const { data, error } = await supabase
          .from('episodes')
          .insert(episode)
          .select();
          
        if (error) throw error;
        console.log('Insert result:', data);
        
        showToast('Episode baru berhasil ditambahkan!', 'success');
      }
      
      // Close modal
      document.getElementById('episodeModal').style.display = 'none';
      
      // Reset form
      form.reset();
      document.getElementById('thumbnailPreview').innerHTML = '';
      
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
    document.getElementById('posterUrl').value = donghua.poster_url || '';
    document.getElementById('backdropUrl').value = donghua.backdrop_url || '';
    
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
    document.getElementById('thumbnailUrl').value = episode.thumbnail_url || '';
    document.getElementById('videoUrl').value = episode.video_url || '';
    
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

// Helper function to check if a string is a valid URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Helper function to show toast messages
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  
  if (!toastContainer) {
    console.error('Toast container not found!');
    return;
  }
  
  console.log('Showing toast:', message, type);
  
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

// Function to check if the user is admin
async function checkAdminAuth() {
  try {
    console.log('Checking admin auth...');
    console.log('Supabase object availability:', supabase ? "Available" : "Not available");
    
    const { data } = await supabase.auth.getSession();
    console.log('Auth session data:', data);
    
    if (!data.session) {
      console.log('No session found, redirecting to login');
      window.location.href = 'login-admin.html';
      return false;
    }
    
    console.log('User ID from session:', data.session.user.id);
    
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.session.user.id)
      .single();
      
    console.log('Profile data:', profileData);
    console.log('Profile error:', error);
    
    if (error || !profileData) {
      console.error('Error fetching user role or profile not found:', error);
      // For debugging purposes, we'll temporarily bypass the auth check in development
      // WARNING: REMOVE THIS IN PRODUCTION
      console.log('DEBUG MODE: Bypassing auth check for debugging');
      return true; // Temporary bypass for testing
      
      // In production, uncomment these lines:
      // await supabase.auth.signOut();
      // window.location.href = 'login-admin.html';
      // return false;
    }
    
    console.log('User role:', profileData.role);
    
    if (profileData.role !== 'admin') {
      console.log('User is not an admin, redirecting to login');
      
      // For debugging purposes, we'll temporarily bypass the role check in development
      // WARNING: REMOVE THIS IN PRODUCTION
      console.log('DEBUG MODE: Bypassing role check for debugging');
      return true; // Temporary bypass for testing
      
      // In production, uncomment these lines:
      // await supabase.auth.signOut();
      // window.location.href = 'login.html';
      // return false;
    }
    
    console.log('Admin authentication successful');
    return true;
  } catch (error) {
    console.error('Error checking admin auth:', error);
    
    // For debugging purposes, we'll temporarily bypass error handling in development
    // WARNING: REMOVE THIS IN PRODUCTION
    console.log('DEBUG MODE: Bypassing error handling for debugging');
    return true; // Temporary bypass for testing
    
    // In production, uncomment these lines:
    // window.location.href = 'login-admin.html';
    // return false;
  }
}

// Function to log out the user
async function logoutUser() {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('auth');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    window.location.href = 'login-admin.html';
  } catch (error) {
    console.error('Error logging out:', error);
    showToast('Gagal keluar dari akun: ' + error.message, 'error');
  }
}
