
// Admin panel JavaScript

// Function to show toast message
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
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
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
    }
}

// Function to close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    }
}

// Function to get current user
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await window.supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        showToast('Gagal mendapatkan informasi pengguna', 'error');
        return null;
    }
}

// Function to load and display donghua
async function loadDonghua() {
    try {
        const { data: donghua, error } = await window.supabase
            .from('donghua')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tableBody = document.getElementById('donghuaTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        donghua.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${item.poster_url}" alt="${item.title}" width="50"></td>
                <td>${item.title}</td>
                <td>${item.year}</td>
                <td>${item.genre}</td>
                <td>${item.status}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${item.id}" onclick="openDonghuaEditModal('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${item.id}" onclick="confirmDeleteDonghua('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        document.getElementById('totalDonghua').textContent = donghua.length;

    } catch (error) {
        console.error('Error loading donghua:', error);
        showToast('Gagal memuat data donghua', 'error');
    }
}

// Function to confirm delete donghua
function confirmDeleteDonghua(donghuaId) {
    if (confirm('Apakah Anda yakin ingin menghapus donghua ini?')) {
        deleteDonghua(donghuaId);
    }
}

// Function to open donghua edit modal
async function openDonghuaEditModal(donghuaId) {
    try {
        console.log('Opening edit modal for donghua ID:', donghuaId);
        
        // Fetch the donghua details
        const { data: donghuaItem, error } = await window.supabase
            .from('donghua')
            .select('*')
            .eq('id', donghuaId)
            .single();

        if (error) throw error;
        
        if (!donghuaItem) {
            showToast('Donghua tidak ditemukan', 'error');
            return;
        }

        const modal = document.getElementById('donghuaModal');
        const form = document.getElementById('donghuaForm');

        if (!modal || !form) {
            console.error('Modal or form element not found');
            return;
        }

        document.getElementById('donghuaModalTitle').textContent = 'Edit Donghua';
        document.getElementById('title').value = donghuaItem.title || '';
        document.getElementById('year').value = donghuaItem.year || '';
        document.getElementById('genre').value = donghuaItem.genre || '';
        document.getElementById('status').value = donghuaItem.status || 'Ongoing';
        document.getElementById('rating').value = donghuaItem.rating || '';
        document.getElementById('synopsis').value = donghuaItem.synopsis || '';
        document.getElementById('posterUrl').value = donghuaItem.poster_url || '';
        document.getElementById('backdropUrl').value = donghuaItem.backdrop_url || '';
        form.setAttribute('data-id', donghuaItem.id);

        // Setup image previews
        if (donghuaItem.poster_url) {
            const posterPreview = document.getElementById('posterPreview');
            posterPreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = donghuaItem.poster_url;
            img.style.maxWidth = '100%';
            posterPreview.appendChild(img);
        }

        if (donghuaItem.backdrop_url) {
            const backdropPreview = document.getElementById('backdropPreview');
            backdropPreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = donghuaItem.backdrop_url;
            img.style.maxWidth = '100%';
            backdropPreview.appendChild(img);
        }

        openModal('donghuaModal');
    } catch (error) {
        console.error('Error opening donghua edit modal:', error);
        showToast('Gagal membuka modal edit', 'error');
    }
}

// Function to delete donghua
async function deleteDonghua(donghuaId) {
    try {
        const { error } = await window.supabase
            .from('donghua')
            .delete()
            .eq('id', donghuaId);

        if (error) throw error;

        showToast('Donghua berhasil dihapus', 'success');
        await loadDonghua(); // Reload donghua data

    } catch (error) {
        console.error('Error deleting donghua:', error);
        showToast('Gagal menghapus donghua', 'error');
    }
}

// Function to load and display episodes
async function loadEpisodes() {
    try {
        const { data: episodes, error } = await window.supabase
            .from('episodes')
            .select('*, donghua(title)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tableBody = document.getElementById('episodeTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        episodes.forEach(episode => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${episode.thumbnail_url}" alt="${episode.title}" width="50"></td>
                <td>${episode.donghua?.title || 'N/A'}</td>
                <td>${episode.episode_number}</td>
                <td>${episode.title}</td>
                <td>${episode.is_vip ? 'VIP' : 'Umum'}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${episode.id}" onclick="openEpisodeEditModal('${episode.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${episode.id}" onclick="confirmDeleteEpisode('${episode.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        document.getElementById('totalEpisodes').textContent = episodes.length;

    } catch (error) {
        console.error('Error loading episodes:', error);
        showToast('Gagal memuat data episode', 'error');
    }
}

// Function to confirm delete episode
function confirmDeleteEpisode(episodeId) {
    if (confirm('Apakah Anda yakin ingin menghapus episode ini?')) {
        deleteEpisode(episodeId);
    }
}

// Function to open episode edit modal
async function openEpisodeEditModal(episodeId) {
    try {
        console.log('Opening edit modal for episode ID:', episodeId);
        
        // Fetch the episode details
        const { data: episodeItem, error } = await window.supabase
            .from('episodes')
            .select('*')
            .eq('id', episodeId)
            .single();

        if (error) throw error;
        
        if (!episodeItem) {
            showToast('Episode tidak ditemukan', 'error');
            return;
        }

        const modal = document.getElementById('episodeModal');
        const form = document.getElementById('episodeForm');

        if (!modal || !form) {
            console.error('Modal or form element not found');
            return;
        }

        document.getElementById('episodeModalTitle').textContent = 'Edit Episode';
        document.getElementById('episodeNumber').value = episodeItem.episode_number || '';
        document.getElementById('episodeTitle').value = episodeItem.title || '';
        document.getElementById('episodeDescription').value = episodeItem.description || '';
        document.getElementById('episodeDuration').value = episodeItem.duration || '';
        document.getElementById('isVip').value = episodeItem.is_vip ? 'true' : 'false';
        document.getElementById('thumbnailUrl').value = episodeItem.thumbnail_url || '';
        document.getElementById('videoUrl').value = episodeItem.video_url || '';
        document.getElementById('releaseDate').value = episodeItem.release_date ? episodeItem.release_date.substring(0, 10) : '';
        form.setAttribute('data-id', episodeItem.id);

        // Setup thumbnail preview
        if (episodeItem.thumbnail_url) {
            const thumbnailPreview = document.getElementById('thumbnailPreview');
            thumbnailPreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = episodeItem.thumbnail_url;
            img.style.maxWidth = '100%';
            thumbnailPreview.appendChild(img);
        }

        // Load donghua options
        await loadDonghuaOptions(episodeItem.donghua_id);

        openModal('episodeModal');
    } catch (error) {
        console.error('Error opening episode edit modal:', error);
        showToast('Gagal membuka modal edit', 'error');
    }
}

// Function to delete episode
async function deleteEpisode(episodeId) {
    try {
        const { error } = await window.supabase
            .from('episodes')
            .delete()
            .eq('id', episodeId);

        if (error) throw error;

        showToast('Episode berhasil dihapus', 'success');
        await loadEpisodes(); // Reload episode data

    } catch (error) {
        console.error('Error deleting episode:', error);
        showToast('Gagal menghapus episode', 'error');
    }
}

// Function to load donghua options for episode select
async function loadDonghuaOptions(selectedDonghuaId = null) {
    try {
        const { data: donghua, error } = await window.supabase
            .from('donghua')
            .select('id, title')
            .order('title', { ascending: true });

        if (error) throw error;

        const selectElement = document.getElementById('donghuaSelect');
        if (!selectElement) return;

        selectElement.innerHTML = '';

        donghua.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.title;
            if (selectedDonghuaId && item.id === selectedDonghuaId) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading donghua options:', error);
        showToast('Gagal memuat pilihan donghua', 'error');
    }
}

// Function to load and display users
async function loadUsers() {
    try {
        const { data: users, error } = await window.supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            
            // Format expiration date if exists
            let expirationText = 'N/A';
            if (user.role === 'vip' && user.expiration_date) {
                const expDate = new Date(user.expiration_date);
                expirationText = expDate.toLocaleString('id-ID');
            }
            
            row.innerHTML = `
                <td>${user.username || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>
                    <span class="status-badge ${user.role}">
                        ${user.role === 'admin' ? 'Admin' : user.role === 'vip' ? 'VIP' : 'Regular'}
                    </span>
                </td>
                <td>${expirationText}</td>
                <td>${new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${user.id}" onclick="openUserEditModal('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('vipUsers').textContent = users.filter(u => u.role === 'vip').length;
        
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Gagal memuat data pengguna', 'error');
    }
}

// Function to open user edit modal
async function openUserEditModal(userId) {
    try {
        console.log('Opening edit modal for user ID:', userId);
        
        // Fetch the user details
        const { data: userItem, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        
        if (!userItem) {
            showToast('Pengguna tidak ditemukan', 'error');
            return;
        }

        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const expirationDateGroup = document.getElementById('expirationDateGroup');
        
        if (!modal || !form) {
            console.error('Modal or form element not found');
            return;
        }
        
        document.getElementById('userId').value = userItem.id;
        document.getElementById('username').value = userItem.username || '';
        document.getElementById('email').value = userItem.email || '';
        document.getElementById('userRole').value = userItem.role || 'user';
        
        // Format the expiration date for the datetime-local input
        const expirationInput = document.getElementById('expirationDate');
        if (expirationInput) {
            if (userItem.expiration_date) {
                // Format the date to YYYY-MM-DDTHH:MM format required by datetime-local input
                const expDate = new Date(userItem.expiration_date);
                const year = expDate.getFullYear();
                const month = String(expDate.getMonth() + 1).padStart(2, '0');
                const day = String(expDate.getDate()).padStart(2, '0');
                const hours = String(expDate.getHours()).padStart(2, '0');
                const minutes = String(expDate.getMinutes()).padStart(2, '0');
                expirationInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            } else {
                expirationInput.value = '';
            }
        }
        
        // Show/hide expiration date field based on role
        if (expirationDateGroup) {
            expirationDateGroup.style.display = userItem.role === 'vip' ? 'block' : 'none';
        }
        
        // Add event listener for role change to show/hide expiration date field
        const roleSelect = document.getElementById('userRole');
        if (roleSelect) {
            // Remove any existing event listeners
            const newRoleSelect = roleSelect.cloneNode(true);
            roleSelect.parentNode.replaceChild(newRoleSelect, roleSelect);
            
            newRoleSelect.addEventListener('change', function() {
                if (expirationDateGroup) {
                    expirationDateGroup.style.display = this.value === 'vip' ? 'block' : 'none';
                }
            });
        }
        
        openModal('userModal');
    } catch (error) {
        console.error('Error opening user edit modal:', error);
        showToast('Gagal membuka modal edit', 'error');
    }
}

// Function to update user role
async function updateUserRole(userId, newRole, expirationDate) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Admin not authenticated');
        
        const adminId = user.id;
        
        // Update the API endpoint URL
        const apiUrl = 'https://eguwfitbjuzzwbgalwcx.supabase.co/functions/v1/update-user-role';
        
        // Debug expirationDate value
        console.log('Sending expirationDate:', expirationDate);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(await window.supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
                userId,
                newRole,
                adminId,
                expirationDate
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to update user role');
        }
        
        // Debug the returned result
        console.log('Update user role result:', result);
        
        return result;
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
}

// Function to check expired VIP status
async function checkExpiredVipStatus() {
    try {
        const { data: users, error } = await window.supabase
            .from('profiles')
            .select('id, expiration_date, role')
            .eq('role', 'vip');

        if (error) throw error;

        let updatedCount = 0;
        for (const user of users) {
            if (user.expiration_date) {
                const expirationDate = new Date(user.expiration_date);
                if (expirationDate <= new Date()) {
                    // Update user role to 'user'
                    const { error: updateError } = await window.supabase
                        .from('profiles')
                        .update({ role: 'user', expiration_date: null })
                        .eq('id', user.id);

                    if (updateError) {
                        console.error(`Error updating user ${user.id}:`, updateError);
                        continue;
                    }

                    updatedCount++;
                    console.log(`User ${user.id} VIP status expired and updated to 'user'`);
                }
            }
        }

        showToast(`${updatedCount} status VIP pengguna telah diperbarui`, 'success');
        await loadUsers(); // Reload user data

    } catch (error) {
        console.error('Error checking expired VIP status:', error);
        showToast('Gagal memeriksa status VIP kedaluwarsa', 'error');
    }
}

// Function to handle image preview
function setupImagePreview(inputElement, previewElement) {
    if (!inputElement || !previewElement) return;
    
    inputElement.addEventListener('input', function() {
        previewElement.innerHTML = '';
        const imageUrl = this.value;
        if (imageUrl) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.maxWidth = '100%';
            previewElement.appendChild(img);
        }
    });
}

// Function to logout
async function logoutUser() {
    try {
        console.log('Attempting to logout');
        const { error } = await window.supabase.auth.signOut();
        if (error) throw error;
        console.log('Logout successful');
        window.location.href = 'login-admin.html';
    } catch (error) {
        console.error('Error during logout:', error);
        showToast('Gagal keluar dari sistem', 'error');
    }
}

// Add a debugging function to check VIP expiration in database
window.debugVipExpiration = async function(userId) {
    try {
        const { data, error } = await window.supabase
            .from('profiles')
            .select('role, expiration_date')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        
        console.log('User role in database:', data.role);
        console.log('Expiration date in database:', data.expiration_date);
    } catch (err) {
        console.error('Error checking VIP expiration:', err);
    }
};

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin.js loaded and DOM ready');
    
    // Sidebar toggle
    const menuToggle = document.getElementById('menuToggle');
    const adminSidebar = document.getElementById('adminSidebar');
    const closeSidebar = document.getElementById('closeSidebar');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            adminSidebar.classList.toggle('active');
        });
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', function() {
            adminSidebar.classList.remove('active');
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        console.log('Logout button found, adding event listener');
        logoutBtn.addEventListener('click', function() {
            console.log('Logout button clicked');
            logoutUser();
        });
    } else {
        console.warn('Logout button not found');
    }

    // Menu item click
    document.querySelectorAll('.admin-menu-item').forEach(item => {
        item.addEventListener('click', function() {
            // Skip if this is the logout button
            if (this.id === 'logoutBtn') return;
            
            // Remove active class from all menu items and pages
            document.querySelectorAll('.admin-menu-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.admin-page').forEach(page => page.classList.remove('active'));

            // Add active class to clicked menu item and corresponding page
            this.classList.add('active');
            const pageId = this.getAttribute('data-page');
            document.getElementById(pageId).classList.add('active');

            // Update page title
            const pageTitle = this.querySelector('span').textContent;
            document.getElementById('pageTitle').textContent = pageTitle;
        });
    });

    // Donghua form submission
    const donghuaForm = document.getElementById('donghuaForm');
    if (donghuaForm) {
        donghuaForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const title = document.getElementById('title').value;
            const year = document.getElementById('year').value;
            const genre = document.getElementById('genre').value;
            const status = document.getElementById('status').value;
            const rating = document.getElementById('rating').value;
            const synopsis = document.getElementById('synopsis').value;
            const posterUrl = document.getElementById('posterUrl').value;
            const backdropUrl = document.getElementById('backdropUrl').value;

            const donghuaId = this.getAttribute('data-id');

            try {
                if (donghuaId) {
                    // Update existing donghua
                    const { error } = await window.supabase
                        .from('donghua')
                        .update({
                            title,
                            year,
                            genre,
                            status,
                            rating,
                            synopsis,
                            poster_url: posterUrl,
                            backdrop_url: backdropUrl
                        })
                        .eq('id', donghuaId);

                    if (error) throw error;

                    showToast('Donghua berhasil diperbarui', 'success');
                } else {
                    // Add new donghua
                    const { error } = await window.supabase
                        .from('donghua')
                        .insert({
                            title,
                            year,
                            genre,
                            status,
                            rating,
                            synopsis,
                            poster_url: posterUrl,
                            backdrop_url: backdropUrl
                        });

                    if (error) throw error;

                    showToast('Donghua berhasil ditambahkan', 'success');
                }

                closeModal('donghuaModal');
                await loadDonghua(); // Reload donghua data

            } catch (error) {
                console.error('Error submitting donghua form:', error);
                showToast('Gagal menyimpan data donghua', 'error');
            }
        });
    }

    // Episode form submission
    const episodeForm = document.getElementById('episodeForm');
    if (episodeForm) {
        episodeForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const donghuaId = document.getElementById('donghuaSelect').value;
            const episodeNumber = document.getElementById('episodeNumber').value;
            const episodeTitle = document.getElementById('episodeTitle').value;
            const episodeDescription = document.getElementById('episodeDescription').value;
            const episodeDuration = document.getElementById('episodeDuration').value;
            const isVip = document.getElementById('isVip').value === 'true';
            const thumbnailUrl = document.getElementById('thumbnailUrl').value;
            const videoUrl = document.getElementById('videoUrl').value;
            const releaseDate = document.getElementById('releaseDate').value;

            const episodeId = this.getAttribute('data-id');

            try {
                if (episodeId) {
                    // Update existing episode
                    const { error } = await window.supabase
                        .from('episodes')
                        .update({
                            donghua_id: donghuaId,
                            episode_number: episodeNumber,
                            title: episodeTitle,
                            description: episodeDescription,
                            duration: episodeDuration,
                            is_vip: isVip,
                            thumbnail_url: thumbnailUrl,
                            video_url: videoUrl,
                            release_date: releaseDate
                        })
                        .eq('id', episodeId);

                    if (error) throw error;

                    showToast('Episode berhasil diperbarui', 'success');
                } else {
                    // Add new episode
                    const { error } = await window.supabase
                        .from('episodes')
                        .insert({
                            donghua_id: donghuaId,
                            episode_number: episodeNumber,
                            title: episodeTitle,
                            description: episodeDescription,
                            duration: episodeDuration,
                            is_vip: isVip,
                            thumbnail_url: thumbnailUrl,
                            video_url: videoUrl,
                            release_date: releaseDate
                        });

                    if (error) throw error;

                    showToast('Episode berhasil ditambahkan', 'success');
                }

                closeModal('episodeModal');
                await loadEpisodes(); // Reload episode data

            } catch (error) {
                console.error('Error submitting episode form:', error);
                showToast('Gagal menyimpan data episode', 'error');
            }
        });
    }
    
    // User form submission
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const userId = document.getElementById('userId').value;
            const role = document.getElementById('userRole').value;
            
            // Get the expiration date if the role is VIP
            let expirationDate = null;
            if (role === 'vip') {
                const expirationInput = document.getElementById('expirationDate').value;
                if (expirationInput) {
                    // Convert the local datetime to an ISO string for the server
                    expirationDate = new Date(expirationInput).toISOString();
                    console.log('Expiration date set to:', expirationDate);
                }
            }
            
            try {
                // Debug data being sent
                console.log('Updating user:', {
                    userId,
                    role,
                    expirationDate
                });
                
                const result = await updateUserRole(userId, role, expirationDate);
                
                if (result.success) {
                    showToast('Status pengguna berhasil diperbarui', 'success');
                    closeModal('userModal');
                    await loadUsers(); // Reload user data
                    
                    // Debug the expiration date
                    window.debugVipExpiration(userId);
                } else {
                    showToast('Gagal memperbarui status', 'error');
                }
            } catch (error) {
                console.error('Error updating user:', error);
                showToast(`Error: ${error.message}`, 'error');
            }
        });
    }

    // Add donghua button
    const addDonghuaBtn = document.getElementById('addDonghuaBtn');
    if (addDonghuaBtn) {
        addDonghuaBtn.addEventListener('click', function() {
            document.getElementById('donghuaModalTitle').textContent = 'Tambah Donghua';
            document.getElementById('donghuaForm').reset();
            document.getElementById('donghuaForm').removeAttribute('data-id');
            // Clear image previews
            document.getElementById('posterPreview').innerHTML = '';
            document.getElementById('backdropPreview').innerHTML = '';
            openModal('donghuaModal');
        });
    }

    // Add episode button
    const addEpisodeBtn = document.getElementById('addEpisodeBtn');
    if (addEpisodeBtn) {
        addEpisodeBtn.addEventListener('click', async function() {
            document.getElementById('episodeModalTitle').textContent = 'Tambah Episode';
            document.getElementById('episodeForm').reset();
            document.getElementById('episodeForm').removeAttribute('data-id');
            // Clear image previews
            document.getElementById('thumbnailPreview').innerHTML = '';
            await loadDonghuaOptions();
            openModal('episodeModal');
        });
    }

    // Sync donghua button
    const syncDonghuaBtn = document.getElementById('syncDonghuaBtn');
    if (syncDonghuaBtn) {
        syncDonghuaBtn.addEventListener('click', async function() {
            showToast('Sinkronisasi donghua dimulai...', 'info');
            await loadDonghua();
            showToast('Sinkronisasi donghua selesai', 'success');
        });
    }

    // Sync episode button
    const syncEpisodeBtn = document.getElementById('syncEpisodeBtn');
    if (syncEpisodeBtn) {
        syncEpisodeBtn.addEventListener('click', async function() {
            showToast('Sinkronisasi episode dimulai...', 'info');
            await loadEpisodes();
            showToast('Sinkronisasi episode selesai', 'success');
        });
    }

    // Sync users button
    const syncUsersBtn = document.getElementById('syncUsersBtn');
    if (syncUsersBtn) {
        syncUsersBtn.addEventListener('click', async function() {
            showToast('Sinkronisasi pengguna dimulai...', 'info');
            await loadUsers();
            showToast('Sinkronisasi pengguna selesai', 'success');
        });
    }

    // Check expired VIP button
    const checkExpiredBtn = document.getElementById('checkExpiredBtn');
    if (checkExpiredBtn) {
        checkExpiredBtn.addEventListener('click', async function() {
            if (confirm('Apakah Anda yakin ingin memeriksa dan memperbarui status VIP yang kedaluwarsa?')) {
                await checkExpiredVipStatus();
            }
        });
    }

    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    // Image preview setup
    setupImagePreview(document.getElementById('posterUrl'), document.getElementById('posterPreview'));
    setupImagePreview(document.getElementById('backdropUrl'), document.getElementById('backdropPreview'));
    setupImagePreview(document.getElementById('thumbnailUrl'), document.getElementById('thumbnailPreview'));

    // Expose functions to global scope
    window.openDonghuaEditModal = openDonghuaEditModal;
    window.confirmDeleteDonghua = confirmDeleteDonghua;
    window.openEpisodeEditModal = openEpisodeEditModal;
    window.confirmDeleteEpisode = confirmDeleteEpisode;
    window.openUserEditModal = openUserEditModal;
    window.logoutUser = logoutUser;

    // Load initial data
    console.log('Loading initial data');
    loadDonghua();
    loadEpisodes();
    loadUsers();
});

// Utility functions
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
