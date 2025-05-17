
// Module for VIP related functionality

// Function to request VIP status
async function requestVipStatus() {
  try {
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError) throw userError;
    if (!user) throw new Error("User not authenticated");
    
    // Update profile to set requested_vip flag
    const { error } = await window.supabase
      .from('profiles')
      .update({ requested_vip: true })
      .eq('id', user.id);
    
    if (error) throw error;
    
    console.log("VIP status requested successfully");
    return true;
  } catch (error) {
    console.error("Error requesting VIP status:", error);
    throw error;
  }
}

// Export functions for external use
export { requestVipStatus };
