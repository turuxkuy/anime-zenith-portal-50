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
  loadVipList();

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

  const extendVipForm = document.getElementById('extendVipForm');
  if (extendVipForm) {
    extendVipForm.addEventListener('submit', handleExtendVipSubmit);
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
        
        // Add expiration info to the status badge if user is VIP
        let statusText = user.role || 'user';
        if (user.role === 'vip' && user.expiration_date) {
          const expirationDate = new Date(user.expiration_date);
          const today = new Date();
          const daysRemaining = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining > 0) {
            statusText = `VIP (${daysRemaining} days left)`;
          } else {
            statusText = `VIP (expired)`;
          }
        }
        
        row.innerHTML = `
          <td>${user.username || 'N/A'}</td>
          <td>${user.email || 'N/A'}</td>
          <td><span class="status-badge ${roleBadgeClass}">${statusText}</span></td>
          <td>${new Date(user.created_at).toLocaleDateString()}</td>
          <td>
            <button class="edit-button" onclick="openModal('userModal', 'edit', '${user.id}')"><i class="fas fa-edit"></i></button>
          </td>
        `;
        usersTableBody.appendChild(row);
      });
    } else {
      usersTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No users found</td></tr>`;
    }
  } catch (error) {
    console.error('Error loading users list:', error);
    showToast('Failed to load users list: ' + error.message, 'error');
  }
}

// Function to load VIP users list
async function loadVipList() {
  const vipTableBody = document.getElementById('vipTableBody');
  if (!vipTableBody) return;

  try {
    console.log('Loading VIP users list...');
    
    const { data: vipUsers, error } = await window.supabase
      .from('profiles')
      .select('id, username, email, role, created_at, expiration_date')
      .eq('role', 'vip')
      .order('expiration_date', { ascending: true });

    if (error) {
      console.error('Error loading VIP users:', error);
      throw error;
    }

    console.log(`Loaded ${vipUsers.length} VIP users`);
    
    vipTableBody.innerHTML = '';
    
    if (vipUsers && vipUsers.length > 0) {
      vipUsers.forEach(user => {
        const row = document.createElement('tr');
        
        // Format dates
        const createdDate = new Date(user.created_at).toLocaleDateString();
        
        // Format expiration date and status
        let expirationText = 'No expiration set';
        let statusBadgeClass = 'status-regular';
        let statusText = 'Active';
        
        if (user.expiration_date) {
          const expirationDate = new Date(user.expiration_date);
          expirationText = expirationDate.toLocaleDateString() + ' ' + 
                          expirationDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          
          const today = new Date();
          if (expirationDate < today) {
            statusBadgeClass = 'status-expired';
            statusText = 'Expired';
          } else {
            const daysRemaining = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining <= 3) {
              statusBadgeClass = 'status-expiring-soon';
              statusText = `Expiring soon (${daysRemaining} days)`;
            } else {
              statusBadgeClass = 'status-vip';
              statusText = `Active (${daysRemaining} days left)`;
            }
          }
        }
        
        row.innerHTML = `
          <td>${user.username || 'N/A'}</td>
          <td>${user.email || 'N/A'}</td>
          <td>${createdDate}</td>
          <td>${expirationText}</td>
          <td><span class="status-badge ${statusBadgeClass}">${statusText}</span></td>
          <td>
            <div class="table-actions">
              <button class="edit-btn" onclick="openExtendVipModal('${user.id}')"><i class="fas fa-clock"></i></button>
              <button class="delete-btn" onclick="revokeVip('${user.id}')"><i class="fas fa-user-minus"></i></button>
            </div>
          </td>
        `;
        vipTableBody.appendChild(row);
      });
    } else {
      vipTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No VIP users found</td></tr>`;
    }
  } catch (error) {
    console.error('Error loading VIP users list:', error);
    showToast('Failed to load VIP users list: ' + error.message, 'error');
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
  } else if (modalId === 'extendVipModal') {
    const form = document.getElementById('extendVipForm');
    if (action === 'add') {
      if (modalTitle) modalTitle.textContent = 'Tambah Perpanjangan VIP';
      form.reset();
      form.removeAttribute('data-id');
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
    
    // Setup role dropdown with all available roles
    const roleSelect = form.querySelector('#userRole');
    if (roleSelect) {
      const roleValue = user.role || 'user';
      console.log('Setting role select to:', roleValue);
      
      // Clear all existing options first
      while (roleSelect.options.length > 0) {
        roleSelect.remove(0);
      }
      
      // Add standard role options
      const roles = ['user', 'vip', 'admin'];
      roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role;
        option.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        roleSelect.appendChild(option);
      });
      
      // Set the current role
      roleSelect.value = roleValue;
      console.log('Role select value after setting:', roleSelect.value);
      
      // Show/hide expiration date field based on role
      const vipExpirationGroup = document.querySelector('.vip-expiration-group');
      if (vipExpirationGroup) {
        if (roleValue === 'vip') {
          vipExpirationGroup.style.display = 'block';
          
          // Set the expiration date if available
          const expirationDateInput = document.getElementById('expirationDate');
          if (expirationDateInput) {
            if (user.expiration_date) {
              const formattedDate = new Date(user.expiration_date).toISOString().split('T')[0];
              expirationDateInput.value = formattedDate;
            } else {
              // Set default expiration to 30 days from now
              const thirtyDaysLater = new Date();
              thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
              expirationDateInput.value = thirtyDaysLater.toISOString().split('T')[0];
            }
          }
        } else {
          vipExpirationGroup.style.display = 'none';
        }
      }
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

    console.log('Updating user role:', { userId, userRole });

    // Validate form fields
    if (!userId || !userRole) {
      showToast('User ID and role are required!', 'error');
      return;
    }

    // Get the current session to verify authentication
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

    console.log('Admin check passed, proceeding with edge function call');

    // First check if the user exists
    const { data: userExists, error: userExistsError } = await window.supabase
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userExistsError || !userExists) {
      console.error('User not found:', userExistsError || 'No user data returned');
      showToast('User not found.', 'error');
      return;
    }

    console.log('User found:', userExists);
    console.log('Current role:', userExists.role);
    console.log('New role:', userRole);
    
    // Call the edge function to update the user role
    const supabaseUrl = 'https://eguwfitbjuzzwbgalwcx.supabase.co';
    
    // Show loading toast
    showToast('Updating user role...', 'info');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/update-user-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        userId: userId,
        newRole: userRole,
        adminId: session.user.id
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Edge function error:', result);
      showToast(`Failed to update user role: ${result.error || 'Unknown error'}`, 'error');
      return;
    }
    
    console.log('Role updated successfully via edge function:', result);
    showToast('User role updated successfully!', 'success');
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

// Function to open the extend VIP modal
window.openExtendVipModal = async function(userId) {
  try {
    const extendVipModal = document.getElementById('extendVipModal');
    const overlay = document.getElementById('overlay');
    
    // Fetch user data
    const { data: user, error } = await window.supabase
      .from('profiles')
      .select('id, username, expiration_date')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user data for VIP extension:', error);
      showToast(`Error: ${error.message}`, 'error');
      return;
    }
    
    if (!user) {
      showToast('User not found', 'error');
      return;
    }
    
    // Populate form
    const form = document.getElementById('extendVipForm');
    form.querySelector('#extendVipUserId').value = user.id;
    form.querySelector('#vipUsername').value = user.username || 'Unknown';
    
    // Handle current expiration
    let baseDate;
    if (user.expiration_date) {
      const expirationDate = new Date(user.expiration_date);
      baseDate = expirationDate;
      form.querySelector('#currentExpiration').value = expirationDate.toLocaleDateString() + ' ' + 
                                                       expirationDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else {
      baseDate = new Date();
      form.querySelector('#currentExpiration').value = 'Not set (using current date)';
    }
    
    // Calculate and display new expiration date based on selected period
    const extensionPeriod = form.querySelector('#extensionPeriod').value;
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + parseInt(extensionPeriod));
    form.querySelector('#newExpiration').value = newDate.toLocaleDateString() + ' ' + 
                                               newDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Show modal
    if (extendVipModal) extendVipModal.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
    
    // Setup close handlers
    const closeModalBtn = extendVipModal.querySelector('.close-modal');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => closeModal('extendVipModal'));
    }
    
    // Also close when clicking outside modal
    if (overlay) {
      overlay.addEventListener('click', () => closeModal('extendVipModal'));
    }
  } catch (error) {
    console.error('Error opening extend VIP modal:', error);
    showToast('Failed to open modal: ' + error.message, 'error');
  }
};

// Function to update the new expiration date preview
function updateNewExpirationDate() {
  const form = document.getElementById('extendVipForm');
  if (!form) return;
  
  const currentExpirationText = form.querySelector('#currentExpiration').value;
  let baseDate;
  
  if (currentExpirationText === 'Not set (using current date)') {
    baseDate = new Date();
  } else {
    // Try to parse the date from the displayed text
    const dateParts = currentExpirationText.split(' ')[0].split('/');
    if (dateParts.length === 3) {
      // Assuming MM/DD/YYYY format
      baseDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);
    } else {
      baseDate = new Date(); // Fallback to current date
    }
  }
  
  const extensionPeriod = form.querySelector('#extensionPeriod').value;
  const newDate = new Date(baseDate);
  newDate.setDate(newDate.getDate() + parseInt(extensionPeriod));
  
  form.querySelector('#newExpiration').value = newDate.toLocaleDateString() + ' ' + 
                                              newDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Function to handle extend VIP form submission
async function handleExtendVipSubmit(event) {
  event.preventDefault();
  
  try {
    const form = event.target;
    const userId = form.querySelector('#extendVipUserId').value;
    const extensionPeriod = parseInt(form.querySelector('#extensionPeriod').value);
    
    if (!userId || isNaN(extensionPeriod)) {
      showToast('Invalid form data', 'error');
      return;
    }
    
    // Get current user data
    const { data: user, error: fetchError } = await window.supabase
      .from('profiles')
      .select('expiration_date')
      .eq('id', userId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching user data:', fetchError);
      showToast(`Error: ${fetchError.message}`, 'error');
      return;
    }
    
    // Calculate new expiration date
    let baseDate;
    if (user.expiration_date) {
      const currentExpiration = new Date(user.expiration_date);
      const now = new Date();
      
      // If expiration is in the past, start from now
      baseDate = currentExpiration < now ? now : currentExpiration;
    } else {
      baseDate = new Date();
    }
    
    const newExpirationDate = new Date(baseDate);
    newExpirationDate.setDate(newExpirationDate.getDate() + extensionPeriod);
    
    // Update the user
    const { error: updateError } = await window.supabase
      .from('profiles')
      .update({ 
        role: 'vip',
        expiration_date: newExpirationDate.toISOString()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error extending VIP status:', updateError);
      showToast(`Error: ${updateError.message}`, 'error');
      return;
    }
    
    showToast('VIP status extended successfully!', 'success');
    closeModal('extendVipModal');
    loadVipList();
    loadUsersList();
    
  } catch (error) {
    console.error('Error handling extend VIP form:', error);
    showToast('Failed to extend VIP status: ' + error.message, 'error');
  }
}

// Function to revoke VIP status
window.revokeVip = async function(userId) {
  if (confirm('Are you sure you want to revoke VIP status for this user?')) {
    try {
      const { error } = await window.supabase
        .from('profiles')
        .update({ 
          role: 'user',
          expiration_date: null
        })
        .eq('id', userId);
        
      if (error) {
        console.error('Error revoking VIP status:', error);
        showToast(`Error: ${error.message}`, 'error');
        return;
      }
      
      showToast('VIP status revoked successfully!', 'success');
      loadVipList();
      loadUsersList();
      
    } catch (error) {
      console.error('Error revoking VIP status:', error);
      showToast('Failed to revoke VIP status: ' + error.message, 'error');
    }
  }
};

// Function to check for and downgrade expired VIP users
async function checkAndDowngradeExpiredVips() {
  try {
    showToast('Checking for expired VIP memberships...', 'info');
    
    // Get all VIP users with expiration dates
    const { data: vipUsers, error: fetchError } = await window.supabase
      .from('profiles')
      .select('id, username, expiration_date')
      .eq('role', 'vip')
      .not('expiration_date', 'is', null);
      
    if (fetchError) {
      console.error('Error fetching VIP users:', fetchError);
      showToast(`Error: ${fetchError.message}`, 'error');
      return;
    }
    
    if (!vipUsers || vipUsers.length === 0) {
      showToast('No VIP users with expiration dates found.', 'info');
      return;
    }
    
    console.log(`Checking ${vipUsers.length} VIP users for expiration`);
    
    const now = new Date();
    let expiredCount = 0;
    
    // Loop through users and check expirations
    for (const user of vipUsers) {
      if (user.expiration_date) {
        const expirationDate = new Date(user.expiration_date);
        
        if (expirationDate < now) {
          console.log(`User ${user.username} (${user.id}) VIP has expired on ${expirationDate.toLocaleString()}`);
          
          // Downgrade this user
          const { error: updateError } = await window.supabase
            .from('profiles')
            .update({ 
              role: 'user',
              expiration_date: null
            })
            .eq('id', user.id);
            
          if (updateError) {
            console.error(`Error downgrading user ${user.id}:`, updateError);
          } else {
            expiredCount++;
          }
        }
      }
    }
    
    // Reload user lists
    loadVipList();
    loadUsersList();
    
    // Show results
    if (expiredCount > 0) {
      showToast(`Downgraded ${expiredCount} expired VIP user(s).`, 'success');
    } else {
      showToast('No expired VIP memberships found.', 'info');
    }
    
  } catch (error) {
    console.error('Error checking VIP expirations:', error);
    showToast('Failed to check VIP expirations: ' + error.message, 'error');
  }
}

// VIP role related UI
const userRoleSelect = document.getElementById('userRole');
if (userRoleSelect) {
  userRoleSelect.addEventListener('change', function() {
    const vipExpirationGroup = document.querySelector('.vip-expiration-group');
    if (vipExpirationGroup) {
      if (this.value === 'vip') {
        vipExpirationGroup.style.display = 'block';
        
        // Set default expiration date to 30 days from now if not already set
        const expirationDateInput = document.getElementById('expirationDate');
        if (expirationDateInput && !expirationDateInput.value) {
          const thirtyDaysLater = new Date();
          thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
          expirationDateInput.value = thirtyDaysLater.toISOString().split('T')[0];
        }
      } else {
        vipExpirationGroup.style.display = 'none';
      }
    }
  });
}

// Check VIP expirations button
const checkExpirationsBtn = document.getElementById('checkExpirationsBtn');
if (checkExpirationsBtn) {
  checkExpirationsBtn.addEventListener('click', checkAndDowngradeExpiredVips);
}

// Sync VIP button
const syncVipBtn = document.getElementById('syncVipBtn');
if (syncVipBtn) {
  syncVipBtn.addEventListener('click', loadVipList);
}

// Extension period change event
const extensionPeriod = document.getElementById('extensionPeriod');
if (extensionPeriod) {
  extensionPeriod.addEventListener('change', updateNewExpirationDate);
}
