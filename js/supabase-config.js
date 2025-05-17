
// Supabase client configuration
const SUPABASE_URL = "https://eguwfitbjuzzwbgalwcx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndXdmaXRianV6endiZ2Fsd2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDQ4OTgsImV4cCI6MjA2MjEyMDg5OH0.nYgvViJgO67L5nNYEejoW5KajcXlryTThTzA1bvUO9k";

// Initialize the Supabase client
window.supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    storageKey: 'zenith-donghua-auth'
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  }
});

// Test connection to Supabase
console.log("Initializing Supabase connection...");
window.supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth state changed:", event, session ? "User is logged in" : "No active session");
});

// Function to update user role (admin only)
async function updateUserRole(userId, newRole, adminId) {
  try {
    // Validate inputs
    if (!userId || !newRole || !adminId) {
      throw new Error('Missing required fields');
    }
    
    // Check if admin is authenticated
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Admin not authenticated');
    }
    
    // Verify that the current user is an admin
    const { data: adminData, error: adminError } = await window.supabase
      .from('profiles')
      .select('role')
      .eq('id', adminId)
      .single();
      
    if (adminError || !adminData || adminData.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can update user roles');
    }
    
    // Validate that newRole is one of allowed values
    const validRoles = ['user', 'vip', 'admin'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role specified');
    }
    
    // Update user role
    const { data, error } = await window.supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select();
      
    if (error) {
      throw error;
    }
    
    console.log('Role update successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}
