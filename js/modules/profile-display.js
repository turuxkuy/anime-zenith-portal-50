
// Module for handling profile display functionality

// Function to load user profile and update UI
async function loadUserProfile() {
  console.log("Loading user profile...");
  try {
    // Get user from authenticated session
    const { data: { user }, error: authError } = await window.supabase.auth.getUser();
    
    if (authError) {
      console.error("Auth error:", authError);
      throw authError;
    }
    
    if (!user) {
      console.log("No authenticated user found");
      return;
    }

    console.log("User authenticated:", user.id);

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      throw profileError;
    }

    if (!profile) {
      console.error("Profile not found for user:", user.id);
      showToast("Profil tidak ditemukan", "error");
      return;
    }

    console.log("User profile loaded:", profile);

    // Update the DOM with user info
    updateUserInterface(profile, user);
    
    // Check if user is admin and show admin link if true
    const adminLink = document.getElementById('adminLink');
    if (adminLink && profile.role === 'admin') {
      adminLink.style.display = 'block';
    }

  } catch (error) {
    console.error("Error loading user profile:", error);
    showToast("Terjadi kesalahan saat memuat profil", "error");
  }
}

// Function to update the user interface with profile data
function updateUserInterface(profile, user) {
  // Update username
  const profileUsername = document.getElementById('profileUsername');
  const detailUsername = document.getElementById('detailUsername');
  if (profileUsername) profileUsername.textContent = profile.username || user.email.split('@')[0];
  if (detailUsername) detailUsername.textContent = profile.username || user.email.split('@')[0];

  // Update email
  const detailEmail = document.getElementById('detailEmail');
  if (detailEmail) detailEmail.textContent = user.email;

  // Update role badge
  const userRole = document.getElementById('userRole');
  const detailRole = document.getElementById('detailRole');
  
  // Format the role text for display
  const roleText = profile.role === 'admin' ? 'Admin' : profile.role === 'vip' ? 'VIP' : 'Regular';
  
  if (userRole) {
    userRole.textContent = roleText;
    userRole.className = `user-role ${profile.role}`;
  }
  
  if (detailRole) detailRole.textContent = roleText;

  // Update join date
  const detailJoined = document.getElementById('detailJoined');
  if (detailJoined && profile.created_at) {
    const joinDate = new Date(profile.created_at);
    detailJoined.textContent = joinDate.toLocaleDateString('id-ID');
  }

  // Show/hide appropriate cards based on role
  const regularUserCard = document.getElementById('regularUserCard');
  const vipUserCard = document.getElementById('vipUserCard');
  const vipExpirationContainer = document.getElementById('vipExpirationContainer');
  const vipExpirationDate = document.getElementById('vipExpirationDate');
  const detailExpiration = document.getElementById('detailExpiration');

  // Handle VIP status and expiration date
  if (profile.role === 'vip') {
    console.log("User is VIP, expiration date:", profile.expiration_date);
    
    if (regularUserCard) regularUserCard.style.display = 'none';
    if (vipUserCard) vipUserCard.style.display = 'block';
    
    // Handle expiration date display
    if (profile.expiration_date) {
      const expDate = new Date(profile.expiration_date);
      const formattedDate = expDate.toLocaleString('id-ID', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      
      console.log("Formatted expiration date:", formattedDate);
      
      if (vipExpirationContainer) vipExpirationContainer.style.display = 'block';
      if (vipExpirationDate) vipExpirationDate.textContent = formattedDate;
      if (detailExpiration) detailExpiration.textContent = formattedDate;
    } else {
      if (vipExpirationDate) vipExpirationDate.textContent = 'Tidak Ada Batas';
      if (detailExpiration) detailExpiration.textContent = 'Tidak Ada Batas';
    }
  } else {
    if (regularUserCard) regularUserCard.style.display = 'block';
    if (vipUserCard) vipUserCard.style.display = 'none';
    if (vipExpirationContainer) vipExpirationContainer.style.display = 'none';
  }
}

// Export functions for external use
export { loadUserProfile };
