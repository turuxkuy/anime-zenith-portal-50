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

// Function to set up sidebar toggle
function setupSidebar() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('active');
    });
  }
}

// Function to change page content
function changePage(pageId) {
  const pages = document.querySelectorAll('.admin-page');
  pages.forEach(page => {
    page.style.display = 'none';
  });
  
  const selectedPage = document.getElementById(pageId);
  if (selectedPage) {
    selectedPage.style.display = 'block';
  }
}

// Function to load dashboard statistics
async function loadDashboardStats() {
  try {
    // Fetch total number of donghua
    const { count: donghuaCount, error: donghuaError } = await supabase
      .from('donghua')
      .select('*', { count: 'exact', head: true });
    
    if (donghuaError) throw donghuaError;
    
    // Fetch total number of episodes
    const { count: episodeCount, error: episodeError } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true });
    
    if (episodeError) throw episodeError;
    
    // Fetch total number of users
    const { count: userCount, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (userError) throw userError;
    
    // Fetch total number of VIP users
    const { count: vipCount, error: vipError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'vip');
    
    if (vipError) throw vipError;
    
    // Update the DOM with the statistics
    document.getElementById('totalDonghua').textContent = donghuaCount || '0';
    document.getElementById('totalEpisodes').textContent = episodeCount || '0';
    document.getElementById('totalUsers').textContent = userCount || '0';
    document.getElementById('totalVIPs').textContent = vipCount || '0';
    
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    showToast('Gagal memuat statistik dashboard', 'error');
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
          <td>${item.title || '-'}</td>
          <td>${item.year || '-'}</td>
          <td>${item.genre || '-'}</td>
          <td>${item.rating || '-'}</td>
          <td>${item.status || '-'}</td>
          <td>
            <button class="action-button edit-button" data-id="${item.id}"><i class="fas fa-edit"></i></button>
            <button class="action-button delete-button" data-id="${item.id}"><i class="fas fa-trash"></i></button>
          </td>
        `;
        
        tableBody.appendChild(row);
        
        // Add event listeners for edit and delete buttons
        const editBtn = row.querySelector('.edit-button');
        editBtn.addEventListener('click', function() {
          editDonghua(item);
        });
        
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
  console.log("Editing donghua:", donghua);
  
  const form = document.getElementById('donghuaForm');
  form.dataset.id = donghua.id;
  
  form.elements['title'].value = donghua.title || '';
  form.elements['year'].value = donghua.year || '';
  form.elements['genre'].value = donghua.genre || '';
  form.elements['rating'].value = donghua.rating || '';
  form.elements['status'].value = donghua.status || '';
  form.elements['synopsis'].value = donghua.synopsis || '';
  
  // Set poster and backdrop URLs
  const posterPreview = document.getElementById('posterPreview');
  const backdropPreview = document.getElementById('backdropPreview');
  
  posterPreview.innerHTML = donghua.poster_url ? `<img src="${donghua.poster_url}" alt="Poster" style="max-width: 100px;">` : '';
  backdropPreview.innerHTML = donghua.backdrop_url ? `<img src="${donghua.backdrop_url}" alt="Backdrop" style="max-width: 100px;">` : '';
  
  document.getElementById('donghuaModalTitle').textContent = 'Edit Donghua';
  openModal('donghuaModal');
}

// Function to delete donghua
async function deleteDonghua(id) {
  if (confirm('Apakah Anda yakin ingin menghapus donghua ini?')) {
    try {
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
}

// Function to load episode data
async function loadEpisodeData() {
  try {
    const { data, error } = await supabase
      .from('episodes')
      .select('*, donghua:donghua_id(title)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const tableBody = document.getElementById('episodeTableBody');
    tableBody.innerHTML = '';
    
    if (data && data.length > 0) {
      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.title || '-'}</td>
          <td>${item.episode_number || '-'}</td>
          <td>${item.donghua ? item.donghua.title : '-'}</td>
          <td>${item.release_date || '-'}</td>
          <td>
            <button class="action-button edit-button" data-id="${item.id}"><i class="fas fa-edit"></i></button>
            <button class="action-button delete-button" data-id="${item.id}"><i class="fas fa-trash"></i></button>
          </td>
        `;
        
        tableBody.appendChild(row);
        
        // Add event listeners for edit and delete buttons
        const editBtn = row.querySelector('.edit-button');
        editBtn.addEventListener('click', function() {
          editEpisode(item);
        });
        
        const deleteBtn = row.querySelector('.delete-button');
        deleteBtn.addEventListener('click', function() {
          deleteEpisode(item.id);
        });
      });
    } else {
      tableBody.innerHTML = `<tr><td colspan="5" class="no-data">Tidak ada data episode</td></tr>`;
    }
    
  } catch (error) {
    console.error('Error loading episode data:', error);
    showToast('Gagal memuat data episode', 'error');
  }
}

// Function to edit episode
async function editEpisode(episode) {
  console.log("Editing episode:", episode);
  
  const form = document.getElementById('episodeForm');
  form.dataset.id = episode.id;
  
  form.elements['title'].value = episode.title || '';
  form.elements['episode_number'].value = episode.episode_number || '';
  form.elements['release_date'].value = episode.release_date || '';
  form.elements['description'].value = episode.description || '';
  form.elements['duration'].value = episode.duration || '';
  form.elements['video_url'].value = episode.video_url || '';
  form.elements['is_vip'].checked = episode.is_vip || false;
  
  // Load donghua select options
  await loadDonghuaSelect(episode.donghua_id);
  
  // Set thumbnail URL
  const thumbnailPreview = document.getElementById('thumbnailPreview');
  thumbnailPreview.innerHTML = episode.thumbnail_url ? `<img src="${episode.thumbnail_url}" alt="Thumbnail" style="max-width: 100px;">` : '';
  
  document.getElementById('episodeModalTitle').textContent = 'Edit Episode';
  openModal('episodeModal');
}

// Function to delete episode
async function deleteEpisode(id) {
  if (confirm('Apakah Anda yakin ingin menghapus episode ini?')) {
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
  console.log("Editing user:", user);
  
  const form = document.getElementById('userForm');
  form.dataset.id = user.id;
  
  form.elements['userId'].value = user.id;
  form.elements['username'].value = user.username || '';
  form.elements['email'].value = user.email || '';
  form.elements['userRole'].value = user.role || 'user';
  
  // Show/hide expiration date input based on role
  const expirationGroup = document.getElementById('expirationDateGroup');
  expirationGroup.style.display = form.elements['userRole'].value === 'vip' ? 'block' : 'none';
  
  // Setup date-time local input for expiration date
  const expirationInput = form.elements['expirationDate'];
  if (user.expiration_date) {
    // Convert UTC string to local datetime-local input format
    const date = new Date(user.expiration_date);
    // Format date to YYYY-MM-DDTHH:MM format needed for datetime-local
    const localDatetime = date.toISOString().slice(0, 16);
    
    console.log("Original expiration date:", user.expiration_date);
    console.log("Setting expiration input to:", localDatetime);
    
    expirationInput.value = localDatetime;
  } else {
    expirationInput.value = '';
    console.log("No expiration date found");
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
    const now = new Date().toISOString();
    
    // Get all VIP users with expired dates
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'vip')
      .lt('expiration_date', now);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log(`Found ${data.length} expired VIP accounts`);
      
      // Update each expired user to regular role
      let updatedCount = 0;
      
      for (const user of data) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: 'user',
            expiration_date: null
          })
          .eq('id', user.id);
        
        if (!updateError) updatedCount++;
      }
      
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
    
    const id = this.dataset.id;
    const title = this.elements['title'].value;
    const year = this.elements['year'].value;
    const genre = this.elements['genre'].value;
    const rating = this.elements['rating'].value;
    const status = this.elements['status'].value;
    const synopsis = this.elements['synopsis'].value;
    
    // Handle image uploads
    const posterFile = this.elements['poster'].files[0];
    const backdropFile = this.elements['backdrop'].files[0];
    
    let poster_url = null;
    let backdrop_url = null;
    
    try {
      // Upload poster if a new file is selected
      if (posterFile) {
        const posterPath = `posters/${generateUUID()}-${posterFile.name}`;
        const { error: posterError } = await supabase.storage
          .from('images')
          .upload(posterPath, posterFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (posterError) throw posterError;
        
        poster_url = `${supabase.supabaseUrl}/storage/v1/object/public/images/${posterPath}`;
      }
      
      // Upload backdrop if a new file is selected
      if (backdropFile) {
        const backdropPath = `backdrops/${generateUUID()}-${backdropFile.name}`;
        const { error: backdropError } = await supabase.storage
          .from('images')
          .upload(backdropPath, backdropFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (backdropError) throw backdropError;
        
        backdrop_url = `${supabase.supabaseUrl}/storage/v1/object/public/images/${backdropPath}`;
      }
      
      // Prepare update or insert object
      const donghuaData = {
        title,
        year,
        genre,
        rating,
        status,
        synopsis,
        poster_url: poster_url || this.dataset.posterUrl || null,
        backdrop_url: backdrop_url || this.dataset.backdropUrl || null
      };
      
      // Perform update or insert
      let query;
      if (id) {
        query = supabase
          .from('donghua')
          .update(donghuaData)
          .eq('id', id);
      } else {
        query = supabase
          .from('donghua')
          .insert([donghuaData]);
      }
      
      const { error } = await query.select();
      if (error) throw error;
      
      showToast(`Donghua ${id ? 'berhasil diperbarui' : 'berhasil ditambahkan'}`, 'success');
      closeModal('donghuaModal');
      loadDonghuaData();
      loadEpisodeData();
      loadDashboardStats();
      
    } catch (error) {
      console.error('Error submitting donghua form:', error);
      showToast('Gagal menyimpan donghua: ' + error.message, 'error');
    }
  });
  
  // Episode form submission
  const episodeForm = document.getElementById('episodeForm');
  episodeForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = this.dataset.id;
    const title = this.elements['title'].value;
    const episode_number = this.elements['episode_number'].value;
    const donghua_id = this.elements['donghua_id'].value;
    const release_date = this.elements['release_date'].value;
    const description = this.elements['description'].value;
    const duration = this.elements['duration'].value;
    const video_url = this.elements['video_url'].value;
    const is_vip = this.elements['is_vip'].checked;
    
    // Handle thumbnail upload
    const thumbnailFile = this.elements['thumbnail'].files[0];
    let thumbnail_url = null;
    
    try {
      if (thumbnailFile) {
        const thumbnailPath = `thumbnails/${generateUUID()}-${thumbnailFile.name}`;
        const { error: thumbnailError } = await supabase.storage
          .from('images')
          .upload(thumbnailPath, thumbnailFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (thumbnailError) throw thumbnailError;
        
        thumbnail_url = `${supabase.supabaseUrl}/storage/v1/object/public/images/${thumbnailPath}`;
      }
      
      // Prepare update or insert object
      const episodeData = {
        title,
        episode_number,
        donghua_id,
        release_date,
        description,
        duration,
        video_url,
        is_vip,
        thumbnail_url: thumbnail_url || this.dataset.thumbnailUrl || null
      };
      
      // Perform update or insert
      let query;
      if (id) {
        query = supabase
          .from('episodes')
          .update(episodeData)
          .eq('id', id);
      } else {
        episodeData.id = generateUUID();
        query = supabase
          .from('episodes')
          .insert([episodeData]);
      }
      
      const { error } = await query.select();
      if (error) throw error;
      
      showToast(`Episode ${id ? 'berhasil diperbarui' : 'berhasil ditambahkan'}`, 'success');
      closeModal('episodeModal');
      loadEpisodeData();
      loadDashboardStats();
      
    } catch (error) {
      console.error('Error submitting episode form:', error);
      showToast('Gagal menyimpan episode: ' + error.message, 'error');
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
      // Get admin session
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) {
        throw new Error('Admin not authenticated');
      }
      
      // First update the user role
      await updateUserRole(userId, role, adminUser.id);
      
      // Then update the expiration date if needed
      let expirationDate = null;
      if (isVip && this.elements['expirationDate'].value) {
        // Get the date from input and convert to ISO
        const localDate = new Date(this.elements['expirationDate'].value);
        expirationDate = localDate.toISOString();
        console.log("Setting expiration date:", expirationDate);
      }
      
      // Update expiration date separately
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ expiration_date: expirationDate })
        .eq('id', userId);
      
      if (updateError) {
        console.error("Error updating expiration date:", updateError);
        showToast('Status pengguna diperbarui, namun gagal memperbarui masa aktif VIP', 'warning');
      } else {
        showToast('Pengguna berhasil diperbarui', 'success');
      }
      
      closeModal('userModal');
      loadUsersData();
      loadDashboardStats();
      
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Gagal memperbarui pengguna: ' + (error.message || ''), 'error');
    }
  });
}

// Function to load donghua options into select element
async function loadDonghuaSelect(selectedId = null) {
  try {
    const { data, error } = await supabase
      .from('donghua')
      .select('id, title')
      .order('title', { ascending: true });
    
    if (error) throw error;
    
    const selectElement = document.getElementById('donghua_id');
    selectElement.innerHTML = '';
    
    if (data && data.length > 0) {
      data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.title;
        option.selected = selectedId === item.id;
        selectElement.appendChild(option);
      });
    } else {
      const option = document.createElement('option');
      option.textContent = 'Tidak ada donghua';
      selectElement.appendChild(option);
    }
    
  } catch (error) {
    console.error('Error loading donghua options:', error);
    showToast('Gagal memuat pilihan donghua', 'error');
  }
}

// Function to set up close modal buttons
function setupModalCloseButtons() {
  const closeModalButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
  closeModalButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });
}

// Function to set up image preview functionality
function setupImagePreviewFunctions() {
  // Poster preview
  const posterInput = document.getElementById('poster');
  if (posterInput) {
    posterInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          document.getElementById('posterPreview').innerHTML = `<img src="${e.target.result}" alt="Poster" style="max-width: 100px;">`;
        }
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Backdrop preview
  const backdropInput = document.getElementById('backdrop');
  if (backdropInput) {
    backdropInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          document.getElementById('backdropPreview').innerHTML = `<img src="${e.target.result}" alt="Backdrop" style="max-width: 100px;">`;
        }
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Thumbnail preview
  const thumbnailInput = document.getElementById('thumbnail');
  if (thumbnailInput) {
    thumbnailInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          document.getElementById('thumbnailPreview').innerHTML = `<img src="${e.target.result}" alt="Thumbnail" style="max-width: 100px;">`;
        }
        reader.readAsDataURL(file);
      }
    });
  }
}

// Function to generate a unique ID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Function to show a toast message
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
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

// Function to open a modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
  }
}

// Function to close a modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Function to check if user is admin
async function checkAdminAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || !profile) {
      return false;
    }
    
    return profile.role === 'admin';
  } catch (error) {
    console.error('Error checking admin auth:', error);
    return false;
  }
}

// Function to logout user
async function logoutUser() {
  try {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error logging out:', error);
    showToast('Gagal keluar', 'error');
  }
}
