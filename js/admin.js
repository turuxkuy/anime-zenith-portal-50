document.addEventListener('DOMContentLoaded', function() {
  console.log("Admin.js loaded");
  
  // Check if Supabase is available
  if (typeof window.supabase === 'undefined') {
    console.error("Supabase is not defined in admin.js - this is a critical error!");
    
    // Display error message to user
    const adminContainer = document.querySelector('.admin-container');
    if (adminContainer) {
      adminContainer.innerHTML = `
        <div style="padding: 2rem; color: white; text-align: center;">
          <h2>Error: Database Connection Failed</h2>
          <p>Could not connect to the database. Please try refreshing the page or contact support.</p>
        </div>
      `;
    }
    
    return; // Stop execution
  }
  
  // Check admin authentication status
  checkAdminAuth()
    .then(isAdmin => {
      if (!isAdmin) {
        // Redirect to login page if not admin
        window.location.href = 'login-admin.html';
        return;
      }

      // Initialize admin panel functionality
      initializeAdminPanel();
    })
    .catch(error => {
      console.error('Authentication check failed:', error);
      // Handle authentication error, e.g., redirect to an error page
      document.body.innerHTML = '<p>Authentication failed. Please try again later.</p>';
    });
});

function initializeAdminPanel() {
  // Sidebar toggle functionality
  const menuToggle = document.getElementById('menuToggle');
  const adminSidebar = document.getElementById('adminSidebar');
  const closeSidebar = document.getElementById('closeSidebar');

  if (menuToggle && adminSidebar && closeSidebar) {
    menuToggle.addEventListener('click', () => {
      adminSidebar.classList.add('active');
    });

    closeSidebar.addEventListener('click', () => {
      adminSidebar.classList.remove('active');
    });
  }

  // Logout functionality
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Navigation functionality
  const adminMenuItems = document.querySelectorAll('.admin-menu-item');
  adminMenuItems.forEach(item => {
    item.addEventListener('click', navigate);
  });

  // Load initial data
  loadDashboardData();
  loadDonghuaList();
  loadEpisodeList();
  loadUsersList();

  // Donghua modal functionality
  const addDonghuaBtn = document.getElementById('addDonghuaBtn');
  if (addDonghuaBtn) {
    addDonghuaBtn.addEventListener('click', () => openModal('donghuaModal', 'add'));
  }

  // Episode modal functionality
  const addEpisodeBtn = document.getElementById('addEpisodeBtn');
  if (addEpisodeBtn) {
    addEpisodeBtn.addEventListener('click', () => openModal('episodeModal', 'add'));
  }

  // Sync buttons functionality
  const syncDonghuaBtn = document.getElementById('syncDonghuaBtn');
  if (syncDonghuaBtn) {
    syncDonghuaBtn.addEventListener('click', loadDonghuaList);
  }

  const syncEpisodeBtn = document.getElementById('syncEpisodeBtn');
  if (syncEpisodeBtn) {
    syncEpisodeBtn.addEventListener('click', loadEpisodeList);
  }

  const syncUsersBtn = document.getElementById('syncUsersBtn');
  if (syncUsersBtn) {
    syncUsersBtn.addEventListener('click', loadUsersList);
  }

  // Form submission handling
  const donghuaForm = document.getElementById('donghuaForm');
  if (donghuaForm) {
    donghuaForm.addEventListener('submit', handleDonghuaSubmit);
  }

  const episodeForm = document.getElementById('episodeForm');
  if (episodeForm) {
    episodeForm.addEventListener('submit', handleEpisodeSubmit);
  }

  const userForm = document.getElementById('userForm');
  if (userForm) {
    userForm.addEventListener('submit', handleUserSubmit);
  }

  // Image preview functionality
  const posterUrlInput = document.getElementById('posterUrl');
  if (posterUrlInput) {
    posterUrlInput.addEventListener('input', () => previewImage('posterUrl', 'posterPreview'));
  }

  const backdropUrlInput = document.getElementById('backdropUrl');
  if (backdropUrlInput) {
    backdropUrlInput.addEventListener('input', () => previewImage('backdropUrl', 'backdropPreview'));
  }

  const thumbnailUrlInput = document.getElementById('thumbnailUrl');
  if (thumbnailUrlInput) {
    thumbnailUrlInput.addEventListener('input', () => previewImage('thumbnailUrl', 'thumbnailPreview'));
  }

  // Load donghua options for episode form
  loadDonghuaOptions();
}

// Function to logout
async function logout() {
  try {
    const { error } = await window.supabase.auth.signOut();
    if (error) throw error;
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout failed:', error);
    showToast('Logout failed. Please try again later.', 'error');
  }
}

// Function to navigate between admin pages
function navigate(event) {
  const page = event.target.closest('.admin-menu-item').dataset.page;
  const adminPages = document.querySelectorAll('.admin-page');
  const adminMenuItems = document.querySelectorAll('.admin-menu-item');
  const pageTitle = document.getElementById('pageTitle');

  adminPages.forEach(p => p.classList.remove('active'));
  adminMenuItems.forEach(item => item.classList.remove('active'));

  document.getElementById(page).classList.add('active');
  event.target.closest('.admin-menu-item').classList.add('active');
  pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);

  // Load data based on the selected page
  switch (page) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'donghua':
      loadDonghuaList();
      break;
    case 'episode':
      loadEpisodeList();
      break;
    case 'users':
      loadUsersList();
      break;
  }
}

// Function to load dashboard data
async function loadDashboardData() {
  try {
    const { count: totalDonghua } = await window.supabase
      .from('donghua')
      .select('*', { count: 'exact', head: true });

    const { count: totalEpisodes } = await window.supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true });

    const { count: totalUsers } = await window.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: vipUsers } = await window.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'vip');

    document.getElementById('totalDonghua').textContent = totalDonghua || 0;
    document.getElementById('totalEpisodes').textContent = totalEpisodes || 0;
    document.getElementById('totalUsers').textContent = totalUsers || 0;
    document.getElementById('vipUsers').textContent = vipUsers || 0;
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showToast('Failed to load dashboard data.', 'error');
  }
}

// Function to load donghua list
async function loadDonghuaList() {
  const donghuaTableBody = document.getElementById('donghuaTableBody');
  if (!donghuaTableBody) return;

  try {
    const { data: donghuaData, error } = await window.supabase
      .from('donghua')
      .select('*')
      .order('title', { ascending: true });

    if (error) throw error;

    donghuaTableBody.innerHTML = '';
    donghuaData.forEach(donghua => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><img src="${donghua.poster_url || 'images/default-poster.jpg'}" alt="${donghua.title}" width="50"></td>
        <td>${donghua.title}</td>
        <td>${donghua.year}</td>
        <td>${donghua.genre}</td>
        <td>${donghua.status}</td>
        <td>
          <button class="edit-button" data-id="${donghua.id}" onclick="openModal('donghuaModal', 'edit', '${donghua.id}')"><i class="fas fa-edit"></i></button>
          <button class="delete-button" data-id="${donghua.id}" onclick="deleteDonghua('${donghua.id}')"><i class="fas fa-trash-alt"></i></button>
        </td>
      `;
      donghuaTableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading donghua list:', error);
    showToast('Failed to load donghua list.', 'error');
  }
}

// Function to load episode list
async function loadEpisodeList() {
  const episodeTableBody = document.getElementById('episodeTableBody');
  if (!episodeTableBody) return;

  try {
    const { data: episodes, error } = await window.supabase
      .from('episodes')
      .select('*, donghua(title)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading episodes:', error);
      throw error;
    }

    console.log('Episodes loaded:', episodes);
    
    episodeTableBody.innerHTML = '';
    
    if (episodes && episodes.length > 0) {
      episodes.forEach(episode => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><div class="table-thumbnail"><img src="${episode.thumbnail_url || 'images/default-thumbnail.jpg'}" alt="${episode.title}" width="50"></div></td>
          <td>${episode.donghua?.title || 'Unknown'}</td>
          <td>${episode.episode_number}</td>
          <td>${episode.title}</td>
          <td><span class="status-badge ${episode.is_vip ? 'status-vip' : 'status-free'}">${episode.is_vip ? 'VIP' : 'Umum'}</span></td>
          <td>
            <div class="table-actions">
              <button class="edit-btn" onclick="openModal('episodeModal', 'edit', '${episode.id}')"><i class="fas fa-edit"></i></button>
              <button class="delete-btn" onclick="deleteEpisode('${episode.id}')"><i class="fas fa-trash-alt"></i></button>
            </div>
          </td>
        `;
        episodeTableBody.appendChild(row);
      });
    } else {
      episodeTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Tidak ada episode yang tersedia</td></tr>`;
    }
  } catch (error) {
    console.error('Error loading episode list:', error);
    showToast('Failed to load episode list.', 'error');
  }
}

// Function to load users list
async function loadUsersList() {
  const usersTableBody = document.getElementById('usersTableBody');
  if (!usersTableBody) return;

  try {
    console.log('Loading users list...');
    
    const { data: users, error } = await window.supabase
      .from('profiles')
      .select('id, username, email, role, created_at, expiration_date')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      throw error;
    }

    console.log(`Loaded ${users.length} users`);
    
    usersTableBody.innerHTML = '';
    
    if (users && users.length > 0) {
      users.forEach(user => {
        const row = document.createElement('tr');
        
        // Format role as a badge with color
        const roleBadgeClass = 
          user.role === 'admin' ? 'status-admin' : 
          user.role === 'vip' ? 'status-vip' : 
          'status-regular';
        
        // Format expiration date if it exists
        let expirationText = '-';
        if (user.expiration_date) {
          const expDate = new Date(user.expiration_date);
          const now = new Date();
          
          if (expDate < now && user.role === 'vip') {
            expirationText = '<span class="expired-date">Kedaluwarsa</span>';
          } else {
            expirationText = new Date(user.expiration_date).toLocaleString('id-ID', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });
          }
        }
        
        row.innerHTML = `
          <td>${user.username || 'N/A'}</td>
          <td>${user.email || 'N/A'}</td>
          <td><span class="status-badge ${roleBadgeClass}">${user.role || 'user'}</span></td>
          <td>${user.role === 'vip' ? expirationText : '-'}</td>
          <td>${new Date(user.created_at).toLocaleDateString('id-ID')}</td>
          <td>
            <button class="edit-button" onclick="openModal('userModal', 'edit', '${user.id}')"><i class="fas fa-edit"></i></button>
          </td>
        `;
        usersTableBody.appendChild(row);
      });
    } else {
      usersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No users found</td></tr>`;
    }

    // Add event listener to check expired VIP button
    const checkExpiredBtn = document.getElementById('checkExpiredBtn');
    if (checkExpiredBtn) {
      checkExpiredBtn.addEventListener('click', checkExpiredVipUsers);
    }
  } catch (error) {
    console.error('Error loading users list:', error);
    showToast('Failed to load users list: ' + error.message, 'error');
  }
}

// Function to check and update expired VIP users
async function checkExpiredVipUsers() {
  try {
    showToast('Memeriksa VIP yang kedaluwarsa...', 'info');
    
    // Call the server function to check and update expired VIP users
    const { data, error } = await window.supabase.rpc('update_expired_vip_status');
    
    if (error) {
      console.error('Error checking expired VIP users:', error);
      showToast('Gagal memeriksa VIP kedaluwarsa: ' + error.message, 'error');
      return;
    }
    
    const updatedCount = data?.updated_count || 0;
    console.log('Updated expired VIP users:', data);
    
    // Reload users list
    await loadUsersList();
    
    if (updatedCount > 0) {
      showToast(`${updatedCount} pengguna VIP telah kedaluwarsa dan diubah ke regular`, 'success');
    } else {
      showToast('Tidak ada pengguna VIP yang kedaluwarsa', 'info');
    }
  } catch (error) {
    console.error('Error checking expired VIP users:', error);
    showToast('Gagal memeriksa VIP kedaluwarsa: ' + error.message, 'error');
  }
}

// Function to open modal - Make it global so it can be called from inline onclick
window.openModal = async function(modalId, action, itemId = null) {
  const modal = document.getElementById(modalId);
  const overlay = document.getElementById('overlay');
  const modalTitle = document.getElementById(`${modalId}Title`) || document.querySelector(`#${modalId} h2`);

  if (modalId === 'donghuaModal') {
    const form = document.getElementById('donghuaForm');
    if (action === 'add') {
      if (modalTitle) modalTitle.textContent = 'Tambah Donghua';
      form.reset();
      form.removeAttribute('data-id');
    } else if (action === 'edit' && itemId) {
      if (modalTitle) modalTitle.textContent = 'Edit Donghua';
      form.setAttribute('data-id', itemId);
      await populateDonghuaForm(itemId);
    }
  } else if (modalId === 'episodeModal') {
    const form = document.getElementById('episodeForm');
    if (action === 'add') {
      if (modalTitle) modalTitle.textContent = 'Tambah Episode';
      form.reset();
      form.removeAttribute('data-id');
      // Set default release date to today
      const today = new Date().toISOString().split('T')[0];
      form.querySelector('#releaseDate').value = today;
    } else if (action === 'edit' && itemId) {
      if (modalTitle) modalTitle.textContent = 'Edit Episode';
      form.setAttribute('data-id', itemId);
      await populateEpisodeForm(itemId);
    }
  } else if (modalId === 'userModal') {
    const form = document.getElementById('userForm');
    if (action === 'edit' && itemId) {
      if (modalTitle) modalTitle.textContent = 'Edit Pengguna';
      form.setAttribute('data-id', itemId);
      await populateUserForm(itemId);
    }
  }

  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';

  const closeModalBtn = modal.querySelector('.close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => closeModal(modalId));
  }
  
  // Also close when clicking outside modal
  if (overlay) {
    overlay.addEventListener('click', () => closeModal(modalId));
  }
};

// Function to close modal - Make it global
window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  const overlay = document.getElementById('overlay');
  if (modal) modal.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
};

// Function to populate donghua form for editing
async function populateDonghuaForm(donghuaId) {
  try {
    const { data: donghua, error } = await window.supabase
      .from('donghua')
      .select('*')
      .eq('id', donghuaId)
      .single();

    if (error) throw error;

    const form = document.getElementById('donghuaForm');
    form.querySelector('#title').value = donghua.title;
    form.querySelector('#year').value = donghua.year;
    form.querySelector('#genre').value = donghua.genre;
    form.querySelector('#status').value = donghua.status;
    form.querySelector('#rating').value = donghua.rating;
    form.querySelector('#synopsis').value = donghua.synopsis;
    form.querySelector('#posterUrl').value = donghua.poster_url;
    form.querySelector('#backdropUrl').value = donghua.backdrop_url;

    // Trigger image preview
    previewImage('posterUrl', 'posterPreview');
    previewImage('backdropUrl', 'backdropPreview');
  } catch (error) {
    console.error('Error populating donghua form:', error);
    showToast('Failed to populate donghua form.', 'error');
  }
}

// Function to populate episode form for editing
async function populateEpisodeForm(episodeId) {
  try {
    console.log('Populating episode form for ID:', episodeId);
    
    const { data: episode, error } = await window.supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single();

    if (error) {
      console.error('Error fetching episode:', error);
      throw error;
    }

    console.log('Episode data for editing:', episode);

    const form = document.getElementById('episodeForm');
    form.querySelector('#donghuaSelect').value = episode.donghua_id;
    form.querySelector('#episodeNumber').value = episode.episode_number;
    form.querySelector('#episodeTitle').value = episode.title;
    form.querySelector('#episodeDescription').value = episode.description || '';
    form.querySelector('#episodeDuration').value = episode.duration || '';
    form.querySelector('#isVip').value = episode.is_vip ? 'true' : 'false';
    form.querySelector('#thumbnailUrl').value = episode.thumbnail_url || '';
    form.querySelector('#videoUrl').value = episode.video_url || '';
    
    // Format the release date for the input (YYYY-MM-DD)
    if (episode.release_date) {
      const releaseDate = new Date(episode.release_date).toISOString().split('T')[0];
      form.querySelector('#releaseDate').value = releaseDate;
    }

    // Trigger image preview
    previewImage('thumbnailUrl', 'thumbnailPreview');
  } catch (error) {
    console.error('Error populating episode form:', error);
    showToast('Failed to populate episode form.', 'error');
  }
}

// Function to populate user form for editing
async function populateUserForm(userId) {
  try {
    console.log('Populating user form for ID:', userId);
    
    // Clear previous form data first
    const form = document.getElementById('userForm');
    form.reset();
    
    // Fetch user data with explicit error handling
    const { data: user, error } = await window.supabase
      .from('profiles')
      .select('id, username, email, role, expiration_date')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      showToast(`Error fetching user data: ${error.message}`, 'error');
      throw error;
    }

    if (!user) {
      console.error('No user found with ID:', userId);
      showToast('User not found', 'error');
      return;
    }

    console.log('User data retrieved:', user);
    
    // Set form values
    form.querySelector('#userId').value = user.id;
    form.querySelector('#username').value = user.username || '';
    form.querySelector('#email').value = user.email || '';
    
    // Setup role dropdown
    const roleSelect = form.querySelector('#userRole');
    if (roleSelect) {
      roleSelect.value = user.role || 'user';
      
      // Show/hide expiration date field based on role
      const expirationDateGroup = document.getElementById('expirationDateGroup');
      if (expirationDateGroup) {
        expirationDateGroup.style.display = roleSelect.value === 'vip' ? 'block' : 'none';
        
        // Add event listener to role select to show/hide expiration date field
        roleSelect.addEventListener('change', function() {
          expirationDateGroup.style.display = this.value === 'vip' ? 'block' : 'none';
        });
      }
    }
    
    // Format and set expiration date if available
    const expirationDateInput = form.querySelector('#expirationDate');
    if (expirationDateInput && user.expiration_date) {
      try {
        // Create a Date object from the timestamp
        const date = new Date(user.expiration_date);
        
        // Format the date for datetime-local input (YYYY-MM-DDThh:mm)
        // Need to adjust for timezone to display in local time
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
        console.log('Setting expiration date input value:', formattedDate);
        expirationDateInput.value = formattedDate;
      } catch (dateError) {
        console.error('Error formatting date:', dateError);
        expirationDateInput.value = '';
      }
    } else if (expirationDateInput) {
      expirationDateInput.value = '';
    }
  } catch (error) {
    console.error('Error populating user form:', error);
    showToast('Failed to populate user form.', 'error');
  }
}

// Handle form submission for donghua
async function handleDonghuaSubmit(event) {
  event.preventDefault();
  
  try {
    const form = event.target;
    const title = form.querySelector('#title').value;
    const year = parseInt(form.querySelector('#year').value);
    const genre = form.querySelector('#genre').value;
    const status = form.querySelector('#status').value;
    const rating = parseFloat(form.querySelector('#rating').value);
    const synopsis = form.querySelector('#synopsis').value;
    const poster_url = form.querySelector('#posterUrl').value;
    const backdrop_url = form.querySelector('#backdropUrl').value;
    
    // Validate form fields
    if (!title || !year || !genre || !status || !rating || !synopsis || !poster_url || !backdrop_url) {
      showToast('Semua kolom harus diisi!', 'error');
      return;
    }
    
    // Create donghua object
    const donghua = {
      title,
      year,
      genre,
      status,
      rating,
      synopsis,
      poster_url,
      backdrop_url
    };
    
    if (!window.supabase) {
      console.error('Supabase client is not initialized!');
      showToast('Koneksi database gagal!', 'error');
      throw new Error('Database connection failed');
    }
    
    console.log('Attempting to save donghua to Supabase:', donghua);
    
    // Check if editing existing donghua
    const editId = form.getAttribute('data-id');
    
    // Use anonymous auth for simplified testing
    // This ensures at least the RLS allows operations
    console.log('Using anonymous auth for form submission');
    
    if (editId) {
      // Update existing donghua
      console.log('Updating donghua with ID:', editId);
      const { data, error } = await window.supabase
        .from('donghua')
        .update(donghua)
        .eq('id', editId)
        .select();
        
      if (error) {
        console.error('Supabase update error:', error);
        showToast(`Error: ${error.message}`, 'error');
        throw error;
      }
      
      console.log('Update result:', data);
      
      showToast('Donghua berhasil diperbarui!', 'success');
      closeModal('donghuaModal');
      loadDonghuaList();
    } else {
      // Insert new donghua
      console.log('Inserting new donghua');
      const { data, error } = await window.supabase
        .from('donghua')
        .insert(donghua)
        .select();
        
      if (error) {
        console.error('Supabase insert error:', error);
        showToast(`Error: ${error.message}`, 'error');
        throw error;
      }
      
      console.log('Insert result:', data);
      
      showToast('Donghua baru berhasil ditambahkan!', 'success');
      closeModal('donghuaModal');
      loadDonghuaList();
    }
  } catch (error) {
    console.error('Error handling donghua form:', error);
    showToast(`Terjadi kesalahan: ${error.message}`, 'error');
  }
}

// Handle form submission for episode
async function handleEpisodeSubmit(event) {
  event.preventDefault();
  console.log("Episode form submission started");

  try {
    const form = event.target;
    const donghua_id = form.querySelector('#donghuaSelect').value;
    const episode_number = parseInt(form.querySelector('#episodeNumber').value);
    const title = form.querySelector('#episodeTitle').value;
    const description = form.querySelector('#episodeDescription').value;
    const duration = parseInt(form.querySelector('#episodeDuration').value) || null;
    const is_vip = form.querySelector('#isVip').value === 'true';
    const thumbnail_url = form.querySelector('#thumbnailUrl').value;
    const video_url = form.querySelector('#videoUrl').value;
    const release_date = form.querySelector('#releaseDate').value;

    // Validate form fields
    if (!donghua_id || !episode_number || !title || !thumbnail_url || !video_url || !release_date) {
      showToast('Semua kolom wajib diisi!', 'error');
      return;
    }

    console.log("Form data validated, preparing to send to database");

    // Get current auth session to verify logged in status
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      console.error("User is not logged in, cannot insert episode");
      showToast('Sesi login telah berakhir. Silahkan login kembali.', 'error');
      setTimeout(() => {
        window.location.href = 'login-admin.html';
      }, 2000);
      return;
    }
    
    console.log("User authentication verified, user ID:", session.user.id);

    // Check admin role with explicit query
    const { data: profileData, error: profileError } = await window.supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (profileError || !profileData || profileData.role !== 'admin') {
      console.error("User is not an admin, cannot insert episode");
      showToast('Anda tidak memiliki hak akses admin untuk menambahkan episode.', 'error');
      return;
    }

    // Create episode object with proper data types
    const episode = {
      donghua_id: parseInt(donghua_id), // Make sure this is an integer
      episode_number,
      title,
      description: description || null,
      duration: duration || null,
      is_vip,
      thumbnail_url,
      video_url,
      release_date,
      // Let the database handle timestamps
    };

    // Check if editing existing episode
    const editId = form.getAttribute('data-id');

    if (editId) {
      // Update existing episode
      console.log(`Updating episode with ID: ${editId}`);
      const { data, error } = await window.supabase
        .from('episodes')
        .update(episode)
        .eq('id', editId)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        showToast(`Gagal memperbarui episode: ${error.message}`, 'error');
        return;
      }

      console.log("Episode updated successfully:", data);
      showToast('Episode berhasil diperbarui!', 'success');
      
      // Close modal and refresh episode list
      closeModal('episodeModal');
      loadEpisodeList();
    } else {
      // For new episodes, generate UUID for id field
      episode.id = crypto.randomUUID();
      console.log("Generated UUID for episode:", episode.id);
      
      console.log("Final episode data being sent:", episode);
      
      // Insert new episode with explicit select() to see the response
      const { data, error } = await window.supabase
        .from('episodes')
        .insert(episode)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Error details:', error.details || 'No details');
        console.error('Error hint:', error.hint || 'No hint');
        
        showToast(`Gagal menyimpan episode: ${error.message}`, 'error');
        return;
      }

      console.log("Episode inserted successfully:", data);
      showToast('Episode baru berhasil ditambahkan!', 'success');
      
      // Close modal and refresh episode list
      closeModal('episodeModal');
      loadEpisodeList();
    }
  } catch (error) {
    console.error('Error handling episode form:', error);
    showToast(`Terjadi kesalahan: ${error.message}`, 'error');
  }
}

// Handle form submission for user
async function handleUserSubmit(event) {
  event.preventDefault();

  try {
    const form = event.target;
    const userId = form.querySelector('#userId').value;
    const userRole = form.querySelector('#userRole').value;
    const expirationDate = form.querySelector('#expirationDate').value;

    console.log('Updating user:', { userId, userRole, expirationDate });

    // Validate form fields
    if (!userId || !userRole) {
      showToast('User ID and role are required!', 'error');
      return;
    }

    // Get the current admin's session
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError || 'No active session');
      showToast('Session expired. Please login again.', 'error');
      setTimeout(() => {
        window.location.href = 'login-admin.html';
      }, 2000);
      return;
    }

    console.log('Current user session:', session.user.id);

    // Check if the current user has admin role with explicit query
    const { data: adminCheck, error: adminCheckError } = await window.supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (adminCheckError || !adminCheck || adminCheck.role !== 'admin') {
      console.error('Current user is not an admin:', adminCheckError || 'Not admin role');
      showToast('You do not have admin permissions to update user roles.', 'error');
      return;
    }

    // Show loading toast
    showToast('Updating user...', 'info');

    // Use the update_user_role function with correct parameter order
    const { data: updateRoleResult, error: updateRoleError } = await window.supabase
      .rpc('update_user_role', {
        user_id: userId,
        new_role: userRole
      });
    
    if (updateRoleError) {
      console.error('Error updating user role:', updateRoleError);
      showToast('Failed to update user role: ' + (updateRoleError.message || 'Unknown error'), 'error');
      return;
    }
    
    console.log('Role update result:', updateRoleResult);
    
    // Now handle the expiration date separately (if role is VIP)
    if (userRole === 'vip') {
      let updateData = {};
      
      if (expirationDate) {
        // Convert local datetime-local format to ISO string for proper timezone handling
        const localDate = new Date(expirationDate);
        
        // Add timezone offset to ensure correct UTC time
        updateData.expiration_date = localDate.toISOString();
        
        console.log('Setting expiration date:', updateData.expiration_date);
      } else {
        updateData.expiration_date = null; // No expiration
      }
      
      console.log('Update expiration data:', updateData);

      // Update the expiration date directly in the profiles table
      const { data, error } = await window.supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error('Error updating expiration date:', error);
        showToast(`Failed to update expiration date: ${error.message}`, 'error');
        return;
      }
      
      console.log('Expiration date updated successfully:', data);
    }
    
    showToast('User updated successfully!', 'success');
    closeModal('userModal');
    loadUsersList();

  } catch (error) {
    console.error('Error handling user form:', error);
    showToast(`An error occurred: ${error.message}`, 'error');
  }
}

// Function to delete donghua
window.deleteDonghua = async function(donghuaId) {
  if (confirm('Apakah Anda yakin ingin menghapus donghua ini?')) {
    try {
      const { error } = await window.supabase
        .from('donghua')
        .delete()
        .eq('id', donghuaId);

      if (error) throw error;

      showToast('Donghua berhasil dihapus!', 'success');
      loadDonghuaList();
    } catch (error) {
      console.error('Error deleting donghua:', error);
      showToast('Failed to delete donghua.', 'error');
    }
  }
};

// Function to delete episode
window.deleteEpisode = async function(episodeId) {
  if (confirm('Apakah Anda yakin ingin menghapus episode ini?')) {
    try {
      console.log('Deleting episode with ID:', episodeId);
      
      const { error } = await window.supabase
        .from('episodes')
        .delete()
        .eq('id', episodeId);

      if (error) {
        console.error('Error deleting episode:', error);
        throw error;
      }

      console.log('Episode successfully deleted');
      showToast('Episode berhasil dihapus!', 'success');
      loadEpisodeList();
    } catch (error) {
      console.error('Error deleting episode:', error);
      showToast('Failed to delete episode: ' + error.message, 'error');
    }
  }
};

// Function to load donghua options for episode form
async function loadDonghuaOptions() {
  const donghuaSelect = document.getElementById('donghuaSelect');
  if (!donghuaSelect) return;

  try {
    console.log("Loading donghua options for select dropdown");
    const { data: donghuaData, error } = await window.supabase
      .from('donghua')
      .select('id, title')
      .order('title', { ascending: true });

    if (error) {
      console.error("Error loading donghua options:", error);
      throw error;
    }

    console.log(`Loaded ${donghuaData?.length || 0} donghua options`);
    
    donghuaSelect.innerHTML = '<option value="">-- Pilih Donghua --</option>';
    
    if (donghuaData && donghuaData.length > 0) {
      donghuaData.forEach(donghua => {
        const option = document.createElement('option');
        option.value = donghua.id;
        option.textContent = donghua.title;
        donghuaSelect.appendChild(option);
      });
    } else {
      console.warn("No donghua data found for select dropdown");
      donghuaSelect.innerHTML += '<option value="" disabled>No donghua available</option>';
    }
  } catch (error) {
    console.error('Error loading donghua options:', error);
    showToast('Failed to load donghua options.', 'error');
  }
}

// Function to preview image
function previewImage(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);

  if (input && preview) {
    if (input.value) {
      preview.innerHTML = `<img src="${input.value}" alt="Preview">`;
    } else {
      preview.innerHTML = '';
    }
  }
}

// Function to show toast message
function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.classList.add('toast', type);
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
  
  toastContainer.appendChild(toast);
  
  // Show toast with animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Function to check if the user is admin
async function checkAdminAuth() {
  try {
    console.log('Checking admin auth...');
    
    if (!window.supabase) {
      console.error('Supabase client not available');
      return false;
    }
    
    const { data } = await window.supabase.auth.getSession();
    console.log('Auth session data:', data);
    
    if (!data.session) {
      console.log('No session found, redirecting to login');
      return false;
    }
    
    console.log('User ID from session:', data.session.user.id);
    
    // Get user role from profiles table
    const { data: profileData, error } = await window.supabase
      .from('profiles')
      .select('role')
      .eq('id', data.session.user.id)
      .single();
      
    console.log('Profile data:', profileData);
    console.log('Profile error:', error);
    
    if (error || !profileData) {
      console.error('Error fetching user role or profile not found:', error);
      return false;
    }
    
    console.log('User role:', profileData.role);
    
    // Check if user has admin role
    const isAdmin = profileData.role === 'admin';
    console.log('Is admin?', isAdmin);
    
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin auth:', error);
    return false;
  }
}

// Function to check if the user is logged in
async function checkLoginStatus() {
  try {
    const { data } = await window.supabase.auth.getSession();
    console.log('Auth session data:', data);
    
    if (!data.session) {
      console.log('No session found');
      return false;
    }
    
    console.log('User ID from session:', data.session.user.id);
    
    return true;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
}
