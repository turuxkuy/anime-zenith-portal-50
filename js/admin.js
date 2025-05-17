
// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Admin page loaded');
  
  // Check if supabase client is available
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase client not available');
    showToast('Error: Database connection not available', 'error');
    return;
  }
  
  // Check if user is admin, redirect if not
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    window.location.href = 'index.html';
    return;
  }
  
  // Get admin name
  const adminName = document.getElementById('adminName');
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();
    
    if (profile && adminName) {
      adminName.textContent = profile.username || user.email;
    }
  }
  
  // Set up event listeners for menu toggle
  setupSidebar();
  
  // Load initial dashboard data
  loadDashboardStats();
  
  // Set up event handlers for menu items
  document.querySelectorAll('.admin-menu-item').forEach(item => {
    if (item.id !== 'logoutBtn') {
      item.addEventListener('click', function() {
        const pageId = this.getAttribute('data-page');
        changePage(pageId);
      });
    }
  });
  
  // Set up logout button
  document.getElementById('logoutBtn').addEventListener('click', async function() {
    await logoutUser();
  });
  
  // Set up buttons in donghua section
  document.getElementById('addDonghuaBtn').addEventListener('click', function() {
    document.getElementById('donghuaModalTitle').textContent = 'Tambah Donghua';
    document.getElementById('donghuaForm').reset();
    document.getElementById('posterPreview').innerHTML = '';
    document.getElementById('backdropPreview').innerHTML = '';
    openModal('donghuaModal');
  });
  
  document.getElementById('syncDonghuaBtn').addEventListener('click', function() {
    loadDonghuaData();
  });
  
  // Set up buttons in episode section
  document.getElementById('addEpisodeBtn').addEventListener('click', async function() {
    document.getElementById('episodeModalTitle').textContent = 'Tambah Episode';
    document.getElementById('episodeForm').reset();
    document.getElementById('thumbnailPreview').innerHTML = '';
    await loadDonghuaSelect();
    openModal('episodeModal');
  });
  
  document.getElementById('syncEpisodeBtn').addEventListener('click', function() {
    loadEpisodeData();
  });
  
  // Set up buttons in users section
  document.getElementById('syncUsersBtn').addEventListener('click', function() {
    loadUsersData();
  });
  
  document.getElementById('checkExpiredBtn').addEventListener('click', async function() {
    await checkExpiredVip();
  });
  
  // Set up form submissions
  setupFormSubmissions();
  
  // Set up close modal buttons
  setupModalCloseButtons();
  
  // Image preview functionality
  setupImagePreviewFunctions();
  
  // Load initial data for tables
  loadDonghuaData();
  loadEpisodeData();
  loadUsersData();
});

// Function to set up sidebar
function setupSidebar() {
  const menuToggle = document.getElementById('menuToggle');
  const adminSidebar = document.getElementById('adminSidebar');
  const closeSidebar = document.getElementById('closeSidebar');
  const overlay = document.getElementById('overlay');
  
  menuToggle.addEventListener('click', function() {
    adminSidebar.classList.add('active');
    overlay.classList.add('active');
  });
  
  closeSidebar.addEventListener('click', function() {
    adminSidebar.classList.remove('active');
    overlay.classList.remove('active');
  });
  
  overlay.addEventListener('click', function() {
    adminSidebar.classList.remove('active');
    overlay.classList.remove('active');
  });
}

// Function to change admin page
function changePage(pageId) {
  // Hide all pages
  document.querySelectorAll('.admin-page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show selected page
  document.getElementById(pageId).classList.add('active');
  
  // Update page title
  document.getElementById('pageTitle').textContent = 
    pageId === 'dashboard' ? 'Dashboard' :
    pageId === 'donghua' ? 'Donghua' :
    pageId === 'episode' ? 'Episode' : 'Pengguna';
  
  // Update menu active state
  document.querySelectorAll('.admin-menu-item').forEach(item => {
    item.classList.remove('active');
  });
  
  document.querySelector(`.admin-menu-item[data-page="${pageId}"]`).classList.add('active');
  
  // Hide sidebar on mobile after page change
  document.getElementById('adminSidebar').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
}

// Function to load dashboard stats
async function loadDashboardStats() {
  try {
    // Count donghua
    const { count: donghuaCount, error: donghuaError } = await supabase
      .from('donghua')
      .select('*', { count: 'exact', head: true });
    
    if (!donghuaError) {
      document.getElementById('totalDonghua').textContent = donghuaCount;
    }
    
    // Count episodes
    const { count: episodeCount, error: episodeError } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true });
    
    if (!episodeError) {
      document.getElementById('totalEpisodes').textContent = episodeCount;
    }
    
    // Count users
    const { count: userCount, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (!userError) {
      document.getElementById('totalUsers').textContent = userCount;
    }
    
    // Count VIP users
    const { count: vipCount, error: vipError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'vip');
    
    if (!vipError) {
      document.getElementById('vipUsers').textContent = vipCount;
    }
    
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    showToast('Gagal memuat statistik', 'error');
  }
}

// Function to load donghua data
async function loadDonghuaData() {
  try {
    const { data, error } = await supabase
      .from('donghua')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const tableBody = document.getElementById('donghuaTableBody');
    tableBody.innerHTML = '';
    
    if (data && data.length > 0) {
      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <div class="poster-thumbnail">
              <img src="${item.poster_url || '/images/placeholder.jpg'}" alt="${item.title}">
            </div>
          </td>
          <td>${item.title}</td>
          <td>${item.year}</td>
          <td>${item.genre}</td>
          <td><span class="status-badge ${item.status.toLowerCase()}">${item.status}</span></td>
          <td>
            <button class="action-button edit-button" data-id="${item.id}"><i class="fas fa-edit"></i></button>
            <button class="action-button delete-button" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
          </td>
        `;
        
        tableBody.appendChild(row);
        
        // Add event listener for edit button
        const editBtn = row.querySelector('.edit-button');
        editBtn.addEventListener('click', function() {
          editDonghua(item);
        });
        
        // Add event listener for delete button
        const deleteBtn = row.querySelector('.delete-button');
        deleteBtn.addEventListener('click', function() {
          deleteDonghua(item.id);
        });
      });
    } else {
      tableBody.innerHTML = `<tr><td colspan="6" class="no-data">Tidak ada data donghua</td></tr>`;
    }
    
  } catch (error) {
    console.error('Error loading donghua data:', error);
    showToast('Gagal memuat data donghua', 'error');
  }
}

// Function to edit donghua
function editDonghua(donghua) {
  document.getElementById('donghuaModalTitle').textContent = 'Edit Donghua';
  
  const form = document.getElementById('donghuaForm');
  form.dataset.id = donghua.id;
  
  form.elements['title'].value = donghua.title;
  form.elements['year'].value = donghua.year;
  form.elements['genre'].value = donghua.genre;
  form.elements['status'].value = donghua.status;
  form.elements['rating'].value = donghua.rating;
  form.elements['synopsis'].value = donghua.synopsis;
  form.elements['posterUrl'].value = donghua.poster_url || '';
  form.elements['backdropUrl'].value = donghua.backdrop_url || '';
  
  // Show poster preview
  if (donghua.poster_url) {
    document.getElementById('posterPreview').innerHTML = `<img src="${donghua.poster_url}" alt="Poster Preview">`;
  } else {
    document.getElementById('posterPreview').innerHTML = '';
  }
  
  // Show backdrop preview
  if (donghua.backdrop_url) {
    document.getElementById('backdropPreview').innerHTML = `<img src="${donghua.backdrop_url}" alt="Backdrop Preview">`;
  } else {
    document.getElementById('backdropPreview').innerHTML = '';
  }
  
  openModal('donghuaModal');
}

// Function to delete donghua
async function deleteDonghua(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus donghua ini?')) return;
  
  try {
    // First delete all episodes associated with this donghua
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
    
    showToast('Donghua berhasil dihapus', 'success');
    loadDonghuaData();
    loadEpisodeData();
    loadDashboardStats();
    
  } catch (error) {
    console.error('Error deleting donghua:', error);
    showToast('Gagal menghapus donghua', 'error');
  }
}

// Function to load episode data
async function loadEpisodeData() {
  try {
    const { data, error } = await supabase
      .from('episodes')
      .select(`
        *,
        donghua:donghua_id (title)
      `)
      .order('donghua_id', { ascending: true })
      .order('episode_number', { ascending: true });
    
    if (error) throw error;
    
    const tableBody = document.getElementById('episodeTableBody');
    tableBody.innerHTML = '';
    
    if (data && data.length > 0) {
      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <div class="episode-thumbnail">
              <img src="${item.thumbnail_url || '/images/placeholder.jpg'}" alt="Episode ${item.episode_number}">
            </div>
          </td>
          <td>${item.donghua?.title || 'Unknown'}</td>
          <td>Episode ${item.episode_number}</td>
          <td>${item.title}</td>
          <td><span class="status-badge ${item.is_vip ? 'vip' : 'public'}">${item.is_vip ? 'VIP' : 'Umum'}</span></td>
          <td>
            <button class="action-button edit-button" data-id="${item.id}"><i class="fas fa-edit"></i></button>
            <button class="action-button delete-button" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
          </td>
        `;
        
        tableBody.appendChild(row);
        
        // Add event listener for edit button
        const editBtn = row.querySelector('.edit-button');
        editBtn.addEventListener('click', function() {
          editEpisode(item);
        });
        
        // Add event listener for delete button
        const deleteBtn = row.querySelector('.delete-button');
        deleteBtn.addEventListener('click', function() {
          deleteEpisode(item.id);
        });
      });
    } else {
      tableBody.innerHTML = `<tr><td colspan="6" class="no-data">Tidak ada data episode</td></tr>`;
    }
    
  } catch (error) {
    console.error('Error loading episode data:', error);
    showToast('Gagal memuat data episode', 'error');
  }
}

// Function to load donghua select options
async function loadDonghuaSelect() {
  try {
    const { data, error } = await supabase
      .from('donghua')
      .select('id, title')
      .order('title', { ascending: true });
    
    if (error) throw error;
    
    const donghuaSelect = document.getElementById('donghuaSelect');
    donghuaSelect.innerHTML = '<option value="">Pilih Donghua</option>';
    
    if (data && data.length > 0) {
      data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.title;
        donghuaSelect.appendChild(option);
      });
    }
    
  } catch (error) {
    console.error('Error loading donghua select:', error);
    showToast('Gagal memuat daftar donghua', 'error');
  }
}

// Function to edit episode
async function editEpisode(episode) {
  document.getElementById('episodeModalTitle').textContent = 'Edit Episode';
  
  // Load donghua options first
  await loadDonghuaSelect();
  
  const form = document.getElementById('episodeForm');
  form.dataset.id = episode.id;
  
  form.elements['donghuaSelect'].value = episode.donghua_id;
  form.elements['episodeNumber'].value = episode.episode_number;
  form.elements['episodeTitle'].value = episode.title;
  form.elements['episodeDescription'].value = episode.description || '';
  form.elements['episodeDuration'].value = episode.duration || '';
  form.elements['isVip'].value = episode.is_vip.toString();
  form.elements['thumbnailUrl'].value = episode.thumbnail_url || '';
  form.elements['videoUrl'].value = episode.video_url || '';
  
  // Format release date for input
  const releaseDate = new Date(episode.release_date);
  const formattedDate = releaseDate.toISOString().split('T')[0];
  form.elements['releaseDate'].value = formattedDate;
  
  // Show thumbnail preview
  if (episode.thumbnail_url) {
    document.getElementById('thumbnailPreview').innerHTML = `<img src="${episode.thumbnail_url}" alt="Thumbnail Preview">`;
  } else {
    document.getElementById('thumbnailPreview').innerHTML = '';
  }
  
  openModal('episodeModal');
}

// Function to delete episode
async function deleteEpisode(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus episode ini?')) return;
  
  try {
    const { error } = await supabase
      .from('episodes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    showToast('Episode berhasil dihapus', 'success');
    loadEpisodeData();
    loadDashboardStats();
    
  } catch (error) {
    console.error('Error deleting episode:', error);
    showToast('Gagal menghapus episode', 'error');
  }
}

// Function to load users data
async function loadUsersData() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '';
    
    if (data && data.length > 0) {
      data.forEach(item => {
        // Format the created date
        const createdDate = new Date(item.created_at);
        const formattedCreated = createdDate.toLocaleString('id-ID', {
          year: 'numeric', month: 'short', day: 'numeric'
        });
        
        // Format the expiration date if exists
        let formattedExpiration = '-';
        if (item.expiration_date) {
          const expDate = new Date(item.expiration_date);
          formattedExpiration = expDate.toLocaleString('id-ID', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          });
        }
        
        // Create a badge for role
        const roleBadge = `<span class="user-role ${item.role}">${
          item.role === 'admin' ? 'Admin' : 
          item.role === 'vip' ? 'VIP' : 'Regular'
        }</span>`;
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.username || '-'}</td>
          <td>${item.email || '-'}</td>
          <td>${roleBadge}</td>
          <td>${item.role === 'vip' ? formattedExpiration : '-'}</td>
          <td>${formattedCreated}</td>
          <td>
            <button class="action-button edit-button" data-id="${item.id}"><i class="fas fa-edit"></i></button>
          </td>
        `;
        
        tableBody.appendChild(row);
        
        // Add event listener for edit button
        const editBtn = row.querySelector('.edit-button');
        editBtn.addEventListener('click', function() {
          editUser(item);
        });
      });
    } else {
      tableBody.innerHTML = `<tr><td colspan="6" class="no-data">Tidak ada data pengguna</td></tr>`;
    }
    
  } catch (error) {
    console.error('Error loading users data:', error);
    showToast('Gagal memuat data pengguna', 'error');
  }
}

// Function to edit user
function editUser(user) {
  const form = document.getElementById('userForm');
  form.dataset.id = user.id;
  
  form.elements['userId'].value = user.id;
  form.elements['username'].value = user.username || '';
  form.elements['email'].value = user.email || '';
  form.elements['userRole'].value = user.role || 'user';
  
  // Show/hide expiration date input based on role
  const expirationGroup = document.getElementById('expirationDateGroup');
  expirationGroup.style.display = user.role === 'vip' ? 'block' : 'none';
  
  // Setup date-time local input for expiration date
  const expirationInput = form.elements['expirationDate'];
  if (user.expiration_date) {
    // Convert UTC string to local datetime-local input format
    const date = new Date(user.expiration_date);
    const localDatetime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .slice(0, 16); // Format: "YYYY-MM-DDTHH:MM"
    
    expirationInput.value = localDatetime;
  } else {
    expirationInput.value = '';
  }
  
  // Add change event to userRole select
  const roleSelect = form.elements['userRole'];
  roleSelect.addEventListener('change', function() {
    expirationGroup.style.display = this.value === 'vip' ? 'block' : 'none';
  });
  
  openModal('userModal');
}

// Function to check and update expired VIP status
async function checkExpiredVip() {
  try {
    const { data, error } = await supabase.rpc('update_expired_vip_status');
    
    if (error) throw error;
    
    const updatedCount = data.updated_count || 0;
    
    if (updatedCount > 0) {
      showToast(`${updatedCount} akun VIP kedaluwarsa telah diperbarui`, 'success');
    } else {
      showToast('Tidak ada akun VIP yang kedaluwarsa', 'info');
    }
    
    // Reload user data and dashboard stats
    loadUsersData();
    loadDashboardStats();
    
  } catch (error) {
    console.error('Error checking expired VIP status:', error);
    showToast('Gagal memperbarui status VIP kedaluwarsa', 'error');
  }
}

// Function to set up form submissions
function setupFormSubmissions() {
  // Donghua form submission
  const donghuaForm = document.getElementById('donghuaForm');
  donghuaForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
      title: this.elements['title'].value,
      year: parseInt(this.elements['year'].value),
      genre: this.elements['genre'].value,
      status: this.elements['status'].value,
      rating: parseFloat(this.elements['rating'].value),
      synopsis: this.elements['synopsis'].value,
      poster_url: this.elements['posterUrl'].value || null,
      backdrop_url: this.elements['backdropUrl'].value || null
    };
    
    try {
      let response;
      
      if (this.dataset.id) {
        // Update existing donghua
        response = await supabase
          .from('donghua')
          .update(formData)
          .eq('id', this.dataset.id);
      } else {
        // Insert new donghua
        response = await supabase
          .from('donghua')
          .insert([formData]);
      }
      
      if (response.error) throw response.error;
      
      showToast(`Donghua berhasil ${this.dataset.id ? 'diperbarui' : 'ditambahkan'}`, 'success');
      closeModal('donghuaModal');
      loadDonghuaData();
      loadDashboardStats();
      
    } catch (error) {
      console.error('Error saving donghua:', error);
      showToast(`Gagal ${this.dataset.id ? 'memperbarui' : 'menambahkan'} donghua`, 'error');
    }
  });
  
  // Episode form submission
  const episodeForm = document.getElementById('episodeForm');
  episodeForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
      donghua_id: parseInt(this.elements['donghuaSelect'].value),
      episode_number: parseInt(this.elements['episodeNumber'].value),
      title: this.elements['episodeTitle'].value,
      description: this.elements['episodeDescription'].value || null,
      duration: parseInt(this.elements['episodeDuration'].value) || null,
      is_vip: this.elements['isVip'].value === 'true',
      thumbnail_url: this.elements['thumbnailUrl'].value || null,
      video_url: this.elements['videoUrl'].value || null,
      release_date: this.elements['releaseDate'].value
    };
    
    try {
      let response;
      
      if (this.dataset.id) {
        // Update existing episode
        response = await supabase
          .from('episodes')
          .update(formData)
          .eq('id', this.dataset.id);
      } else {
        // Insert new episode
        // Generate a UUID for the new episode
        const uuid = generateUUID();
        response = await supabase
          .from('episodes')
          .insert([{ ...formData, id: uuid }]);
      }
      
      if (response.error) throw response.error;
      
      showToast(`Episode berhasil ${this.dataset.id ? 'diperbarui' : 'ditambahkan'}`, 'success');
      closeModal('episodeModal');
      loadEpisodeData();
      loadDashboardStats();
      
    } catch (error) {
      console.error('Error saving episode:', error);
      showToast(`Gagal ${this.dataset.id ? 'memperbarui' : 'menambahkan'} episode`, 'error');
    }
  });
  
  // User form submission
  const userForm = document.getElementById('userForm');
  userForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const userId = this.elements['userId'].value;
    const role = this.elements['userRole'].value;
    const isVip = role === 'vip';
    
    try {
      // Prepare update data
      const updateData = {
        role: role
      };
      
      // Add expiration_date if VIP and a date is provided
      if (isVip && this.elements['expirationDate'].value) {
        // Convert local datetime-local input to UTC
        const localDate = new Date(this.elements['expirationDate'].value);
        // We don't need to adjust for timezone offset because Supabase will store it as UTC
        updateData.expiration_date = localDate.toISOString();
        console.log("Setting expiration date:", updateData.expiration_date);
      } else if (isVip) {
        // If VIP but no date, set expiration_date to null (no expiration)
        updateData.expiration_date = null;
        console.log("Setting unlimited VIP (no expiration date)");
      } else {
        // If not VIP, clear expiration_date
        updateData.expiration_date = null;
        console.log("Clearing expiration date because not VIP");
      }
      
      // Update user profile
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
      
      if (error) throw error;
      
      showToast('Pengguna berhasil diperbarui', 'success');
      closeModal('userModal');
      loadUsersData();
      loadDashboardStats();
      
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Gagal memperbarui pengguna', 'error');
    }
  });
}

// Function to set up modal close buttons
function setupModalCloseButtons() {
  document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      modal.style.display = 'none';
    });
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    document.querySelectorAll('.modal').forEach(modal => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

// Function to set up image preview functionality
function setupImagePreviewFunctions() {
  // Poster URL preview
  document.getElementById('posterUrl').addEventListener('input', function() {
    if (this.value) {
      document.getElementById('posterPreview').innerHTML = `<img src="${this.value}" alt="Poster Preview" onerror="this.src='/images/placeholder.jpg'">`;
    } else {
      document.getElementById('posterPreview').innerHTML = '';
    }
  });
  
  // Backdrop URL preview
  document.getElementById('backdropUrl').addEventListener('input', function() {
    if (this.value) {
      document.getElementById('backdropPreview').innerHTML = `<img src="${this.value}" alt="Backdrop Preview" onerror="this.src='/images/placeholder.jpg'">`;
    } else {
      document.getElementById('backdropPreview').innerHTML = '';
    }
  });
  
  // Thumbnail URL preview
  document.getElementById('thumbnailUrl').addEventListener('input', function() {
    if (this.value) {
      document.getElementById('thumbnailPreview').innerHTML = `<img src="${this.value}" alt="Thumbnail Preview" onerror="this.src='/images/placeholder.jpg'">`;
    } else {
      document.getElementById('thumbnailPreview').innerHTML = '';
    }
  });
}

// Helper function to generate UUID for episodes
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Function to show toast message
function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toastContainer');
  
  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Function to open modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = 'block';
}

// Function to close modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = 'none';
}
