
// Adding a specific function for debugging VIP expiration date updates
window.debugVipExpiration = async function(userId) {
  try {
    console.log('Debugging VIP expiration for user:', userId);
    
    // Get current profile data
    const { data: profile, error } = await window.supabase
      .from('profiles')
      .select('role, expiration_date')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    
    console.log('Current profile data:', profile);
    
    if (profile.role === 'vip' && profile.expiration_date) {
      console.log('VIP expiration date:', new Date(profile.expiration_date).toLocaleString());
    } else if (profile.role === 'vip') {
      console.log('User is VIP but has no expiration date');
    } else {
      console.log('User is not VIP');
    }
  } catch (e) {
    console.error('Debug error:', e);
  }
};
