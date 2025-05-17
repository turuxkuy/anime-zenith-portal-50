
// Supabase configuration
const supabaseUrl = 'https://eguwfitbjuzzwbgalwcx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndXdmaXRianV6endiZ2Fsd2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDQ4OTgsImV4cCI6MjA2MjEyMDg5OH0.nYgvViJgO67L5nNYEejoW5KajcXlryTThTzA1bvUO9k';

// Initialize Supabase client
console.log("Initializing Supabase client...");

try {
  // Create the Supabase client
  window.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: window.localStorage
    }
  });
  
  console.log('Supabase client initialized successfully');
  
  // Test connection
  window.supabase
    .from('donghua')
    .select('count', { count: 'exact', head: true })
    .then(result => {
      console.log('Connection test result:', result);
    })
    .catch(err => {
      console.error('Connection test failed:', err);
    });
    
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

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

// Function to check if logged in - can be used across pages
async function checkLoginStatus() {
  try {
    if (typeof window.supabase === 'undefined') {
      console.error('Supabase is not defined in checkLoginStatus');
      return false;
    }
    
    const { data, error } = await window.supabase.auth.getSession();
    
    console.log('Auth session check:', data.session ? 'Session exists' : 'No session found');
    
    if (error) {
      console.error('Auth session error:', error);
      return false;
    }
    
    return !!data.session;
  } catch (err) {
    console.error('Error checking auth status:', err);
    return false;
  }
}

// Function to get user details - for displaying username, etc.
async function getCurrentUser() {
  try {
    if (typeof window.supabase === 'undefined') {
      console.error('Supabase is not defined in getCurrentUser');
      return null;
    }
    
    const { data, error } = await window.supabase.auth.getSession();
    
    if (error || !data.session) {
      console.log('No current user found');
      return null;
    }
    
    console.log('Current user ID:', data.session.user.id);
    return data.session.user;
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}
