document.addEventListener('DOMContentLoaded', async function() {
  console.log('User profile page loaded');
  
  // Check if Supabase JS is loaded
  if (typeof supabase === 'undefined') {
    console.error('Supabase client is not loaded. Make sure to include supabase-config.js');
    return;
  }
  
  // Initialize menu toggle functionality
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      console.log('Menu toggle clicked, menu is now:', navMenu.classList.contains('active') ? 'active' : 'inactive');
    });
    
    // Close mobile menu when clicking anywhere outside
    document.addEventListener('click', function(event) {
      if (!event.target.closest('.menu-toggle') && !event.target.closest('.nav-menu') && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
      }
    });
  }
  
  // Check authentication status
  try {
    const { data } = await supabase.auth.getSession();
    const isAuthenticated = !!data.session;
    
    console.log('Authentication status:', isAuthenticated ? 'Logged in' : 'Not logged in');
    
    // Get UI elements
    const loginPrompt = document.getElementById('loginPrompt');
    const profileContainer = document.getElementById('profileContainer');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const requestVipBtn = document.getElementById('requestVipBtn');
    const requestVipModal = document.getElementById('requestVipModal');
    const logoutButton = document.getElementById('logoutButton');
    const regularUserCard = document.getElementById('regularUserCard');
    const vipUserCard = document.getElementById('vipUserCard');
  
    // Show/hide elements based on authentication
    if (isAuthenticated) {
      console.log('User is authenticated, showing profile');
      if (loginPrompt) loginPrompt.style.display = 'none';
      if (profileContainer) profileContainer.style.display = 'block';
      
      // Load user data
      await loadUserProfile(data.session.user.id);
    } else {
      console.log('User is not authenticated, showing login prompt');
      if (loginPrompt) loginPrompt.style.display = 'block';
      if (profileContainer) profileContainer.style.display = 'none';
    }
    
    // Add event listeners
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', function() {
        if (changePasswordModal) changePasswordModal.style.display = 'flex';
      });
    }
    
    if (requestVipBtn) {
      requestVipBtn.addEventListener('click', async function() {
        try {
          // Send VIP request notification to admins
          const userId = data.session.user.id;
          
          // Get username from profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();
            
          const username = profileData?.username || 'User';
          console.log('Sending VIP request for user:', username, 'with ID:', userId);
          
          // Insert new VIP request - first create the table if it doesn't exist
          const { error: insertError } = await supabase
            .from('vip_requests')
            .insert([
              {
                user_id: userId,
                username: username,
                status: 'pending'
              }
            ]);
          
          if (insertError) {
            console.error('Error sending VIP request:', insertError);
            throw insertError;
          }
          
          console.log('VIP request sent successfully');
          
          // Show VIP request modal
          if (requestVipModal) requestVipModal.style.display = 'flex';
        } catch (error) {
          console.error('Error sending VIP request:', error);
          alert('Gagal mengirim permintaan: ' + (error.message || 'Terjadi kesalahan'));
        }
      });
    }
    
    if (logoutButton) {
      logoutButton.addEventListener('click', logoutUser);
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
  }
  
  // Close modals
  document.querySelectorAll('.close-modal, .close-modal-btn').forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });
  
  // Close modal by clicking outside
  window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });
  
  // Handle password change form
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmNewPassword = document.getElementById('confirmNewPassword').value;
      const errorElement = document.getElementById('passwordError');
      
      // Validate password match
      if (newPassword !== confirmNewPassword) {
        errorElement.textContent = 'Password baru tidak cocok';
        errorElement.style.display = 'block';
        return;
      }
      
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          throw new Error('Tidak ada sesi yang aktif');
        }
        
        // First, verify current password by signing in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.session.user.email,
          password: currentPassword
        });
        
        if (signInError) throw new Error('Password saat ini salah');
        
        // Then update password
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (error) throw error;
        
        // Show success message
        errorElement.textContent = 'Password berhasil diubah';
        errorElement.style.color = '#4CAF50';
        errorElement.style.display = 'block';
        
        // Reset form and close modal after 2 seconds
        changePasswordForm.reset();
        setTimeout(() => {
          const modal = document.getElementById('changePasswordModal');
          if (modal) modal.style.display = 'none';
          errorElement.style.display = 'none';
          errorElement.style.color = '#FF3B30';
        }, 2000);
      } catch (error) {
        console.error('Error changing password:', error);
        errorElement.textContent = 'Gagal mengubah password: ' + (error.message || 'Terjadi kesalahan');
        errorElement.style.display = 'block';
      }
    });
  }
});

// Function to load user profile data
async function loadUserProfile(userId) {
  try {
    console.log('Loading profile for user:', userId);
    
    // Fetch user metadata from auth.users
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
    } else {
      console.log('User data from auth:', userData);
    }
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      
      // If profile doesn't exist, try to create one using metadata
      if (error.code === 'PGRST116') {
        console.log('Profile not found, creating from user metadata');
        
        if (userData && userData.user) {
          const username = userData.user.user_metadata?.username || userData.user.email?.split('@')[0] || 'User';
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userId,
                username: username,
                email: userData.user.email,
                role: 'user'
              }
            ])
            .select()
            .single();
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
            throw insertError;
          }
          
          console.log('Created new profile:', newProfile);
          return await loadUserProfile(userId); // Reload after creating
        }
      }
      throw error;
    }
    
    if (profile) {
      console.log('Profile loaded successfully:', profile);
      
      // Update profile elements
      document.querySelectorAll('#profileUsername, #detailUsername').forEach(element => {
        if (element) element.textContent = profile.username;
      });
      
      if (document.getElementById('detailEmail')) {
        document.getElementById('detailEmail').textContent = profile.email || '-';
      }
      
      if (document.getElementById('detailRole')) {
        document.getElementById('detailRole').textContent = profile.role === 'admin' ? 'Admin' : 
                                                           profile.role === 'vip' ? 'VIP' : 'Regular';
      }
      
      if (document.getElementById('userRole')) {
        document.getElementById('userRole').textContent = profile.role === 'admin' ? 'Admin' : 
                                                         profile.role === 'vip' ? 'VIP' : 'Regular';
        document.getElementById('userRole').className = 'user-role ' + profile.role;
      }
      
      if (document.getElementById('detailJoined')) {
        const createdDate = new Date(profile.created_at).toLocaleDateString('id-ID');
        document.getElementById('detailJoined').textContent = createdDate;
      }
      
      // Show/hide VIP cards based on role
      const regularUserCard = document.getElementById('regularUserCard');
      const vipUserCard = document.getElementById('vipUserCard');
      
      if (profile.role === 'vip' || profile.role === 'admin') {
        if (regularUserCard) regularUserCard.style.display = 'none';
        if (vipUserCard) vipUserCard.style.display = 'block';
      } else {
        if (regularUserCard) regularUserCard.style.display = 'block';
        if (vipUserCard) vipUserCard.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
    // Handle error (e.g., show a message to the user)
  }
}
